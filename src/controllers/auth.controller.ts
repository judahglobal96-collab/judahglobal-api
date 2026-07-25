import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';

import {
  createPlatformUser,
  findPlatformUserByEmail,
  findPlatformUserProfileById,
  setTwoFactorCode,
  clearTwoFactorCode,
  verifyPlatformUserEmail,
  updatePlatformUserProfile,
  setPasswordResetToken,
  findPlatformUserByPasswordResetTokenHash,
  updatePlatformUserPassword,
  clearPasswordResetToken,
} from '../models/platform-user.model';

import { sendOtpEmail } from '../services/otp.service';
import { sendPasswordResetEmail } from '../services/password-reset.service';

const OTP_EXPIRY_MINUTES = 10;
const PASSWORD_RESET_EXPIRY_MINUTES = 60;

function normalizeEmail(email: unknown): string {
  return String(email ?? '').trim().toLowerCase();
}

function generateOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function getOtpExpiry(minutes = OTP_EXPIRY_MINUTES): string {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + minutes);

  return expires.toISOString();
}

function getPasswordResetExpiry(
  minutes = PASSWORD_RESET_EXPIRY_MINUTES
): string {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + minutes);

  return expires.toISOString();
}

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signJwt(user: {
  id: string;
  email: string;
  role: string;
}): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    {
      expiresIn: '7d',
    }
  );
}

/**
 * Register a new Judah Global platform user.
 *
 * POST /auth/register
 */
export async function registerPlatformUser(
  req: Request,
  res: Response
) {
  try {
    const {
      firstName,
      lastName,
      dobMonth,
      dobYear,
      city,
      stateRegion,
      password,
    } = req.body;

    const email = normalizeEmail(req.body?.email);

    if (
      !firstName ||
      !lastName ||
      !dobMonth ||
      !dobYear ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message: 'Missing required fields.',
      });
    }

    const numericDobMonth = Number(dobMonth);
    const numericDobYear = Number(dobYear);

    if (
      !Number.isInteger(numericDobMonth) ||
      numericDobMonth < 1 ||
      numericDobMonth > 12
    ) {
      return res.status(400).json({
        message: 'Birth month must be between 1 and 12.',
      });
    }

    if (
      !Number.isInteger(numericDobYear) ||
      numericDobYear < 1900 ||
      numericDobYear > new Date().getFullYear()
    ) {
      return res.status(400).json({
        message: 'Please provide a valid birth year.',
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters.',
      });
    }

    const existingUser = await findPlatformUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with that email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);

    const newUser = await createPlatformUser({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      dobMonth: numericDobMonth,
      dobYear: numericDobYear,
      city: city ? String(city).trim() : '',
      stateRegion: stateRegion ? String(stateRegion).trim() : '',
      email,
      passwordHash,
      role: 'user',
    });

    const otpCode = generateOtpCode();
    const expiresAt = getOtpExpiry();

    console.log('[PLATFORM REGISTER OTP]', {
      email: newUser.email,
      otpCode,
      expiresAt, 
    });
    await setTwoFactorCode(newUser.id, otpCode, expiresAt);

    try {
      await sendOtpEmail(newUser.email, otpCode);
    } catch (emailError) {
      console.error(
        '[PLATFORM REGISTER OTP EMAIL ERROR]',
        emailError
      );

      await clearTwoFactorCode(newUser.id);

      return res.status(500).json({
        message:
          'Registration was created, but the verification email could not be sent. Please request a new verification code.',
        requiresOtp: true,
        email: newUser.email,
      });
    }

    return res.status(201).json({
      message: 'Registration successful. OTP verification required.',
      requiresOtp: true,
      email: newUser.email,
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
    });
  } catch (error) {
    console.error('registerPlatformUser error:', error);

    return res.status(500).json({
      message: 'Registration failed.',
    });
  }
}

/**
 * Authenticate a Judah Global platform user with email and password.
 *
 * A valid password generates a new OTP. Any previously stored OTP is
 * overwritten and therefore becomes invalid.
 *
 * POST /auth/login
 */
