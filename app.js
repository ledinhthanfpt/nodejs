var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

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

const cors = require('cors');



var app = express();



app.use(cors()); 



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products',productsRouter);
app.use('/categories',categoriesRouter);
app.use('/statistic',statisticRouter);
app.use('/verify', verifyRouter);
app.use('/authMiddleware', authMiddlewareRouter);
app.use('/order',orderRouter);



app.use('/api/products', apiRouter);
app.use('/api/users', apiusersRouter);
app.use('/api/categories', apicategoriesRouter);




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); 
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

module.exports = app;
