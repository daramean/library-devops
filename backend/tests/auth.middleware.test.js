const jwt = require('jsonwebtoken');
const { protect, restrictTo } = require('../src/middleware/auth.middleware');
const AppError = require('../src/utils/AppError');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw when no authorization header exists', () => {
    const req = { headers: {} };
    expect(() => protect(req, {}, () => {})).toThrow(AppError);
  });

  it('should throw when token is invalid', () => {
    const req = { headers: { authorization: 'Bearer invalid.token' } };
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });
    expect(() => protect(req, {}, () => {})).toThrow(AppError);
  });

  it('should attach user when token is valid', () => {
    const req = { headers: { authorization: 'Bearer valid.token' } };
    const next = jest.fn();
    jwt.verify.mockReturnValue({ id: 'test-user', role: 'user' });
    protect(req, {}, next);
    expect(req.user).toEqual({ id: 'test-user', role: 'user' });
    expect(next).toHaveBeenCalled();
  });

  it('should restrict roles correctly', () => {
    const middleware = restrictTo('admin');
    const req = { user: { role: 'admin' } };
    const next = jest.fn();
    middleware(req, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('should throw when role is not permitted', () => {
    const middleware = restrictTo('admin');
    const req = { user: { role: 'user' } };
    expect(() => middleware(req, {}, () => {})).toThrow(AppError);
  });
});