export async function loginPlatformUser(
  req: Request,
  res: Response
) {
  const email = normalizeEmail(req.body?.email);

  try {
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.',
      });
    }

    let user;

    try {
      user = await findPlatformUserByEmail(email);
    } catch (dbError) {
      const error = dbError as Error;

      console.error('[PLATFORM LOGIN DATABASE ERROR]', {
        message: error.message,
        stack: error.stack,
      });

      throw dbError;
    }

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    const passwordMatches = await bcrypt.compare(
      String(password),
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    if (user.is_active === false) {
      return res.status(403).json({
        message:
          'This account is currently inactive. Please contact Judah Global support.',
      });
    }

    const otpCode = generateOtpCode();
    const expiresAt = getOtpExpiry();

    await setTwoFactorCode(user.id, otpCode, expiresAt);

    try {
      await sendOtpEmail(user.email, otpCode);
    } catch (emailError) {
      console.error(
        '[PLATFORM LOGIN OTP EMAIL ERROR]',
        emailError
      );

      await clearTwoFactorCode(user.id);

      return res.status(500).json({
        message:
          'Your verification code could not be sent. Please try again.',
      });
    }

    return res.status(200).json({
      message: 'OTP verification required.',
      requiresOtp: true,
      email: user.email,
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
    });
  } catch (error) {
    const loginError = error as Error;

    console.error('[PLATFORM LOGIN ERROR]', {
      message: loginError.message,
      stack: loginError.stack,
      name: loginError.name,
    });

    return res.status(500).json({
      message: 'Login failed.',
    });
  }
}

/**
 * Resend an OTP for a pending registration or login.
 *
 * The response is intentionally generic so the endpoint does not reveal
 * whether an email address belongs to a Judah Global account.
 *
 * POST /auth/resend-otp
 */
export async function resendPlatformUserOtp(
  req: Request,
  res: Response
) {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({
        message: 'Email is required.',
      });
    }

    const genericMessage =
      'If an eligible account exists, a new verification code has been sent.';

    const user = await findPlatformUserByEmail(email);

    if (!user || user.is_active === false) {
      return res.status(200).json({
        message: genericMessage,
        expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
      });
    }

    const otpCode = generateOtpCode();
    const expiresAt = getOtpExpiry();

    /*
     * setTwoFactorCode must update the existing stored OTP and expiration.
     * This makes every previously issued OTP invalid.
     */
    await setTwoFactorCode(user.id, otpCode, expiresAt);

    try {
      await sendOtpEmail(user.email, otpCode);
    } catch (emailError) {
      console.error(
        '[PLATFORM RESEND OTP EMAIL ERROR]',
        emailError
      );

      await clearTwoFactorCode(user.id);

      return res.status(500).json({
        message:
          'The verification code could not be sent. Please try again.',
      });
    }

    return res.status(200).json({
      message: genericMessage,
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
    });
  } catch (error) {
    console.error('resendPlatformUserOtp error:', error);

    return res.status(500).json({
      message: 'Unable to resend the verification code.',
    });
  }
}

/**
 * Verify the OTP sent during registration, login, or resend.
 *
 * POST /auth/verify-otp
 */
