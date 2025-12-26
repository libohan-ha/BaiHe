const { auth, admin } = require('../middleware/auth.middleware');

const adminAuth = [auth, admin];

module.exports = adminAuth;
