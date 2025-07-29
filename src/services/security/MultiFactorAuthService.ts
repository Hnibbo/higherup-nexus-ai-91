/**
 * Multi-Factor Authentication Service
 * Comprehensive MFA system with multiple authentication methods
 */
import { productionDatabaseService } from '@/services/database/ProductionDatabaseService';
import { redisCacheService } from '@/services/database/RedisCache';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export interface MFAMethod {
  id: string;
  userId: string;
  type: 'totp' | 'sms' | 'email' | 'backup_codes' | 'hardware_key' | 'biometric';
  name: string;
  isEnabled: boolean;
  isPrimary: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  lastUsed?: Date;
  verificationCount: number;
}

export interface TOTPSecret {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  issuer: string;
  accountName: string;
}

export interface MFAChallenge {
  id: string;
  userId: string;
  methodId: string;
  type: MFAMethod['type'];
  challenge: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface MFAVerification {
  challengeId: string;
  code: string;
  deviceInfo?: {
    userAgent: string;
    ipAddress: string;
    fingerprint: string;
  };
}

export interface MFASession {
  id: string;
  userId: string;
  methodUsed: string;
  verifiedAt: Date;
  expiresAt: Date;
  deviceTrusted: boolean;
  riskScore: number;
  metadata: Record<string, any>;
}

export interface BiometricData {
  type: 'fingerprint' | 'face' | 'voice' | 'iris';
  template: string; // Encrypted biometric template
  confidence: number;
  deviceId: string;
  enrolledAt: Date;
}

/**
 * Multi-Factor Authentication Service
 */
export class MultiFactorAuthService {
  private static instance: MultiFactorAuthService;
  private mfaMethods: Map<string, MFAMethod[]> = new Map(); // userId -> methods
  private activeChallenges: Map<string, MFAChallenge> = new Map();
  private mfaSessions: Map<string, MFASession> = new Map();
  private biometricData: Map<string, BiometricData[]> = new Map();

  private constructor() {
    this.initializeMFAService();
  }

  public static getInstance(): MultiFactorAuthService {
    if (!MultiFactorAuthService.instance) {
      MultiFactorAuthService.instance = new MultiFactorAuthService();
    }
    return MultiFactorAuthService.instance;
  }

  private async initializeMFAService(): Promise<void> {
    console.log('🔐 Initializing Multi-Factor Authentication Service');
    
    // Load existing MFA methods
    await this.loadMFAMethods();
    
    // Start cleanup tasks
    this.startCleanupTasks();
    
    console.log('✅ Multi-Factor Authentication Service initialized');
  }

