require('dotenv').config();

const crypto = require('crypto');

// Khóa bí mật dùng cho việc mã hóa và giải mã
const secretKey = Buffer.from(process.env.KEY_CRYPTO, 'base64');
const algorithm = 'aes-256-cbc'; // Thuật toán mã hóa

// Hàm mã hóa
function encrypt(text) {
  const iv = crypto.randomBytes(16); // Vector khởi tạo
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Hàm giải mã
function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
