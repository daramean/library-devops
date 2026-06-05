const { query, getClient } = require('../config/database');
const AppError = require('../utils/AppError');
const { logActivity } = require('../utils/activityLogger');
const ExcelJS = require('exceljs');

const parseOptionalInt = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseOptionalPositiveInt = (value, min = 1) => {
  const parsed = parseOptionalInt(value);
  return parsed === null || parsed < min ? null : parsed;
};

const normalizeCoverValue = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (['n/a', 'null'].includes(trimmed.toLowerCase())) return null;
  return trimmed;
};

// ── List Books (search + filter + pagination) ─────────
exports.getBooks = async (req, res) => {
  const {
    search, category_id, available,
    page = 1, limit = 20,
    sort = 'created_at', order = 'DESC'
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = ['b.is_active = TRUE'];
  const params = [];
  let idx = 1;

  if (search) {
    conditions.push(`(
      to_tsvector('english', b.title) @@ plainto_tsquery($${idx})
      OR to_tsvector('english', b.author) @@ plainto_tsquery($${idx})
      OR b.isbn ILIKE $${idx + 1}
    )`);
    params.push(search, `%${search}%`);
    idx += 2;
  }

  if (category_id) {
    conditions.push(`b.category_id = $${idx}`);
    params.push(category_id);
    idx++;
  }

  if (available === 'true') {
    conditions.push('b.available_copies > 0');
  }

  const where = conditions.join(' AND ');
  const allowedSort  = ['title','author','created_at','available_copies','publish_year'];
  const allowedOrder = ['ASC','DESC'];
  const safeSort  = allowedSort.includes(sort)  ? sort  : 'created_at';
  const safeOrder = allowedOrder.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

  const [data, count] = await Promise.all([
    query(
      `SELECT b.*, c.name AS category_name, c.color AS category_color
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE ${where}
       ORDER BY b.${safeSort} ${safeOrder}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), offset]
    ),
    query(`SELECT COUNT(*) FROM books b WHERE ${where}`, params),
  ]);

  res.json({
    success: true,
    data: data.rows,
    pagination: {
      total: parseInt(count.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count.rows[0].count / limit),
    },
  });
};

// ── Get Single Book ───────────────────────────────────
exports.getBook = async (req, res) => {
  const { rows } = await query(
    `SELECT b.*, c.name AS category_name, c.color AS category_color,
            (SELECT COUNT(*) FROM borrow_records WHERE book_id = b.id) AS total_borrows
     FROM books b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.id = $1 AND b.is_active = TRUE`,
    [req.params.id]
  );
  if (!rows[0]) throw new AppError('Book not found', 404);
  res.json({ success: true, data: rows[0] });
};

// ── Create Book ───────────────────────────────────────
exports.createBook = async (req, res) => {
  const {
    category_id, title, author, isbn, publisher,
    publish_year, description, cover_url, total_copies = 1,
    location, language, pages, tags, default_loan_days,
  } = req.body;

  if (!title || !title.toString().trim() || !author || !author.toString().trim()) {
    throw new AppError('Title and author are required', 400);
  }

  const sanitizedCategoryId = parseOptionalInt(category_id);
  const sanitizedPublishYear = parseOptionalInt(publish_year);
  const sanitizedTotalCopies = parseOptionalPositiveInt(total_copies, 1) ?? 1;
  const sanitizedPages = parseOptionalInt(pages);
  const sanitizedTags = Array.isArray(tags)
    ? tags.map((tag) => typeof tag === 'string' ? tag.trim() : tag).filter(Boolean)
    : typeof tags === 'string'
      ? tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : null;
  const sanitizedDefaultLoanDays = default_loan_days === undefined || default_loan_days === ''
    ? null
    : parseOptionalPositiveInt(default_loan_days, 1);

  if (default_loan_days !== undefined && default_loan_days !== '' && sanitizedDefaultLoanDays === null) {
    throw new AppError('Default loan days must be a positive integer', 400);
  }

  if (total_copies !== undefined && total_copies !== '' && parseOptionalPositiveInt(total_copies, 1) === null) {
    throw new AppError('Total copies must be a positive integer', 400);
  }

  if (publish_year !== undefined && publish_year !== '' && sanitizedPublishYear === null) {
    throw new AppError('Publish year must be an integer', 400);
  }

  if (pages !== undefined && pages !== '' && sanitizedPages === null) {
    throw new AppError('Pages must be an integer', 400);
  }

  // If a file was uploaded via multer, construct the full backend URL for the cover
  const coverFromFile = req.file
    ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    : null;
  const finalCoverUrl = coverFromFile || normalizeCoverValue(cover_url);

  let fieldErrors = {}; // Track field-level errors
  let finalIsbn = isbn || null;

  // Try to insert with all fields first
  try {
     const { rows } = await query(
      `INSERT INTO books
        (category_id, title, author, isbn, publisher, publish_year,
         description, cover_url, total_copies, available_copies,
         location, language, pages, tags, default_loan_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [sanitizedCategoryId, title, author, finalIsbn, publisher, sanitizedPublishYear,
      description, finalCoverUrl, sanitizedTotalCopies,
       location, language || 'English', sanitizedPages, sanitizedTags, sanitizedDefaultLoanDays]
     );

    await logActivity(req.user.id, 'book.create', 'book', rows[0].id, req, { title });
    return res.status(201).json({ 
      success: true, 
      data: rows[0],
      errors: {} // No errors
    });
  } catch (err) {
    // Handle unique constraint violation on ISBN (error code 23505)
    if (err.code === '23505' && err.constraint === 'books_isbn_key') {
      fieldErrors.isbn = 'A book with this ISBN already exists. Will be saved without ISBN.';
      finalIsbn = null; // Clear ISBN to retry
    } else {
      // For other errors, throw them
      throw err;
    }
  }

  // If we have ISBN error, retry without ISBN
  if (Object.keys(fieldErrors).length > 0) {
    try {
      const { rows } = await query(
        `INSERT INTO books
          (category_id, title, author, isbn, publisher, publish_year,
          description, cover_url, total_copies, available_copies,
          location, language, pages, tags, default_loan_days)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10,$11,$12,$13,$14)
        RETURNING *`,
        [sanitizedCategoryId, title, author, finalIsbn, publisher, sanitizedPublishYear,
        description, finalCoverUrl, sanitizedTotalCopies,
       location, language || 'English', sanitizedPages, sanitizedTags, sanitizedDefaultLoanDays]
      );

      await logActivity(req.user.id, 'book.create', 'book', rows[0].id, req, { title });
      // Return 201 even with errors, but include the errors object
      return res.status(201).json({ 
        success: true, 
        data: rows[0],
        errors: fieldErrors // Include field errors
      });
    } catch (retryErr) {
      throw retryErr;
    }
  }
};

// ── Update Book ───────────────────────────────────────
exports.updateBook = async (req, res) => {
  // Accept file upload cover as cover_url when provided
  if (req.file) {
    req.body.cover_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  } else if (req.body.cover_url !== undefined) {
    req.body.cover_url = normalizeCoverValue(req.body.cover_url);
  }
  const allowed = [
    'category_id','title','author','isbn','publisher','publish_year',
    'description','cover_url','total_copies','location','language','pages','tags','is_active','default_loan_days'
  ];
  const fields  = [];
  const values  = [];
  let idx = 1;

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      let value = req.body[key];

      if (['category_id', 'publish_year', 'total_copies', 'pages', 'default_loan_days'].includes(key)) {
        if (value === '') {
          value = null;
        } else {
          if (key === 'total_copies') {
            value = parseOptionalPositiveInt(value, 1);
            if (value === null) throw new AppError('Total copies must be a positive integer', 400);
          } else if (key === 'default_loan_days') {
            value = parseOptionalPositiveInt(value, 1);
            if (value === null) throw new AppError('Default loan days must be a positive integer', 400);
          } else if (key === 'category_id' || key === 'publish_year' || key === 'pages') {
            value = parseOptionalInt(value);
            if (value === null) throw new AppError(`${key.replace(/_/g, ' ')} must be an integer`, 400);
          }
        }
      }

      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  if (!fields.length) {
    if (req.file) {
      fields.push('cover_url = $1');
      values.push(`${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`);
      idx = 2;
    } else {
      throw new AppError('No fields to update', 400);
    }
  }

  values.push(req.params.id);
  const { rows } = await query(
    `UPDATE books SET ${fields.join(', ')} WHERE id = $${idx} AND is_active = TRUE RETURNING *`,
    values
  );
  if (!rows[0]) throw new AppError('Book not found', 404);

  await logActivity(req.user.id, 'book.update', 'book', rows[0].id, req);
  res.json({ success: true, data: rows[0] });
};

// ── Delete Book (soft) ────────────────────────────────
exports.deleteBook = async (req, res) => {
  const { rows } = await query(
    `UPDATE books SET is_active = FALSE WHERE id = $1 RETURNING id, title`,
    [req.params.id]
  );
  if (!rows[0]) throw new AppError('Book not found', 404);
  await logActivity(req.user.id, 'book.delete', 'book', req.params.id, req);
  res.json({ success: true, message: 'Book deleted', data: rows[0] });
};

// ── Export Books Excel ─────────────────────────────────
exports.exportBooks = async (req, res) => {
  const { rows } = await query(
    `SELECT b.title, b.author, b.isbn, c.name AS category,
            b.total_copies, b.available_copies, b.location, b.publish_year
     FROM books b LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.is_active = TRUE ORDER BY b.title`
  );

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Books');

  worksheet.columns = [
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Author', key: 'author', width: 30 },
    { header: 'ISBN', key: 'isbn', width: 20 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Total Copies', key: 'total_copies', width: 14 },
    { header: 'Available Copies', key: 'available_copies', width: 16 },
    { header: 'Location', key: 'location', width: 22 },
    { header: 'Publish Year', key: 'publish_year', width: 14 },
  ];

  rows.forEach((row) => worksheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=books.xlsx');
  res.send(Buffer.from(buffer));
};
