const { borrowBook, approveBorrow, returnBook } = require('../src/controllers/borrow.controller');
const { getClient } = require('../src/config/database');
const { sendNotification } = require('../src/utils/notifications');
const AppError = require('../src/utils/AppError');

jest.mock('../src/config/database');
jest.mock('../src/utils/notifications');

function makeMockClient(sequenceResponses) {
  const client = {
    query: jest.fn(async (text, params) => {
      // find a response whose matcher matches the SQL
      for (const item of sequenceResponses) {
        if (typeof item.match === 'string' ? text.includes(item.match) : item.match(text)) {
          return item.response;
        }
      }
      return { rows: [] };
    }),
    release: jest.fn(),
  };
  return client;
}

describe('Borrow Controller (integration-style)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendNotification.mockResolvedValue();
  });

  it('allows admin to borrow and uses default loan days', async () => {
    const now = new Date();

    const client = makeMockClient([
      { match: 'BEGIN', response: { rows: [] } },
      { match: "SELECT COUNT(*) FROM borrow_records", response: { rows: [{ count: '0' }] } },
      { match: "SELECT COALESCE(SUM(amount),0)", response: { rows: [{ total: '0' }] } },
      { match: "SELECT id, title, available_copies, default_loan_days FROM books", response: { rows: [{ id: 'book-1', title: 'Test Book', available_copies: 3, default_loan_days: 14 }] } },
      { match: "SELECT id FROM borrow_records", response: { rows: [] } },
      { match: "INSERT INTO borrow_records", response: { rows: [{ id: 'borrow-1' }] } },
      { match: "UPDATE books SET available_copies", response: { rows: [] } },
      { match: 'COMMIT', response: { rows: [] } },
    ]);

    getClient.mockResolvedValue(client);

    const req = { user: { id: 'user-1', role: 'admin' }, body: { book_id: 'book-1' } };
    const res = { status: jest.fn(() => ({ json: jest.fn() })), json: jest.fn() };

    await borrowBook(req, res);

    expect(client.query).toHaveBeenCalled();
    expect(sendNotification).toHaveBeenCalled();
  });

  it('allows admin to approve a borrow request using default loan days', async () => {
    const now = new Date();

    const client = makeMockClient([
      { match: 'BEGIN', response: { rows: [] } },
      { match: "SELECT br.*, b.title, b.available_copies", response: { rows: [{ id: 'borrow-1', user_id: 'user-1', book_id: 'book-1', title: 'Test Book', available_copies: 2, status: 'pending', due_date: new Date(now.getDate() + 7).toISOString(), default_loan_days: 14 }] } },
      { match: "SELECT COUNT(*) FROM borrow_records", response: { rows: [{ count: '0' }] } },
      { match: "SELECT COALESCE(SUM(amount),0)", response: { rows: [{ total: '0' }] } },
      { match: 'UPDATE borrow_records', response: { rows: [] } },
      { match: 'UPDATE books SET available_copies', response: { rows: [] } },
      { match: 'COMMIT', response: { rows: [] } },
    ]);

    getClient.mockResolvedValue(client);

    const req = {
      user: { id: 'admin-1', role: 'admin' },
      params: { id: 'borrow-1' },
      body: {},
    };
    const res = { json: jest.fn() };

    await approveBorrow(req, res);

    expect(client.query).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.objectContaining({ status: 'borrowed' }) }));
  });

  it('allows admin to return with a custom returned_at date', async () => {
    const now = new Date();
    const returnedAt = new Date(now);
    returnedAt.setDate(returnedAt.getDate() - 1);

    const client = makeMockClient([
      { match: 'BEGIN', response: { rows: [] } },
      { match: "SELECT br.*, b.title AS book_title", response: { rows: [{ id: 'borrow-1', user_id: 'other-user', book_id: 'book-1', due_date: new Date(now.getDate() - 2).toISOString(), borrowed_at: new Date(now.getDate() - 10).toISOString() }] } },
      { match: 'UPDATE borrow_records', response: { rows: [] } },
      { match: 'INSERT INTO return_records', response: { rows: [] } },
      { match: 'INSERT INTO fines', response: { rows: [] } },
      { match: 'UPDATE books SET available_copies', response: { rows: [] } },
      { match: 'COMMIT', response: { rows: [] } },
    ]);

    getClient.mockResolvedValue(client);

    const req = {
      user: { id: 'admin-1', role: 'admin' },
      body: {
        borrow_id: 'borrow-1',
        condition: 'good',
        returned_at: returnedAt.toISOString(),
      },
    };
    const res = { json: jest.fn() };

    await returnBook(req, res);

    expect(client.query).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

});
