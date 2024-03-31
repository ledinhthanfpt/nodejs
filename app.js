// Import các module cần thiết
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');

// Import các router từ các file riêng
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products');
var categoriesRouter = require('./routes/categories');
var statisticRouter = require('./routes/statistic');
var verifyRouter = require('./routes/verify');
var authMiddlewareRouter = require('./routes/authMiddleware');
var orderRouter = require('./routes/order');
var apiRouter = require('./routes/api/products');
var apiusersRouter = require('./routes/api/users');
var apicategoriesRouter = require('./routes/api/categories');

// Khởi tạo ứng dụng Express
var app = express();

// Cấu hình CORS với tùy chọn cho phép credentials và chỉ định nguồn gốc
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:5500'];
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Cấu hình engine template, parser và logger
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Sử dụng các router
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/categories', categoriesRouter);
app.use('/statistic', statisticRouter);
app.use('/verify', verifyRouter);
app.use('/authMiddleware', authMiddlewareRouter);
app.use('/order', orderRouter);
app.use('/api/products', apiRouter);
app.use('/api/users', apiusersRouter);
app.use('/api/categories', apicategoriesRouter);

// Xử lý lỗi 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Trình xử lý lỗi
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Xuất bản ứng dụng
module.exports = app;