  /**
   * Setup TOTP (Time-based One-Time Password) for user
   */
  async setupTOTP(userId: string, accountName: string): Promise<TOTPSecret> {
    try {
      console.log(`🔑 Setting up TOTP for user: ${userId}`);
      
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: accountName,
        issuer: 'HigherUp.ai',
        length: 32
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Create MFA method
      const mfaMethod: MFAMethod = {
        id: `mfa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        type: 'totp',
        name: 'Authenticator App',
        isEnabled: false, // Will be enabled after verification
        isPrimary: false,
        metadata: {
          secret: secret.base32,
          backupCodes: backupCodes.map(code => this.hashBackupCode(code))
        },
        createdAt: new Date(),
        verificationCount: 0
      };

      // Store method
      await this.storeMFAMethod(mfaMethod);
      
      const totpSecret: TOTPSecret = {
        secret: secret.base32!,
        qrCodeUrl,
        backupCodes,
        issuer: 'HigherUp.ai',
        accountName
      };

      console.log(`✅ TOTP setup completed for user: ${userId}`);
      return totpSecret;
    } catch (error) {
      console.error('❌ Failed to setup TOTP:', error);
      throw error;
    }
  }

  /**
   * Verify TOTP setup
   */
  async verifyTOTPSetup(userId: string, token: string): Promise<boolean> {
    try {
      console.log(`🔍 Verifying TOTP setup for user: ${userId}`);
      
      const methods = this.mfaMethods.get(userId) || [];
      const totpMethod = methods.find(m => m.type === 'totp' && !m.isEnabled);
      
      if (!totpMethod) {
        throw new Error('No pending TOTP setup found');
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret: totpMethod.metadata.secret,
        encoding: 'base32',
        token,
        window: 2 // Allow 2 time steps tolerance
      });

      if (verified) {
        // Enable the method
        totpMethod.isEnabled = true;
        totpMethod.lastUsed = new Date();
        totpMethod.verificationCount++;
        
        // Make it primary if it's the first MFA method
        if (methods.filter(m => m.isEnabled).length === 0) {
          totpMethod.isPrimary = true;
        }
        
        await this.updateMFAMethod(totpMethod);
        console.log(`✅ TOTP setup verified for user: ${userId}`);
        return true;
      }

      console.log(`❌ TOTP verification failed for user: ${userId}`);
      return false;
    } catch (error) {
      console.error('❌ Failed to verify TOTP setup:', error);
      throw error;
    }
  }

  /**
   * Setup SMS MFA
   */
  async setupSMS(userId: string, phoneNumber: string): Promise<string> {
    try {
      console.log(`📱 Setting up SMS MFA for user: ${userId}`);
      
      // Validate phone number format
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      // Create MFA method
      const mfaMethod: MFAMethod = {
        id: `mfa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        type: 'sms',
        name: `SMS to ${this.maskPhoneNumber(phoneNumber)}`,
        isEnabled: false,
        isPrimary: false,
        metadata: {
          phoneNumber: this.encryptPhoneNumber(phoneNumber)
        },
        createdAt: new Date(),
        verificationCount: 0
      };

      // Store method
      await this.storeMFAMethod(mfaMethod);
      
      // Send verification SMS
      const verificationCode = await this.sendSMSVerification(phoneNumber);
      
      console.log(`✅ SMS MFA setup initiated for user: ${userId}`);
      return mfaMethod.id;
    } catch (error) {
      console.error('❌ Failed to setup SMS MFA:', error);
      throw error;
    }
  }

