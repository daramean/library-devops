const { query, getClient } = require('../config/database');
const AppError = require('../utils/AppError');
const { logActivity } = require('../utils/activityLogger');
const { sendNotification, sendAdminNotifications } = require('../utils/notifications');

const MAX_BORROW  = parseInt(process.env.MAX_BORROW_BOOKS || '5');
const BORROW_DAYS = parseInt(process.env.MAX_BORROW_DAYS  || '14');

// ── Borrow a Book ─────────────────────────────────────
exports.borrowBook = async (req, res) => {
  const {
    book_id,
    borrowed_at: requestedBorrowedAt,
    user_id: requestedUserId,
  } = req.body;
  const isAdmin = ['admin', 'librarian'].includes(req.user.role);
  const user_id = isAdmin && requestedUserId ? requestedUserId : req.user.id;
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Check active borrows limit
    const { rows: activeRows } = await client.query(
      `SELECT COUNT(*) FROM borrow_records
       WHERE user_id = $1 AND status = 'borrowed'`,
      [user_id],
    );
    if (parseInt(activeRows[0].count) >= MAX_BORROW) {
      throw new AppError(`Cannot borrow more than ${MAX_BORROW} books at once`, 400);
    }

    // Check unpaid fines
    const { rows: fineRows } = await client.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM fines
       WHERE user_id = $1 AND is_paid = FALSE`,
      [user_id],
    );
    if (parseFloat(fineRows[0].total) > 0) {
      throw new AppError(
        `You have unpaid fines of $${fineRows[0].total}. Please settle before borrowing.`,
        400,
      );
    }

    // Lock book row & check availability
    const { rows: bookRows } = await client.query(
      `SELECT id, title, available_copies, default_loan_days FROM books
       WHERE id = $1 AND is_active = TRUE FOR UPDATE`,
      [book_id],
    );
    const book = bookRows[0];
    if (!book)                    throw new AppError('Book not found', 404);
    if (book.available_copies < 1) throw new AppError('Book is not available', 400);

    // Check existing borrow or request for this book
    // Allow re-borrowing only if previous request was cancelled, rejected, or returned
    const { rows: dupRows } = await client.query(
      `SELECT id FROM borrow_records
       WHERE user_id = $1 AND book_id = $2 AND status NOT IN ('cancelled','rejected','returned')`,
      [user_id, book_id],
    );
    if (dupRows.length) {
      throw new AppError('You already have a borrow or pending request for this book', 400);
    }

    const isAutoApproved = ['admin', 'librarian'].includes(req.user.role);
    const status = isAutoApproved ? 'borrowed' : 'pending';
    const approvedBy = isAutoApproved ? req.user.id : null;
    const now = new Date();
    const borrowed_at = isAdmin && requestedBorrowedAt
      ? new Date(requestedBorrowedAt)
      : now;

    if (isAdmin && requestedBorrowedAt) {
      if (Number.isNaN(borrowed_at.getTime())) {
        throw new AppError('Borrowed date must be a valid date', 400);
      }
      if (borrowed_at > now) {
        throw new AppError('Borrowed date cannot be in the future', 400);
      }
    }

    const loanDays = Number.isInteger(Number(book.default_loan_days)) && Number(book.default_loan_days) > 0
      ? Number(book.default_loan_days)
      : BORROW_DAYS;

    const due_date = new Date(borrowed_at);
    due_date.setDate(due_date.getDate() + loanDays);

    const { rows: borrowRows } = await client.query(
      `INSERT INTO borrow_records (user_id, book_id, borrowed_at, due_date, status, approved_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, book_id, borrowed_at, due_date, status, approvedBy],
    );

    if (isAutoApproved) {
      await client.query(
        'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
        [book_id],
      );
    }

    await client.query('COMMIT');

    // Send response immediately (notification and logging are non-blocking)
    res.status(201).json({ success: true, data: borrowRows[0] });

    // Fire off notification and activity logging (non-critical, don't await)
    const notification = {
      title: isAutoApproved ? 'Book Borrowed Successfully' : 'Borrow Request Submitted',
      message: isAutoApproved
        ? `You borrowed "${book.title}". Return by ${due_date.toDateString()}.`
        : `Your request for "${book.title}" is awaiting approval by an admin or librarian.`,
      type: isAutoApproved ? 'success' : 'info',
    };
    sendNotification(user_id, notification);
    logActivity(user_id, 'book.borrow', 'borrow_record', borrowRows[0].id, req, {
      book_title: book.title,
      status,
    });
    // Also notify admins/librarians server-side for pending requests so they
    // don't depend on the frontend to post admin notifications.
    if (!isAutoApproved) {
      try {
        const { rows: urows } = await query('SELECT full_name FROM users WHERE id = $1', [user_id]);
        const actorName = urows[0]?.full_name || 'A user';
        const adminTitle = 'New Borrow Request';
        const adminMessage = `${actorName} has requested to borrow "${book.title}".`;
        sendAdminNotifications({ title: adminTitle, message: adminMessage, type: 'borrow' });
      } catch (_err) {
        // Silently skip admin notification errors
      }
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.approveBorrow = async (req, res) => {
  const { id } = req.params;
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { rows: borrowRows } = await client.query(
      `SELECT br.*, b.title, b.available_copies, b.default_loan_days
       FROM borrow_records br
       JOIN books b ON br.book_id = b.id
       WHERE br.id = $1 FOR UPDATE`,
      [id],
    );
    const borrow = borrowRows[0];
    if (!borrow) throw new AppError('Borrow request not found', 404);
    if (borrow.status !== 'pending') {
      throw new AppError('Only pending borrow requests can be approved', 400);
    }
    if (borrow.available_copies < 1) {
      throw new AppError('Book is no longer available', 400);
    }

    const { rows: activeRows } = await client.query(
      `SELECT COUNT(*) FROM borrow_records
       WHERE user_id = $1 AND status = 'borrowed'`,
      [borrow.user_id],
    );
    if (parseInt(activeRows[0].count) >= MAX_BORROW) {
      throw new AppError(`User cannot borrow more than ${MAX_BORROW} books at once`, 400);
    }

    const { rows: fineRows } = await client.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM fines
       WHERE user_id = $1 AND is_paid = FALSE`,
      [borrow.user_id],
    );
    if (parseFloat(fineRows[0].total) > 0) {
      throw new AppError('User has unpaid fines and cannot be approved until they are settled', 400);
    }

    const now = new Date();
    const loanDays = Number.isInteger(Number(borrow.default_loan_days)) && Number(borrow.default_loan_days) > 0
      ? Number(borrow.default_loan_days)
      : BORROW_DAYS;

    const due_date = new Date(now);
    due_date.setDate(due_date.getDate() + loanDays);

    await client.query(
      `UPDATE borrow_records
       SET status = 'borrowed', approved_by = $1, borrowed_at = $2, due_date = $3
       WHERE id = $4`,
      [req.user.id, now, due_date, id],
    );

    await client.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
      [borrow.book_id],
    );

    await client.query('COMMIT');

    // Send response immediately (notification and logging are non-blocking)
    res.json({ success: true, data: { borrow_id: id, status: 'borrowed', due_date } });

    // Fire off notification and activity logging (non-critical, don't await)
    sendNotification(borrow.user_id, {
      title: 'Borrow Request Approved',
      message: `Your request for "${borrow.title}" has been approved. Return by ${due_date.toDateString()}.`,
      type: 'success',
    });
    logActivity(req.user.id, 'book.borrow.approve', 'borrow_record', id, req, {
      book_title: borrow.title,
      approved_by: req.user.id,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.rejectBorrow = async (req, res) => {
  const { id } = req.params;
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { rows: borrowRows } = await client.query(
      `SELECT br.*, b.title
       FROM borrow_records br
       JOIN books b ON br.book_id = b.id
       WHERE br.id = $1 FOR UPDATE`,
      [id],
    );
    const borrow = borrowRows[0];
    if (!borrow) throw new AppError('Borrow request not found', 404);
    if (borrow.status !== 'pending') {
      throw new AppError('Only pending borrow requests can be rejected', 400);
    }

    await client.query(
      `UPDATE borrow_records
       SET status = 'rejected', approved_by = $1
       WHERE id = $2`,
      [req.user.id, id],
    );

    await client.query('COMMIT');

    // Send response immediately (notification and logging are non-blocking)
    res.json({ success: true, data: { borrow_id: id, status: 'rejected' } });

    // Fire off notification and activity logging (non-critical, don't await)
    sendNotification(borrow.user_id, {
      title: 'Borrow Request Rejected',
      message: `Your request for "${borrow.title}" has been rejected.`,
      type: 'error',
    });
    logActivity(req.user.id, 'book.borrow.reject', 'borrow_record', id, req, {
      book_title: borrow.title,
      rejected_by: req.user.id,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── Return a Book ─────────────────────────────────────
exports.returnBook = async (req, res) => {
  const { borrow_id, condition = 'good', notes, returned_at: requestedReturnedAt } = req.body;
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { rows: borrowRows } = await client.query(
      `SELECT br.*, b.title AS book_title
       FROM borrow_records br
       JOIN books b ON br.book_id = b.id
       WHERE br.id = $1 AND br.status = 'borrowed' FOR UPDATE`,
      [borrow_id],
    );
    const borrow = borrowRows[0];
    if (!borrow) throw new AppError('Active borrow record not found', 404);

    const isAdmin = req.user.role === 'admin';
    if (borrow.user_id !== req.user.id && !isAdmin) {
      throw new AppError('Unauthorized', 403);
    }

    const now = new Date();
    const returnedAt = isAdmin && requestedReturnedAt
      ? new Date(requestedReturnedAt)
      : now;

    if (isAdmin && requestedReturnedAt) {
      if (Number.isNaN(returnedAt.getTime())) {
        throw new AppError('Returned date must be a valid date', 400);
      }
      if (returnedAt > now) {
        throw new AppError('Returned date cannot be in the future', 400);
      }
      const borrowedAt = new Date(borrow.borrowed_at);
      if (returnedAt < borrowedAt) {
        throw new AppError('Returned date cannot be before borrowed date', 400);
      }
    }

    const dueDate = new Date(borrow.due_date);
    const daysOverdue = Math.max(0, Math.floor((returnedAt - dueDate) / 86400000));
    const FINE_PER_DAY = parseFloat(process.env.FINE_PER_DAY || '0.50');
    let fineAmount = 0;

    if (condition === 'damaged') fineAmount += 10;
    if (condition === 'lost')    fineAmount += 50;
    if (daysOverdue > 0)         fineAmount += daysOverdue * FINE_PER_DAY;

    await client.query(
      `UPDATE borrow_records
       SET status = 'returned', returned_at = $1
       WHERE id = $2`,
      [returnedAt, borrow_id],
    );

    // Create return record
    await client.query(
      `INSERT INTO return_records (borrow_id, user_id, book_id, condition, processed_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [borrow_id, borrow.user_id, borrow.book_id, condition, req.user.id, notes || null],
    );

    // Create fine if applicable
    let fine = null;
    if (fineAmount > 0) {
      const { rows: fineRows } = await client.query(
        `INSERT INTO fines (borrow_id, user_id, amount, reason, days_overdue)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [borrow_id, borrow.user_id, fineAmount,
          condition !== 'good' ? condition : 'overdue', daysOverdue],
      );
      fine = fineRows[0];
    }

    // Increment available copies (unless lost)
    if (condition !== 'lost') {
      await client.query(
        'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
        [borrow.book_id],
      );
    }

    await client.query('COMMIT');

    // Send response immediately (notification and logging are non-blocking)
    res.json({
      success: true,
      data: { borrow_id, fine, days_overdue: daysOverdue, fine_amount: fineAmount },
    });

    // Fire off notification and activity logging (non-critical, don't await)
    if (fine) {
      sendNotification(borrow.user_id, {
        title: 'Fine Issued',
        message: `A fine of $${fineAmount.toFixed(2)} has been applied for "${borrow.book_title}".`,
        type: 'fine',
      });
    }
    logActivity(req.user.id, 'book.return', 'return_record', borrow_id, req);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── Get Borrow History ────────────────────────────────
exports.getBorrowHistory = async (req, res) => {
  const { user_id, status, page = 1, limit = 20 } = req.query;
  const isAdmin = req.user.role === 'admin';

  const targetUser = isAdmin && user_id ? user_id : req.user.id;
  const conditions = isAdmin && !user_id ? [] : ['br.user_id = $1'];
  const params = isAdmin && !user_id ? [] : [targetUser];
  let idx = params.length + 1;

  if (status) {
    conditions.push(`br.status = $${idx++}`);
    params.push(status);
  }

  const where  = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { rows } = await query(
    `SELECT br.*, b.title, b.author, b.cover_url, b.isbn,
            u.full_name AS user_name, u.email AS user_email,
            f.amount AS fine_amount, f.is_paid AS fine_paid
     FROM borrow_records br
     JOIN books b ON br.book_id = b.id
     JOIN users u ON br.user_id = u.id
     LEFT JOIN fines f ON f.borrow_id = br.id
     ${where}
     ORDER BY br.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, parseInt(limit), offset],
  );

  res.json({ success: true, data: rows });
};

// ── Get Overdue Books ─────────────────────────────────
exports.getOverdueBooks = async (req, res) => {
  const { rows } = await query(
    `SELECT br.*, b.title, b.author, b.isbn,
            u.full_name, u.email,
            (NOW() - br.due_date) AS overdue_by,
            EXTRACT(DAY FROM (NOW() - br.due_date)) AS days_overdue
     FROM borrow_records br
     JOIN books b ON br.book_id = b.id
     JOIN users u ON br.user_id = u.id
     WHERE br.status = 'borrowed' AND br.due_date < NOW()
     ORDER BY br.due_date ASC`,
  );

  // Auto-mark as overdue
  if (rows.length) {
    await query(
      `UPDATE borrow_records SET status = 'overdue'
       WHERE status = 'borrowed' AND due_date < NOW()`,
    );
  }

  res.json({ success: true, data: rows, count: rows.length });
};

// ── Cancel Pending Borrow ────────────────────────────
exports.cancelBorrow = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    // Get the borrow record
    const { rows: borrowRows } = await query(
      'SELECT * FROM borrow_records WHERE id = $1 AND user_id = $2',
      [id, user_id],
    );

    if (!borrowRows.length) {
      throw new AppError('Borrow record not found', 404);
    }

    const borrow = borrowRows[0];

    // Check if status is pending
    if (borrow.status !== 'pending') {
      throw new AppError('Only pending borrow requests can be cancelled', 400);
    }

    // Update borrow status to cancelled
    // Note: We don't need to restore available_copies since pending borrows
    // don't decrement copies in the first place
    await query(
      'UPDATE borrow_records SET status = \'cancelled\' WHERE id = $1',
      [id],
    );

    // Log activity
    await logActivity(user_id, 'cancelled_borrow', `Cancelled borrow request for book ID ${borrow.book_id}`);

    res.json({ success: true, message: 'Borrow request cancelled successfully' });
  } catch (error) {
    throw error; // Re-throw for error handler
  }
};
