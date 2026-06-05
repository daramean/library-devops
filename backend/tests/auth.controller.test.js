jest.mock('../src/config/database');
jest.mock('../src/config/redis');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../src/config/database');
const { getRedis } = require('../src/config/redis');
const authController = require('../src/controllers/auth.controller');
const AppError = require('../src/utils/AppError');

const mockSend = jest.fn();
const mockStatus = jest.fn(() => ({ json: mockSend }));

const mockResponse = () => ({ status: mockStatus, json: mockSend });

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockReset();
    mockStatus.mockReset();
  });

  it('should return 401 when login credentials are invalid', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const req = { body: { email: 'bad@example.com', password: 'secret' } };
    const res = mockResponse();

    await expect(authController.login(req, res)).rejects.toBeInstanceOf(AppError);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('FROM users u'), ['bad@example.com']);
  });

  it('should return 401 when password does not match', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: '1', email: 'user@example.com', password_hash: 'hash', role_name: 'user' }] });
    bcrypt.compare.mockResolvedValue(false);
    const req = { body: { email: 'user@example.com', password: 'secret' } };
    const res = mockResponse();

    await expect(authController.login(req, res)).rejects.toBeInstanceOf(AppError);
    expect(bcrypt.compare).toHaveBeenCalledWith('secret', 'hash');
  });

  it('should return tokens and user info when login is successful', async () => {
    const user = { id: '1', email: 'user@example.com', password_hash: 'hash', role_name: 'user', full_name: 'User', avatar_url: null };
    query.mockResolvedValueOnce({ rows: [user] });
    query.mockResolvedValueOnce({});
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockImplementation((payload) => `${payload.id}-token`);
    getRedis.mockReturnValue({ set: jest.fn() });

    const req = { body: { email: 'user@example.com', password: 'secret' } };
    const res = mockResponse();

    await authController.login(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(res.json.mock.calls[0][0].data).toHaveProperty('accessToken', '1-token');
    expect(res.json.mock.calls[0][0].data.user).toMatchObject({ email: 'user@example.com', role: 'user' });
  });

  it('should throw 409 when registering with existing email', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: '1' }] });
    const req = { body: { full_name: 'Test', email: 'user@example.com', password: 'pass' } };
    const res = mockResponse();

    await expect(authController.register(req, res)).rejects.toBeInstanceOf(AppError);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT id FROM users'), ['user@example.com']);
  });
});
