#!/usr/bin/env node
/**
 * Seed default admin user to the database
 * Usage: node seed-admin.js
 */

const bcrypt = require('bcryptjs');
const { query } = require('./src/config/database');

const SALT_ROUNDS = 12;
const DEFAULT_EMAIL = 'admin@library.com';
const DEFAULT_PASSWORD = 'Admin@123456';
const DEFAULT_NAME = 'Default Admin';

async function seedAdmin() {
  try {
    console.log('🌱 Seeding default admin user...');

    // Hash password
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    console.log('✓ Password hashed');

    // Insert roles if they don't exist
    await query(
      `INSERT INTO roles (name) VALUES ('admin'), ('user'), ('librarian')
       ON CONFLICT (name) DO NOTHING`
    );
    console.log('✓ Roles created/verified');

    // Get admin role ID
    const roleResult = await query(
      `SELECT id FROM roles WHERE name = 'admin'`
    );
    const adminRoleId = roleResult.rows[0].id;

    // Insert admin user
    const userResult = await query(
      `INSERT INTO users (full_name, email, password_hash, role_id, is_active, phone, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NULL, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, full_name`,
      [DEFAULT_NAME, DEFAULT_EMAIL, passwordHash, adminRoleId]
    );

    if (userResult.rows.length > 0) {
      const admin = userResult.rows[0];
      console.log(`\n✅ Admin user created successfully!\n`);
      console.log(`📧 Email:    ${admin.email}`);
      console.log(`🔐 Password: ${DEFAULT_PASSWORD}`);
      console.log(`👤 Name:     ${admin.full_name}`);
    } else {
      console.log(`\n⚠️  Admin user already exists with email: ${DEFAULT_EMAIL}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding admin:', err.message);
    process.exit(1);
  }
}

seedAdmin();
