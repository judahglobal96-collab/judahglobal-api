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

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpExpiry(minutes = 10): string {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + minutes);
  return expires.toISOString();
}

function getPasswordResetExpiry(minutes = 60): string {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + minutes);
  return expires.toISOString();
}

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signJwt(user: { id: string; email: string; role: string }) {
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

export async function registerPlatformUser(req: Request, res: Response) {
  try {
    const {
      firstName,
      lastName,
      dobMonth,
      dobYear,
      city,
      stateRegion,
      email,
      password,
    } = req.body;

    if (!firstName || !lastName || !dobMonth || !dobYear || !email || !password) {
      return res.status(400).json({
        message: 'Missing required fields.',
      });
    }

    const existingUser = await findPlatformUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with that email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await createPlatformUser({
      firstName,
      lastName,
      dobMonth: Number(dobMonth),
      dobYear: Number(dobYear),
      city,
      stateRegion,
      email,
      passwordHash,
      role: 'user',
    });

    const otpCode = generateOtpCode();
    const expiresAt = getOtpExpiry(10);

    await setTwoFactorCode(newUser.id, otpCode, expiresAt);

    console.log('[PLATFORM REGISTER OTP]', {
      email: newUser.email,
      otpCode,
      expiresAt,
    });

    return res.status(201).json({
      message: 'Registration successful. OTP verification required.',
      requiresOtp: true,
      email: newUser.email,
    });
  } catch (error) {
    console.error('registerPlatformUser error:', error);
    return res.status(500).json({
      message: 'Registration failed.',
    });
  }
}

export async function loginPlatformUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.',
      });
    }

    console.log('[PLATFORM LOGIN] Attempting login for email:', email);

    let user;

    try {
      user = await findPlatformUserByEmail(email);
      console.log('[PLATFORM LOGIN] DB query completed. User found:', !!user);
    } catch (dbError) {
      const err = dbError as Error;
      console.error('[PLATFORM LOGIN] DB query failed:', {
        message: err.message,
        stack: err.stack,
        email,
      });
      throw dbError;
    }

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    const otpCode = generateOtpCode();
    const expiresAt = getOtpExpiry(10);

    await setTwoFactorCode(user.id, otpCode, expiresAt);

    console.log('[PLATFORM LOGIN OTP]', {
      email: user.email,
      otpCode,
      expiresAt,
    });

    return res.status(200).json({
      message: 'OTP verification required.',
      requiresOtp: true,
      email: user.email,
    });
  } catch (error) {
    const err = error as Error;

    console.error('[PLATFORM LOGIN] loginPlatformUser error:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      email: req.body?.email,
    });

    return res.status(500).json({
      message: 'Login failed.',
    });
  }
}

export async function verifyPlatformUserOtp(req: Request, res: Response) {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({
        message: 'Email and OTP code are required.',
      });
    }

    const user = await findPlatformUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    if (!user.two_factor_code || !user.two_factor_expires_at) {
      return res.status(400).json({
        message: 'No OTP is pending for this account.',
      });
    }

    const now = new Date();
    const expiresAt = new Date(user.two_factor_expires_at);

    if (now > expiresAt) {
      return res.status(400).json({
        message: 'OTP code has expired.',
      });
    }

    if (user.two_factor_code !== otpCode) {
      return res.status(401).json({
        message: 'Invalid OTP code.',
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

export async function forgotPlatformPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required.',
      });
    }

    const genericMessage =
      'If an account exists for that email, a password reset link has been sent.';

    const user = await findPlatformUserByEmail(email);

    if (!user) {
      return res.status(200).json({
        message: genericMessage,
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashResetToken(resetToken);
    const expiresAt = getPasswordResetExpiry(60);

    await setPasswordResetToken(user.id, resetTokenHash, expiresAt);

    const appBaseUrl =
      process.env.APP_BASE_URL ||
      process.env.FRONTEND_BASE_URL ||
      'https://app.judahglobal.org';

    const resetUrl = `${appBaseUrl}/reset-password?token=${resetToken}`;

    console.log('[PLATFORM PASSWORD RESET LINK]', {
      email: user.email,
      resetUrl,
      expiresAt,
    });

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

export async function resetPlatformPassword(req: Request, res: Response) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: 'Reset token and new password are required.',
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters.',
      });
    }

    const tokenHash = hashResetToken(token);
    const user = await findPlatformUserByPasswordResetTokenHash(tokenHash);

    if (!user || !user.password_reset_expires_at) {
      return res.status(400).json({
        message: 'Invalid or expired password reset token.',
      });
    }

    const now = new Date();
    const expiresAt = new Date(user.password_reset_expires_at);

    if (now > expiresAt) {
      await clearPasswordResetToken(user.id);

      return res.status(400).json({
        message: 'Invalid or expired password reset token.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await updatePlatformUserPassword(user.id, passwordHash);
    await clearPasswordResetToken(user.id);
    await clearTwoFactorCode(user.id);

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    console.error('resetPlatformPassword error:', error);
    return res.status(500).json({
      message: 'Password reset failed.',
    });
  }
}

export async function getMe(req: Request, res: Response) {
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

export async function getMyPlatformProfile(req: Request, res: Response) {
  try {
    const authUser = (req as any).user;

    if (!authUser?.id) {
      return res.status(401).json({
        message: 'Unauthorized.',
      });
    }

    const user = await findPlatformUserProfileById(authUser.id);

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

export async function updateMyPlatformProfile(req: Request, res: Response) {
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

    if (!firstName || !lastName || !dobMonth || !dobYear) {
      return res.status(400).json({
        message: 'First name, last name, birth month, and birth year are required.',
      });
    }

    const updatedUser = await updatePlatformUserProfile(authUser.id, {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      dobMonth: Number(dobMonth),
      dobYear: Number(dobYear),
      city: city ? String(city).trim() : '',
      stateRegion: stateRegion ? String(stateRegion).trim() : '',
    });

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