var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var app = express();
const jsforce = require('jsforce')
const conn = new jsforce.Connection()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// レコード取得
app.get('/api/getRecords',(request,response,next) => {
  conn.login('yosuke@dev.com', '1q2w3e4r', (err, res) => {
    if (err) {return console.error(err)}
    conn.query('SELECT id, name, count__c, latestVisitDate__c FROM Account', (err,res) => {
      if (err) { return console.error(err)}
      response.json({status: true, result: res})
    })
  })
})

// アップデート
app.post('/api/update', (request, response, next) => {
  conn.sobject('Account').update({
    Id: request.body.Id,
    Name: request.body.Name,
    Count__c: request.body.Count__c,
    latestVisitDate__c: request.body.latestVisitDate__c
  }, (err, ret) => {
    if (err || !ret.success) { return console.error(err, ret); }
    console.log('Updated Successfully : ' + ret.id);
    response.json({status: true, result: ret.id})
  })
})


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
