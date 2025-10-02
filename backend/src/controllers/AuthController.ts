import { Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { ApiResponse, LoginRequest, RegisterRequest } from '../types';
import Joi from 'joi';

export class AuthController {
  // Validation schemas
  private registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    riskTolerance: Joi.string().valid('conservative', 'moderate', 'aggressive').required()
  });

  private loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  private changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  });

  private updateProfileSchema = Joi.object({
    firstName: Joi.string().min(1).max(50),
    lastName: Joi.string().min(1).max(50),
    riskTolerance: Joi.string().valid('conservative', 'moderate', 'aggressive')
  });

  // Register new user
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = this.registerSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details.map(detail => detail.message),
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // Validate password strength
      const passwordValidation = authService.validatePassword(value.password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Password validation failed',
          details: passwordValidation.errors,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await authService.register(value as RegisterRequest);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Registration failed',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Login user
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = this.loginSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details.map(detail => detail.message),
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await authService.login(value as LoginRequest);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Login failed',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Get current user profile
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const stats = await authService.getUserStats(req.user._id.toString());
      
      res.status(200).json({
        success: true,
        data: stats,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get profile',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Update user profile
  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // Validate request body
      const { error, value } = this.updateProfileSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details.map(detail => detail.message),
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const updatedUser = await authService.updateProfile(req.user._id.toString(), value);
      
      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update profile',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Change password
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // Validate request body
      const { error, value } = this.changePasswordSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details.map(detail => detail.message),
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // Validate new password strength
      const passwordValidation = authService.validatePassword(value.newPassword);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Password validation failed',
          details: passwordValidation.errors,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      await authService.changePassword(
        req.user._id.toString(),
        value.currentPassword,
        value.newPassword
      );
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to change password',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Refresh token
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const newToken = await authService.refreshToken(req.user._id.toString());
      
      res.status(200).json({
        success: true,
        data: { token: newToken },
        message: 'Token refreshed successfully',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to refresh token',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Request password reset
  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      if (!authService.validateEmail(email)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email format',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const resetToken = await authService.generatePasswordResetToken(email);
      
      // In a real application, you would send this token via email
      // For development purposes, we'll return it in the response
      res.status(200).json({
        success: true,
        data: { resetToken }, // Remove this in production
        message: 'Password reset token generated. Check your email for instructions.',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Request password reset error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to request password reset',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Reset password with token
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Token and new password are required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // Validate new password strength
      const passwordValidation = authService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Password validation failed',
          details: passwordValidation.errors,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      await authService.resetPassword(token, newPassword);
      
      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to reset password',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Delete user account
  deleteAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const { password } = req.body;
      
      if (!password) {
        res.status(400).json({
          success: false,
          error: 'Password is required to delete account',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      await authService.deleteAccount(req.user._id.toString(), password);
      
      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Delete account error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete account',
        timestamp: new Date()
      } as ApiResponse);
    }
  };
}

export const authController = new AuthController();
