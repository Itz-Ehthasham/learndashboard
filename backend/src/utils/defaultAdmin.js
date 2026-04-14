const User = require('../models/User');

const DEFAULT_ADMIN_EMAIL =
  (process.env.DEFAULT_ADMIN_EMAIL || 'admin@admin.com').toLowerCase().trim();
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123';

async function ensureDefaultAdmin() {
  const existing = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
    }
    return;
  }

  await User.create({
    firstName: 'Admin',
    lastName: 'Administrator',
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    role: 'admin',
  });
}

module.exports = {
  ensureDefaultAdmin,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
};
