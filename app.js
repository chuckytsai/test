var createError = require('http-errors');
var express = require('express');
var cors = require('cors')
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

require('dotenv').config();

var indexRouter = require('./routes/index');
var communityRouter = require('./routes/community');
var usersRouter = require('./routes/users');
var userManageRouter = require('./routes/userManage');
var historyManageRouter = require('./routes/historyManage');
var performanceManageRouter = require('./routes/performanceManage');
var personalPerformanceRouter = require('./routes/personalPerformance');
var counterMappingTemplateRouter = require('./routes/counterMappingTemplate');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);
app.use('/community', communityRouter);
app.use('/users', usersRouter);
app.use('/userManage', userManageRouter);
app.use('/historyManage', historyManageRouter);
app.use('/performanceManage', performanceManageRouter);
app.use('/personalPerformance', personalPerformanceRouter);
app.use('/counterMappingTemplate', counterMappingTemplateRouter);

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

module.exports = app;
