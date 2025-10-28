// scripts/generate-token.js
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'CHANGE_ME';
const args = process.argv.slice(2);

// uso: node scripts/generate-token.js <sub> [expiresIn]
const sub = args[0] || 'test-user';
const expiresIn = args[1] || '1h';

const token = jwt.sign({ sub }, secret, { expiresIn });
console.log(token);
