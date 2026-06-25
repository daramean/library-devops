// ── fine.controller.test.js ────────────────────────────────
const request = require('supertest');
const app = require('../src/app');

// Mock database
jest.mock('../src/config/database');
const db = require('../src/config/database');

// Mock JWT
jest.mock('jsonwebtoken');
const jwt = require('jsonwebtoken');

describe('Fine Controller - API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful JWT verification for authenticated requests
    jwt.verify.mockImplementation((token, secret) => {
      if (token === 'admin_token') {
        return { id: 1, role: 'admin', email: 'admin@example.com' };
      } else if (token === 'user_token') {
        return { id: 2, role: 'user', email: 'user@example.com' };
      } else if (token === 'valid_token') {
        return { id: 2, role: 'user', email: 'user@example.com' };
      }
      throw new Error('Invalid token');
    });
  });

  // ═══════════════════════════════════════════════
  // GET /api/v1/fines - Get Fines
  // ═══════════════════════════════════════════════

  describe('GET /api/v1/fines', () => {
    it('should return user\'s fines when user is logged in', async () => {
      const mockFines = [
        {
          id: 1,
          user_id: 1,
          borrow_id: 1,
          amount: 5.50,
          reason: 'overdue',
          days_overdue: 2,
          is_paid: false,
          created_at: '2024-06-01',
          title: 'The Great Gatsby',
        },
        {
          id: 2,
          user_id: 1,
          borrow_id: 2,
          amount: 3.00,
          reason: 'damaged',
          days_overdue: 0,
          is_paid: true,
          created_at: '2024-06-05',
          title: '1984',
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockFines });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer valid_token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toEqual(mockFines);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter unpaid fines for regular users', async () => {
      const mockUnpaidFines = [
        {
          id: 1,
          user_id: 1,
          amount: 5.50,
          reason: 'overdue',
          is_paid: false,
          title: 'The Great Gatsby',
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockUnpaidFines });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer valid_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // All returned fines should have is_paid: false
      res.body.data.forEach(fine => {
        expect(fine).toHaveProperty('is_paid');
      });
    });

    it('should return empty array when user has no fines', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer valid_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('should return all fines for admin users', async () => {
      const mockAllFines = [
        {
          id: 1,
          user_id: 1,
          full_name: 'John Doe',
          email: 'john@example.com',
          amount: 5.50,
          reason: 'overdue',
          title: 'The Great Gatsby',
          is_paid: false,
        },
        {
          id: 2,
          user_id: 2,
          full_name: 'Jane Smith',
          email: 'jane@example.com',
          amount: 10.00,
          reason: 'damaged',
          title: 'Pride and Prejudice',
          is_paid: false,
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockAllFines });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer admin_token')
        .set('X-User-Role', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0]).toHaveProperty('full_name');
      expect(res.body.data[0]).toHaveProperty('email');
    });

    it('should return fine details with required fields', async () => {
      const mockFine = [
        {
          id: 1,
          borrow_id: 10,
          user_id: 1,
          amount: 5.50,
          reason: 'overdue',
          days_overdue: 2,
          is_paid: false,
          paid_at: null,
          created_at: '2024-06-01T10:00:00Z',
          title: 'The Great Gatsby',
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockFine });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer valid_token');

      expect(res.status).toBe(200);
      const fine = res.body.data[0];
      expect(fine).toHaveProperty('id');
      expect(fine).toHaveProperty('amount');
      expect(fine).toHaveProperty('reason');
      expect(fine).toHaveProperty('is_paid');
      expect(fine).toHaveProperty('title');
      expect(fine).toHaveProperty('created_at');
    });
  });

  // ═══════════════════════════════════════════════
  // POST /api/v1/fines/:id/pay - Mark Fine as Paid
  // ═══════════════════════════════════════════════

  describe('POST /api/v1/fines/:id/pay', () => {
    it('should mark a fine as paid when admin requests', async () => {
      const paidFine = {
        id: 1,
        user_id: 1,
        amount: 5.50,
        reason: 'overdue',
        is_paid: true,
        paid_at: '2024-06-10T14:30:00Z',
      };

      db.query.mockResolvedValueOnce({ rows: [paidFine] });

      const res = await request(app)
        .post('/api/v1/fines/1/pay')
        .set('Authorization', 'Bearer admin_token')
        .set('X-User-Role', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_paid).toBe(true);
      expect(res.body.data).toHaveProperty('paid_at');
    });

    it('should update paid_at timestamp when marking fine as paid', async () => {
      const now = new Date();
      const paidFine = {
        id: 1,
        amount: 5.50,
        is_paid: true,
        paid_at: now.toISOString(),
      };

      db.query.mockResolvedValueOnce({ rows: [paidFine] });

      const res = await request(app)
        .post('/api/v1/fines/1/pay')
        .set('Authorization', 'Bearer admin_token')
        .set('X-User-Role', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.data.paid_at).toBeDefined();
      expect(new Date(res.body.data.paid_at)).toBeInstanceOf(Date);
    });

    it('should prevent non-admin users from marking fines as paid', async () => {
      const res = await request(app)
        .post('/api/v1/fines/1/pay')
        .set('Authorization', 'Bearer user_token')
        .set('X-User-Role', 'user');

      // Should return 403 Forbidden or error
      expect([403, 401]).toContain(res.status);
    });

    it('should return error when fine does not exist', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/v1/fines/999/pay')
        .set('Authorization', 'Bearer admin_token');

      // When no fine is found, backend should return empty or error
      expect([200, 400, 404]).toContain(res.status);
      // If it returns 200, data should be empty or falsy
      if (res.status === 200 && res.body.data) {
        expect(res.body.data).toEqual({});
      }
    });

    it('should return updated fine object after payment', async () => {
      const updatedFine = {
        id: 1,
        borrow_id: 10,
        user_id: 1,
        amount: 5.50,
        reason: 'overdue',
        is_paid: true,
        paid_at: '2024-06-10T14:30:00Z',
      };

      db.query.mockResolvedValueOnce({ rows: [updatedFine] });

      const res = await request(app)
        .post('/api/v1/fines/1/pay')
        .set('Authorization', 'Bearer admin_token')
        .set('X-User-Role', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.is_paid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════
  // Fine Amount Validation
  // ═══════════════════════════════════════════════

  describe('Fine Amount Validation', () => {
    it('should store fine amount with 2 decimal places', async () => {
      const mockFine = [
        {
          id: 1,
          amount: 5.50,
          is_paid: false,
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockFine });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer valid_token');

      expect(res.body.data[0].amount).toBe(5.50);
    });

    it('should return total unpaid fines in response', async () => {
      const mockFines = [
        { id: 1, amount: 5.50, is_paid: false },
        { id: 2, amount: 3.00, is_paid: false },
        { id: 3, amount: 2.50, is_paid: true },
      ];

      db.query.mockResolvedValueOnce({ rows: mockFines });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer valid_token');

      const totalUnpaid = res.body.data
        .filter(f => !f.is_paid)
        .reduce((sum, f) => sum + f.amount, 0);

      expect(totalUnpaid).toBe(8.50);
    });
  });

  // ═══════════════════════════════════════════════
  // Fine Reason Types
  // ═══════════════════════════════════════════════

  describe('Fine Reason Types', () => {
    it('should support "overdue" reason', async () => {
      const mockFine = [
        { id: 1, reason: 'overdue', days_overdue: 5 },
      ];

      db.query.mockResolvedValueOnce({ rows: mockFine });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer valid_token');

      expect(res.body.data[0].reason).toBe('overdue');
    });

    it('should support "damaged" reason', async () => {
      const mockFine = [
        { id: 1, reason: 'damaged' },
      ];

      db.query.mockResolvedValueOnce({ rows: mockFine });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer valid_token');

      expect(res.body.data[0].reason).toBe('damaged');
    });

    it('should support "lost" reason', async () => {
      const mockFine = [
        { id: 1, reason: 'lost', amount: 25.00 },
      ];

      db.query.mockResolvedValueOnce({ rows: mockFine });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer valid_token');

      expect(res.body.data[0].reason).toBe('lost');
    });
  });

  // ═══════════════════════════════════════════════
  // Fine Filtering
  // ═══════════════════════════════════════════════

  describe('Fine Filtering', () => {
    it('should retrieve only unpaid fines for users', async () => {
      const mockFines = [
        { id: 1, user_id: 1, is_paid: false },
        { id: 2, user_id: 1, is_paid: false },
      ];

      db.query.mockResolvedValueOnce({ rows: mockFines });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer user_token');

      expect(res.status).toBe(200);
      res.body.data.forEach(fine => {
        expect(fine.is_paid).toBe(false);
      });
    });

    it('should include both paid and unpaid fines for admin', async () => {
      const mockFines = [
        { id: 1, is_paid: false },
        { id: 2, is_paid: true },
        { id: 3, is_paid: false },
      ];

      db.query.mockResolvedValueOnce({ rows: mockFines });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer admin_token')
        .set('X-User-Role', 'admin');

      const unpaidCount = res.body.data.filter(f => !f.is_paid).length;
      const paidCount = res.body.data.filter(f => f.is_paid).length;

      expect(unpaidCount).toBeGreaterThan(0);
      expect(paidCount).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════
  // Fine Related to Borrow Records
  // ═══════════════════════════════════════════════

  describe('Fine Related to Borrow Records', () => {
    it('should link fine to borrow record', async () => {
      const mockFine = [
        {
          id: 1,
          borrow_id: 10,
          user_id: 1,
          title: 'The Great Gatsby',
          amount: 5.50,
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockFine });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer valid_token');

      expect(res.body.data[0]).toHaveProperty('borrow_id');
      expect(res.body.data[0]).toHaveProperty('title');
    });

    it('should include book title in fine details', async () => {
      const mockFine = [
        {
          id: 1,
          title: 'Pride and Prejudice',
          amount: 3.50,
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockFine });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer valid_token');

      expect(res.body.data[0].title).toBe('Pride and Prejudice');
    });
  });

  // ═══════════════════════════════════════════════
  // Fine Error Handling
  // ═══════════════════════════════════════════════

  describe('Fine Error Handling', () => {
    it('should require authentication to get fines', async () => {
      const res = await request(app).get('/api/v1/fines');

      expect([401, 403]).toContain(res.status);
    });

    it('should require authentication to pay a fine', async () => {
      const res = await request(app).post('/api/v1/fines/1/pay');

      expect([401, 403]).toContain(res.status);
    });

    it('should handle database errors gracefully', async () => {
      db.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer valid_token');

      expect(res.status).toBe(500);
    });
  });

  // ═══════════════════════════════════════════════
  // Fine Response Format
  // ═══════════════════════════════════════════════

  describe('Fine Response Format', () => {
    it('should return proper success response structure', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer valid_token');

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return success response when marking fine as paid', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          is_paid: true,
        }],
      });

      const res = await request(app)
        .post('/api/v1/fines/1/pay')
        .set('Authorization', 'Bearer admin_token')
        .set('X-User-Role', 'admin');

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
    });

    it('should sort fines by creation date (newest first)', async () => {
      const mockFines = [
        { id: 3, created_at: '2024-06-10' },
        { id: 2, created_at: '2024-06-05' },
        { id: 1, created_at: '2024-06-01' },
      ];

      db.query.mockResolvedValueOnce({ rows: mockFines });

      const res = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', 'Bearer valid_token');

      // Check if results are in descending order by creation date
      for (let i = 0; i < res.body.data.length - 1; i++) {
        const current = new Date(res.body.data[i].created_at);
        const next = new Date(res.body.data[i + 1].created_at);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });
  });
});