  /**
   * Create MFA challenge
   */
  async createChallenge(userId: string, methodId?: string): Promise<MFAChallenge> {
    try {
      console.log(`🎯 Creating MFA challenge for user: ${userId}`);
      
      const methods = this.mfaMethods.get(userId) || [];
      const enabledMethods = methods.filter(m => m.isEnabled);
      
      if (enabledMethods.length === 0) {
        throw new Error('No MFA methods enabled for user');
      }

      // Select method
      let selectedMethod: MFAMethod;
      if (methodId) {
        selectedMethod = enabledMethods.find(m => m.id === methodId)!;
        if (!selectedMethod) {
          throw new Error('Specified MFA method not found or not enabled');
        }
      } else {
        // Use primary method or first available
        selectedMethod = enabledMethods.find(m => m.isPrimary) || enabledMethods[0];
      }

      // Create challenge
      const challenge: MFAChallenge = {
        id: `challenge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        methodId: selectedMethod.id,
        type: selectedMethod.type,
        challenge: await this.generateChallenge(selectedMethod),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        attempts: 0,
        maxAttempts: 3,
        isUsed: false,
        metadata: {},
        createdAt: new Date()
      };

      // Store challenge
      this.activeChallenges.set(challenge.id, challenge);
      await this.storeMFAChallenge(challenge);
      
      console.log(`✅ MFA challenge created: ${challenge.id}`);
      return challenge;
    } catch (error) {
      console.error('❌ Failed to create MFA challenge:', error);
      throw error;
    }
  }

  /**
   * Verify MFA challenge
   */
  async verifyChallenge(verification: MFAVerification): Promise<{
    success: boolean;
    session?: MFASession;
    remainingAttempts?: number;
    error?: string;
  }> {
    try {
      console.log(`🔍 Verifying MFA challenge: ${verification.challengeId}`);
      
      const challenge = this.activeChallenges.get(verification.challengeId);
      if (!challenge) {
        return { success: false, error: 'Challenge not found or expired' };
      }

      // Check if challenge is expired
      if (new Date() > challenge.expiresAt) {
        this.activeChallenges.delete(verification.challengeId);
        return { success: false, error: 'Challenge expired' };
      }

      // Check if challenge is already used
      if (challenge.isUsed) {
        return { success: false, error: 'Challenge already used' };
      }

      // Check attempts
      if (challenge.attempts >= challenge.maxAttempts) {
        this.activeChallenges.delete(verification.challengeId);
        return { success: false, error: 'Maximum attempts exceeded' };
      }

      // Increment attempts
      challenge.attempts++;

      // Get MFA method
      const methods = this.mfaMethods.get(challenge.userId) || [];
      const method = methods.find(m => m.id === challenge.methodId);
      if (!method) {
        return { success: false, error: 'MFA method not found' };
      }

      // Verify based on method type
      let verified = false;
      switch (challenge.type) {
        case 'totp':
          verified = await this.verifyTOTP(method, verification.code);
          break;
        case 'sms':
          verified = await this.verifySMS(challenge, verification.code);
          break;
        case 'email':
          verified = await this.verifyEmail(challenge, verification.code);
          break;
        case 'backup_codes':
          verified = await this.verifyBackupCode(method, verification.code);
          break;
        default:
          return { success: false, error: 'Unsupported MFA method' };
      }

      if (verified) {
        // Mark challenge as used
        challenge.isUsed = true;
        
        // Update method usage
        method.lastUsed = new Date();
        method.verificationCount++;
        await this.updateMFAMethod(method);
        
        // Create MFA session
        const session = await this.createMFASession(challenge, verification);
        
        // Clean up challenge
        this.activeChallenges.delete(verification.challengeId);
        
        console.log(`✅ MFA verification successful for user: ${challenge.userId}`);
        return { success: true, session };
      } else {
        const remainingAttempts = challenge.maxAttempts - challenge.attempts;
        console.log(`❌ MFA verification failed. Remaining attempts: ${remainingAttempts}`);
        return { 
          success: false, 
          remainingAttempts,
          error: 'Invalid verification code' 
        };
      }
    } catch (error) {
      console.error('❌ Failed to verify MFA challenge:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Setup biometric authentication
   */
  async setupBiometric(userId: string, biometricData: Omit<BiometricData, 'enrolledAt'>): Promise<string> {
    try {
      console.log(`👤 Setting up biometric authentication for user: ${userId}`);
      
      // Encrypt biometric template
      const encryptedTemplate = await this.encryptBiometricTemplate(biometricData.template);
      
      const biometric: BiometricData = {
        ...biometricData,
        template: encryptedTemplate,
        enrolledAt: new Date()
      };

      // Store biometric data
      if (!this.biometricData.has(userId)) {
        this.biometricData.set(userId, []);
      }
      this.biometricData.get(userId)!.push(biometric);
      
      // Create MFA method
      const mfaMethod: MFAMethod = {
        id: `mfa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        type: 'biometric',
        name: `${biometric.type.charAt(0).toUpperCase() + biometric.type.slice(1)} Authentication`,
        isEnabled: true,
        isPrimary: false,
        metadata: {
          biometricType: biometric.type,
          deviceId: biometric.deviceId,
          confidence: biometric.confidence
        },
        createdAt: new Date(),
        verificationCount: 0
      };

      await this.storeMFAMethod(mfaMethod);
      
      console.log(`✅ Biometric authentication setup completed for user: ${userId}`);
      return mfaMethod.id;
    } catch (error) {
      console.error('❌ Failed to setup biometric authentication:', error);
      throw error;
    }
  }

  /**
   * Get user's MFA methods
   */
  async getUserMFAMethods(userId: string): Promise<MFAMethod[]> {
    const methods = this.mfaMethods.get(userId) || [];
    
    // Return sanitized methods (without sensitive data)
    return methods.map(method => ({
      ...method,
      metadata: {
        ...method.metadata,
        secret: undefined, // Remove TOTP secret
        phoneNumber: method.metadata.phoneNumber ? this.maskPhoneNumber(method.metadata.phoneNumber) : undefined,
        backupCodes: undefined // Remove backup codes
      }
    }));
  }

