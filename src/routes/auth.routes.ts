import { Router } from 'express';
import {
  registerPlatformUser,
  loginPlatformUser,
  verifyPlatformUserOtp,
  forgotPlatformPassword,
  resetPlatformPassword,
  getMe,
  getMyPlatformProfile,
  updateMyPlatformProfile,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', registerPlatformUser);
router.post('/login', loginPlatformUser);
router.post('/verify-otp', verifyPlatformUserOtp);

router.post('/forgot-password', forgotPlatformPassword);
router.post('/reset-password', resetPlatformPassword);

router.get('/me', requireAuth, getMe);
router.get('/me/profile', requireAuth, getMyPlatformProfile);
router.patch('/me', requireAuth, updateMyPlatformProfile);

export default router;