export async function verifyPlatformUserOtp(
  req: Request,
  res: Response
) {
  try {
    const email = normalizeEmail(req.body?.email);
    const otpCode = String(req.body?.otpCode ?? '').trim();

    if (!email || !otpCode) {
      return res.status(400).json({
        message: 'Email and OTP code are required.',
      });
    }

    if (!/^\d{6}$/.test(otpCode)) {
      return res.status(400).json({
        message: 'OTP code must contain exactly 6 digits.',
      });
    }

    const user = await findPlatformUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: 'Invalid or expired OTP code.',
      });
    }

    if (user.is_active === false) {
      return res.status(403).json({
        message:
          'This account is currently inactive. Please contact Judah Global support.',
      });
    }

    if (
      !user.two_factor_code ||
      !user.two_factor_expires_at
    ) {
      return res.status(400).json({
        message:
          'No verification code is pending. Please request a new code.',
      });
    }

    const now = new Date();
    const expiresAt = new Date(user.two_factor_expires_at);

    if (
      Number.isNaN(expiresAt.getTime()) ||
      now.getTime() > expiresAt.getTime()
    ) {
      await clearTwoFactorCode(user.id);

      return res.status(400).json({
        message:
          'The verification code has expired. Please request a new code.',
      });
    }

    const storedOtp = String(user.two_factor_code).trim();

    const submittedBuffer = Buffer.from(otpCode);
    const storedBuffer = Buffer.from(storedOtp);

    const otpMatches =
      submittedBuffer.length === storedBuffer.length &&
      crypto.timingSafeEqual(submittedBuffer, storedBuffer);

    if (!otpMatches) {
      return res.status(401).json({
        message: 'Invalid or expired OTP code.',
      });
    }

    await clearTwoFactorCode(user.id);

    if (!user.is_email_verified) {
      await verifyPlatformUserEmail(user.id);
    }

    const token = signJwt({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        isEmailVerified: true,
      },
    });
  } catch (error) {
    console.error('verifyPlatformUserOtp error:', error);

    return res.status(500).json({
      message: 'OTP verification failed.',
    });
  }
}

/**
 * Request a password-reset email.
 *
 * Repeated requests generate a new token and overwrite the previous
 * password-reset token, invalidating every earlier reset link.
 *
 * POST /auth/forgot-password
 */