  /**
   * Disable MFA method
   */
  async disableMFAMethod(userId: string, methodId: string): Promise<boolean> {
    try {
      console.log(`🔒 Disabling MFA method: ${methodId} for user: ${userId}`);
      
      const methods = this.mfaMethods.get(userId) || [];
      const method = methods.find(m => m.id === methodId);
      
      if (!method) {
        throw new Error('MFA method not found');
      }

      // Check if this is the only enabled method
      const enabledMethods = methods.filter(m => m.isEnabled);
      if (enabledMethods.length === 1 && method.isEnabled) {
        throw new Error('Cannot disable the only MFA method');
      }

      method.isEnabled = false;
      method.isPrimary = false;
      
      // If this was primary, make another method primary
      if (method.isPrimary) {
        const nextPrimary = methods.find(m => m.isEnabled && m.id !== methodId);
        if (nextPrimary) {
          nextPrimary.isPrimary = true;
          await this.updateMFAMethod(nextPrimary);
        }
      }
      
      await this.updateMFAMethod(method);
      
      console.log(`✅ MFA method disabled: ${methodId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to disable MFA method:', error);
      throw error;
    }
  }

  /**
   * Check if user has MFA enabled
   */
  async hasMFAEnabled(userId: string): Promise<boolean> {
    const methods = this.mfaMethods.get(userId) || [];
    return methods.some(m => m.isEnabled);
  }

  /**
   * Get MFA session
   */
  async getMFASession(sessionId: string): Promise<MFASession | null> {
    const session = this.mfaSessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
      this.mfaSessions.delete(sessionId);
      return null;
    }
    
    return session;
  }

  /**
   * Private helper methods
   */
  private async loadMFAMethods(): Promise<void> {
    try {
      console.log('📥 Loading MFA methods');
      // Load from database
      // For now, initialize empty
    } catch (error) {
      console.error('Failed to load MFA methods:', error);
    }
  }

  private startCleanupTasks(): void {
    // Clean up expired challenges every minute
    setInterval(() => {
      const now = new Date();
      for (const [id, challenge] of this.activeChallenges.entries()) {
        if (now > challenge.expiresAt) {
          this.activeChallenges.delete(id);
        }
      }
    }, 60000);

    // Clean up expired sessions every hour
    setInterval(() => {
      const now = new Date();
      for (const [id, session] of this.mfaSessions.entries()) {
        if (now > session.expiresAt) {
          this.mfaSessions.delete(id);
        }
      }
    }, 3600000);
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/\s+/g, ''));
  }

  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length < 4) return phoneNumber;
    return phoneNumber.slice(0, -4).replace(/\d/g, '*') + phoneNumber.slice(-4);
  }

  private encryptPhoneNumber(phoneNumber: string): string {
    // In production, use proper encryption
    return Buffer.from(phoneNumber).toString('base64');
  }

  private decryptPhoneNumber(encryptedPhone: string): string {
    // In production, use proper decryption
    return Buffer.from(encryptedPhone, 'base64').toString();
  }

  private async sendSMSVerification(phoneNumber: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`📱 Sending SMS verification code ${code} to ${phoneNumber}`);
    
    // Store code temporarily
    await redisCacheService.set(`sms_verification:${phoneNumber}`, code, 300); // 5 minutes
    
    return code;
  }

  private async generateChallenge(method: MFAMethod): Promise<string> {
    switch (method.type) {
      case 'totp':
        return 'Enter code from your authenticator app';
      case 'sms':
        const phoneNumber = this.decryptPhoneNumber(method.metadata.phoneNumber);
        await this.sendSMSVerification(phoneNumber);
        return `Code sent to ${this.maskPhoneNumber(phoneNumber)}`;
      case 'email':
        return 'Check your email for verification code';
      case 'backup_codes':
        return 'Enter one of your backup codes';
      case 'biometric':
        return 'Use your biometric authentication';
      default:
        return 'Complete authentication challenge';
    }
  }

  private async verifyTOTP(method: MFAMethod, token: string): Promise<boolean> {
    return speakeasy.totp.verify({
      secret: method.metadata.secret,
      encoding: 'base32',
      token,
      window: 2
    });
  }

  private async verifySMS(challenge: MFAChallenge, code: string): Promise<boolean> {
    const methods = this.mfaMethods.get(challenge.userId) || [];
    const method = methods.find(m => m.id === challenge.methodId);
    if (!method) return false;

    const phoneNumber = this.decryptPhoneNumber(method.metadata.phoneNumber);
    const storedCode = await redisCacheService.get(`sms_verification:${phoneNumber}`);
    
    return storedCode === code;
  }

  private async verifyEmail(challenge: MFAChallenge, code: string): Promise<boolean> {
    // Email verification logic
    return false; // Placeholder
  }

  private async verifyBackupCode(method: MFAMethod, code: string): Promise<boolean> {
    const hashedCode = this.hashBackupCode(code);
    const backupCodes = method.metadata.backupCodes || [];
    
    const index = backupCodes.indexOf(hashedCode);
    if (index !== -1) {
      // Remove used backup code
      backupCodes.splice(index, 1);
      method.metadata.backupCodes = backupCodes;
      await this.updateMFAMethod(method);
      return true;
    }
    
    return false;
  }

  private async createMFASession(challenge: MFAChallenge, verification: MFAVerification): Promise<MFASession> {
    const session: MFASession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: challenge.userId,
      methodUsed: challenge.methodId,
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      deviceTrusted: false,
      riskScore: this.calculateSessionRiskScore(verification),
      metadata: {
        challengeId: challenge.id,
        deviceInfo: verification.deviceInfo
      }
    };

    this.mfaSessions.set(session.id, session);
    await this.storeMFASession(session);
    
    return session;
  }

  private calculateSessionRiskScore(verification: MFAVerification): number {
    let riskScore = 0;
    
    // Add risk based on device info
    if (!verification.deviceInfo) {
      riskScore += 20;
    }
    
    // Add other risk factors
    // IP geolocation, device fingerprinting, etc.
    
    return Math.min(100, riskScore);
  }

  private async encryptBiometricTemplate(template: string): Promise<string> {
    // In production, use proper encryption for biometric data
    return Buffer.from(template).toString('base64');
  }

  private async storeMFAMethod(method: MFAMethod): Promise<void> {
    try {
      if (!this.mfaMethods.has(method.userId)) {
        this.mfaMethods.set(method.userId, []);
      }
      this.mfaMethods.get(method.userId)!.push(method);
      
      // Store in database
      console.log(`💾 Storing MFA method: ${method.id}`);
    } catch (error) {
      console.error('Failed to store MFA method:', error);
    }
  }

  private async updateMFAMethod(method: MFAMethod): Promise<void> {
    try {
      // Update in memory
      const methods = this.mfaMethods.get(method.userId) || [];
      const index = methods.findIndex(m => m.id === method.id);
      if (index !== -1) {
        methods[index] = method;
      }
      
      // Update in database
      console.log(`💾 Updating MFA method: ${method.id}`);
    } catch (error) {
      console.error('Failed to update MFA method:', error);
    }
  }

  private async storeMFAChallenge(challenge: MFAChallenge): Promise<void> {
    try {
      await redisCacheService.set(`mfa_challenge:${challenge.id}`, JSON.stringify(challenge), 300);
    } catch (error) {
      console.error('Failed to store MFA challenge:', error);
    }
  }

  private async storeMFASession(session: MFASession): Promise<void> {
    try {
      await redisCacheService.set(`mfa_session:${session.id}`, JSON.stringify(session), 86400);
    } catch (error) {
      console.error('Failed to store MFA session:', error);
    }
  }
}

// Export singleton instance
export const multiFactorAuthService = MultiFactorAuthService.getInstance();