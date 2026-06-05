const { getBook, createBook } = require('../src/controllers/book.controller');
const { query } = require('../src/config/database');
const AppError = require('../src/utils/AppError');

jest.mock('../src/config/database');

describe('Book Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws 404 when book not found', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: 'book-1' } };
    const res = { json: jest.fn() };

    await expect(getBook(req, res)).rejects.toBeInstanceOf(AppError);
    expect(query).toHaveBeenCalled();
  });

  it('creates a book and retries when ISBN unique constraint occurs', async () => {
    const duplicateError = new Error('duplicate');
    duplicateError.code = '23505';
    duplicateError.constraint = 'books_isbn_key';

    // First INSERT attempt rejects with duplicate ISBN error, second resolves
    query
      .mockRejectedValueOnce(duplicateError)
      .mockResolvedValueOnce({ rows: [{ id: 'book-1', title: 'New Book', isbn: null }] });

    const req = {
      body: { title: 'New Book', author: 'Author' },
      user: { id: 'user-1' },
      file: null,
      protocol: 'http',
      get: () => 'localhost'
    };
    const res = { status: jest.fn(() => ({ json: jest.fn() })), json: jest.fn() };

    await createBook(req, res);

    expect(query).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
