require('dotenv').config();
const jwt = require('jsonwebtoken');

// Middleware để kiểm tra token và role người dùng
const checkUserPermission = (req, res, next) => {
  // Lấy token từ cookie
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  try {
    // Xác thực token
    const decoded = jwt.verify(token, process.env.KEY_CRYPTO);
    req.user = decoded;

    // Kiểm tra nếu role là 'user'
    if (decoded.role === 'user') {
      
      next();
    } else {
      return res.status(403).json({ message: "Access denied. You do not have permission to view this content." });
    }
  } catch (error) {
    // Xử lý nếu token không hợp lệ
    return res.status(400).json({ message: "Invalid token." });
  }
};


module.exports = checkUserPermission;