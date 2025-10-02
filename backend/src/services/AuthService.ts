import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Portfolio } from '../models/Portfolio';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types';

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  // Register new user
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Create new user
      const user = new User({
        email: userData.email.toLowerCase(),
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        riskTolerance: userData.riskTolerance,
        investmentGoals: []
      });

      await user.save();

      // Create default portfolio for user
      const portfolio = new Portfolio({
        userId: user._id,
        holdings: [],
        totalValue: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0
      });

      await portfolio.save();

      // Update user with portfolio reference
      user.portfolio = portfolio._id;
      await user.save();

      // Generate JWT token
      const token = this.generateToken(user._id.toString());

      return {
        user: user.toJSON(),
        token
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await User.findOne({ email: credentials.email.toLowerCase() })
        .populate('portfolio');
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(credentials.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = this.generateToken(user._id.toString());

      return {
        user: user.toJSON(),
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      const user = await User.findById(decoded.userId).populate('portfolio');
      
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      console.error('Token verification error:', error);
      throw new Error('Invalid token');
    }
  }

  // Refresh token
  async refreshToken(userId: string): Promise<string> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return this.generateToken(userId);
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userId: string, updateData: Partial<RegisterRequest>): Promise<any> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update allowed fields
      if (updateData.firstName) user.firstName = updateData.firstName;
      if (updateData.lastName) user.lastName = updateData.lastName;
      if (updateData.riskTolerance) user.riskTolerance = updateData.riskTolerance;

      await user.save();
      return user.toJSON();
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Delete user account
  async deleteAccount(userId: string, password: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Password is incorrect');
      }

      // Delete user's portfolio
      await Portfolio.findOneAndDelete({ userId });

      // Delete user
      await User.findByIdAndDelete(userId);
    } catch (error) {
      console.error('Account deletion error:', error);
      throw error;
    }
  }

  // Generate JWT token
  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generate password reset token
  async generatePasswordResetToken(email: string): Promise<string> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new Error('User not found');
      }

      // Generate reset token (expires in 1 hour)
      const resetToken = jwt.sign(
        { userId: user._id, type: 'password-reset' },
        this.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // In a real application, you would send this token via email
      // For now, we'll just return it
      return resetToken;
    } catch (error) {
      console.error('Password reset token generation error:', error);
      throw error;
    }
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      if (decoded.type !== 'password-reset') {
        throw new Error('Invalid reset token');
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.password = newPassword;
      await user.save();
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(userId: string): Promise<any> {
    try {
      const user = await User.findById(userId).populate('portfolio');
      if (!user) {
        throw new Error('User not found');
      }

      const portfolio = await Portfolio.findById(user.portfolio);
      
      return {
        user: user.toJSON(),
        portfolio: portfolio ? {
          totalValue: portfolio.totalValue,
          totalGainLoss: portfolio.totalGainLoss,
          totalGainLossPercent: portfolio.totalGainLossPercent,
          holdingsCount: portfolio.holdings.length
        } : null,
        accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) // days
      };
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
