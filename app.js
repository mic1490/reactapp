var createError = require('http-errors');
var cors = require('cors')
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var logger = require('morgan');
const IP = require('ip');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var validator = require('./routes/validator');
const allRoutes = require('./routes/routes');

var app = express();


app.use(cors())




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.locals.pretty = true;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: '@$QKbc(t3B?.ulW',
  resave: false,
  saveUninitialized: false
}));

app.use('/', indexRouter);
app.use('/', usersRouter);
app.use(allRoutes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  next(createError(404));
});

// Handling Errors
app.use((err, req, res, next) => {

  res.header("Access-Control-Allow-Origin", "*");
  // console.log(err);
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";
  res.status(err.statusCode).json({
    message: err.message,
  });
});





module.exports = app;
