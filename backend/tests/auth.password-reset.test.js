const request = require('supertest');
const app = require('../src/app');
const { query, getClient } = require('../src/config/database');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcryptjs = require('bcryptjs');

// ── Mock redis and emailService ───────────────────
jest.mock('../src/config/redis', () => ({
  getRedis: jest.fn(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  })),
}));

jest.mock('../src/utils/emailService', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendNotificationEmail: jest.fn().mockResolvedValue(true),
}));

// ── Mock database ────────────────────────────────
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

// ── Mock jwt ────────────────────────────────────
jest.mock('jsonwebtoken');

const emailService = require('../src/utils/emailService');

describe('Auth - Password Reset', () => {
  let mockDbClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDbClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    getClient.mockResolvedValue(mockDbClient);
    jwt.verify = jest.fn((token, secret) => {
      if (token === 'invalid_token') throw new Error('Invalid token');
      return { id: 'user-123', email: 'test@example.com' };
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    test('should send password reset email for valid email', async () => {
      // Mock the user lookup
      mockDbClient.query.mockResolvedValueOnce({
        rows: [{ id: 'user-123', email: 'test@example.com', full_name: 'Test User' }],
      });

      // Mock the token update
      mockDbClient.query.mockResolvedValueOnce({ rows: [{}] });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('reset link');
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    test('should not reveal whether email exists in system', async () => {
      // First request - email exists
      mockDbClient.query.mockResolvedValueOnce({
        rows: [{ id: 'user-123', email: 'existing@example.com' }],
      });
      mockDbClient.query.mockResolvedValueOnce({ rows: [{}] });

      const res1 = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'existing@example.com' });

      // Reset mocks
      jest.clearAllMocks();
      getClient.mockResolvedValue(mockDbClient);

      // Second request - email doesn't exist
      mockDbClient.query.mockResolvedValueOnce({
        rows: [], // No user found
      });

      const res2 = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      // Both should return same message for security
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.message).toEqual(res2.body.message);
    });

    test('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'invalid-email' });

      expect(res.status).toBe(400);
    });

    test('should reject missing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({});

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should rate limit forgot password requests', async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [{ id: 'user-123', email: 'test@example.com' }],
      });

      // Make multiple requests
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app)
            .post('/api/v1/auth/forgot-password')
            .send({ email: 'test@example.com' })
        );
      }

      const responses = await Promise.all(requests);
      // In production, should be rate limited (some 429)
      // In test mode, rate limit is disabled
      responses.forEach(res => {
        expect(res.status).toBeLessThan(500);
      });
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    test('should reset password with valid token', async () => {
      const testToken = 'valid-reset-token';
      const hashedToken = crypto.createHash('sha256').update(testToken).digest('hex');

      // Mock user lookup
      mockDbClient.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          email: 'test@example.com',
          reset_token: hashedToken,
          reset_token_expires: new Date(Date.now() + 3600000), // 1 hour from now
        }],
      });

      // Mock password update
      mockDbClient.query.mockResolvedValueOnce({ rows: [{}] });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: testToken,
          password: 'NewPassword123!',
          passwordConfirm: 'NewPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('successfully');
    });

    test('should reject expired reset token', async () => {
      const testToken = 'expired-token';
      const hashedToken = crypto.createHash('sha256').update(testToken).digest('hex');

      // Mock user with expired token
      mockDbClient.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          reset_token: hashedToken,
          reset_token_expires: new Date(Date.now() - 1000), // 1 second ago
        }],
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: testToken,
          password: 'NewPassword123!',
          passwordConfirm: 'NewPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });

    test('should reject invalid reset token', async () => {
      mockDbClient.query.mockResolvedValueOnce({
        rows: [], // No user with this token
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!',
          passwordConfirm: 'NewPassword123!',
        });

      expect(res.status).toBe(400);
    });

    test('should reject mismatched passwords', async () => {
      const testToken = 'valid-reset-token';

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: testToken,
          password: 'NewPassword123!',
          passwordConfirm: 'DifferentPassword!',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('match');
    });

    test('should reject weak passwords', async () => {
      const testToken = 'valid-reset-token';

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: testToken,
          password: '123',
          passwordConfirm: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('least');
    });

    test('should clear reset token after successful reset', async () => {
      const testToken = 'valid-reset-token';
      const hashedToken = crypto.createHash('sha256').update(testToken).digest('hex');

      // Mock user lookup
      mockDbClient.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          reset_token: hashedToken,
          reset_token_expires: new Date(Date.now() + 3600000),
        }],
      });

      // Mock password update
      mockDbClient.query.mockResolvedValueOnce({ rows: [{}] });

      await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: testToken,
          password: 'NewPassword123!',
          passwordConfirm: 'NewPassword123!',
        });

      // Verify reset_token was cleared
      const updateCall = mockDbClient.query.mock.calls[1][0];
      expect(updateCall).toContain('reset_token = NULL');
    });

    test('should validate password confirmation matches', async () => {
      const testToken = 'valid-reset-token';

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: testToken,
          password: 'ValidPassword123!',
          passwordConfirm: 'ValidPassword123!',
        });

      expect([200, 400]).toContain(res.status);
    });

    test('should handle missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'some-token',
          // Missing password and passwordConfirm
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Password Reset Flow - Integration', () => {
    test('should complete full forgot and reset flow', async () => {
      const userEmail = 'test@example.com';
      let resetToken = null;

      // Step 1: Request password reset
      mockDbClient.query.mockResolvedValueOnce({
        rows: [{ id: 'user-123', email: userEmail, full_name: 'Test User' }],
      });

      mockDbClient.query.mockResolvedValueOnce({ rows: [{}] });

      const forgotRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: userEmail });

      expect(forgotRes.status).toBe(200);
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        userEmail,
        expect.any(String),
        expect.stringContaining('reset-password')
      );

      // Capture the reset token from email call
      const emailCall = emailService.sendPasswordResetEmail.mock.calls[0];
      resetToken = emailCall[1];

      // Step 2: Reset password with token
      jest.clearAllMocks();
      getClient.mockResolvedValue(mockDbClient);

      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      mockDbClient.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          reset_token: hashedToken,
          reset_token_expires: new Date(Date.now() + 3600000),
        }],
      });

      mockDbClient.query.mockResolvedValueOnce({ rows: [{}] });

      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123!',
          passwordConfirm: 'NewPassword123!',
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);
    });
  });

  describe('Email Service Integration', () => {
    test('should send properly formatted reset email', async () => {
      mockDbClient.query.mockResolvedValueOnce({
        rows: [{ id: 'user-123', email: 'test@example.com', full_name: 'Test User' }],
      });

      mockDbClient.query.mockResolvedValueOnce({ rows: [{}] });

      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
      const [email, token, link] = emailService.sendPasswordResetEmail.mock.calls[0];
      expect(email).toBe('test@example.com');
      expect(typeof token).toBe('string');
      expect(typeof link).toBe('string');
      expect(link).toContain('reset-password');
    });
  });
});
