import { Router } from 'express';
import {
  registerPlatformUser,
  loginPlatformUser,
  verifyPlatformUserOtp,
  getMe,
  getMyPlatformProfile,
  updateMyPlatformProfile,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', registerPlatformUser);
router.post('/login', loginPlatformUser);
router.post('/verify-otp', verifyPlatformUserOtp);
router.get('/me', requireAuth, getMe);              // lightweight auth check
router.get('/me/profile', requireAuth, getMyPlatformProfile); // full profile
router.patch('/me', requireAuth, updateMyPlatformProfile);


export default router;