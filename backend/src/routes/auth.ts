import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authenticate, rateLimit } from '../middleware/auth';

const router = Router();

// Apply rate limiting to auth routes
router.use(rateLimit(10, 900000)); // 10 requests per 15 minutes

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);
router.post('/refresh-token', authenticate, authController.refreshToken);
router.delete('/account', authenticate, authController.deleteAccount);

export default router;