export async function forgotPlatformPassword(
  req: Request,
  res: Response
) {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({
        message: 'Email is required.',
      });
    }

    const genericMessage =
      'If an account exists for that email, a password reset link has been sent.';

    const user = await findPlatformUserByEmail(email);

    if (!user || user.is_active === false) {
      return res.status(200).json({
        message: genericMessage,
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashResetToken(resetToken);
    const expiresAt = getPasswordResetExpiry();

    await setPasswordResetToken(
      user.id,
      resetTokenHash,
      expiresAt
    );

    const appBaseUrl = (
      process.env.APP_BASE_URL ||
      process.env.FRONTEND_BASE_URL ||
      'https://app.judahglobal.org'
    ).replace(/\/+$/, '');

    const resetUrl =
      `${appBaseUrl}/reset-password` +
      `?token=${encodeURIComponent(resetToken)}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailError) {
      /*
       * Do not return a different response for existing and nonexistent
       * accounts. A different response could expose registered emails.
       */
      console.error(
        '[PLATFORM PASSWORD RESET EMAIL ERROR]',
        emailError
      );

      await clearPasswordResetToken(user.id);
    }

    return res.status(200).json({
      message: genericMessage,
    });
  } catch (error) {
    console.error('forgotPlatformPassword error:', error);

    return res.status(500).json({
      message: 'Password reset request failed.',
    });
  }
}

/**
 * Complete a password reset using a valid reset token.
 *
 * POST /auth/reset-password
 */
export async function resetPlatformPassword(
  req: Request,
  res: Response
) {
  try {
    const token = String(req.body?.token ?? '').trim();
    const password = String(req.body?.password ?? '');

    if (!token || !password) {
      return res.status(400).json({
        message: 'Reset token and new password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters.',
      });
    }

    const tokenHash = hashResetToken(token);

    const user =
      await findPlatformUserByPasswordResetTokenHash(tokenHash);

    if (!user || !user.password_reset_expires_at) {
      return res.status(400).json({
        message: 'Invalid or expired password reset token.',
      });
    }

    const now = new Date();
    const expiresAt = new Date(
      user.password_reset_expires_at
    );

    if (
      Number.isNaN(expiresAt.getTime()) ||
      now.getTime() > expiresAt.getTime()
    ) {
      await clearPasswordResetToken(user.id);

      return res.status(400).json({
        message: 'Invalid or expired password reset token.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await updatePlatformUserPassword(
      user.id,
      passwordHash
    );

    /*
     * The reset token is single use. Clearing the OTP also prevents a code
     * issued before the password change from being used afterward.
     */
    await clearPasswordResetToken(user.id);
    await clearTwoFactorCode(user.id);

    return res.status(200).json({
      success: true,
      message:
        'Password updated successfully. Please sign in with your new password.',
    });
  } catch (error) {
    console.error('resetPlatformPassword error:', error);

    return res.status(500).json({
      message: 'Password reset failed.',
    });
  }
}

/**
 * Return the authenticated platform user's core authorization data.
 *
 * GET /auth/me
 */
export async function getMe(
  req: Request,
  res: Response
) {
  try {
    const authUser = (req as any).user;

    if (!authUser?.id) {
      return res.status(401).json({
        message: 'Unauthorized.',
      });
    }

    return res.status(200).json({
      id: authUser.id,
      email: authUser.email,
      role: authUser.role,
      is_active: authUser.is_active,
    });
  } catch (error) {
    console.error('getMe error:', error);

    return res.status(500).json({
      message: 'Failed to fetch auth user.',
    });
  }
}

/**
 * Return the authenticated user's complete Judah Global profile.
 *
 * GET /auth/profile
 */
export async function getMyPlatformProfile(
  req: Request,
  res: Response
) {
  try {
    const authUser = (req as any).user;

    if (!authUser?.id) {
      return res.status(401).json({
        message: 'Unauthorized.',
      });
    }

    const user =
      await findPlatformUserProfileById(authUser.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        dobMonth: user.dob_month,
        dobYear: user.dob_year,
        city: user.city,
        stateRegion: user.state_region,
        email: user.email,
        role: user.role,
        isEmailVerified: user.is_email_verified,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        hasOrgAccount: user.has_org_account,
        organizationId: user.organization_id,
        organizationUuid: user.organization_uuid,
        organizationName: user.organization_name,
        organizationStatus: user.organization_status,
        subscriptionStatus: user.subscription_status,
      },
    });
  } catch (error) {
    console.error('getMyPlatformProfile error:', error);

    return res.status(500).json({
      message: 'Failed to load profile.',
    });
  }
}

/**
 * Update the authenticated user's Judah Global platform profile.
 *
 * PATCH /auth/profile
 */
export async function updateMyPlatformProfile(
  req: Request,
  res: Response
) {
  try {
    const authUser = (req as any).user;

    if (!authUser?.id) {
      return res.status(401).json({
        message: 'Unauthorized.',
      });
    }

    const {
      firstName,
      lastName,
      dobMonth,
      dobYear,
      city,
      stateRegion,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !dobMonth ||
      !dobYear
    ) {
      return res.status(400).json({
        message:
          'First name, last name, birth month, and birth year are required.',
      });
    }

    const numericDobMonth = Number(dobMonth);
    const numericDobYear = Number(dobYear);

    if (
      !Number.isInteger(numericDobMonth) ||
      numericDobMonth < 1 ||
      numericDobMonth > 12
    ) {
      return res.status(400).json({
        message: 'Birth month must be between 1 and 12.',
      });
    }

    if (
      !Number.isInteger(numericDobYear) ||
      numericDobYear < 1900 ||
      numericDobYear > new Date().getFullYear()
    ) {
      return res.status(400).json({
        message: 'Please provide a valid birth year.',
      });
    }

    const updatedUser = await updatePlatformUserProfile(
      authUser.id,
      {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        dobMonth: numericDobMonth,
        dobYear: numericDobYear,
        city: city ? String(city).trim() : '',
        stateRegion: stateRegion
          ? String(stateRegion).trim()
          : '',
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        dobMonth: updatedUser.dob_month,
        dobYear: updatedUser.dob_year,
        city: updatedUser.city,
        stateRegion: updatedUser.state_region,
        email: updatedUser.email,
        role: updatedUser.role,
        isEmailVerified: updatedUser.is_email_verified,
        lastLoginAt: updatedUser.last_login_at,
        createdAt: updatedUser.created_at,
      },
    });
  } catch (error) {
    console.error('updateMyPlatformProfile error:', error);

    return res.status(500).json({
      message: 'Failed to update profile.',
    });
  }
}