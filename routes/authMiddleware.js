require('dotenv').config();
const jwt = require('jsonwebtoken');

const checkUserLoggedIn = (req, res, next) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.redirect('/users/login');
  }

  try {
    const verified = jwt.verify(token, process.env.KEY_CRYPTO);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).send('Invalid Token');
  }
};

module.exports = checkUserLoggedIn;
