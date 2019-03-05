const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Router
const indexRouter = require('./routes/index');
// const linkedinRouter = require('./routes/linkedin')

const app = express();
const http = require('https')
const querystring = require('querystring')

// salesforce
const jsforce = require('jsforce')
const conn = new jsforce.Connection()

// linkedin
let code;
const client_id = '';
const client_secret = '';

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// linkedin
app.use('/linkedin',(request, response, next) => {
  // レンダリング
  response.render('linkedin');

  // 認証コード
  code = request.query.code;

  // アクセストークン取得
  const params = querystring.stringify({
    'grant_type': 'authorization_code',
    'code': code,
    'redirect_uri': 'http://localhost:3000/linkedin',
    'client_id': client_id,
    'client_secret': client_secret
  })
  let accessToken;
  new Promise((resolve, reject) => {
    const req = http.request('https://www.linkedin.com/oauth/v2/accessToken?'+params, res => {
      console.log(`STATUS: ${res.statusCode}`)
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`)
      res.setEncoding('utf8')
      res.on('data', (chunk) => {
        console.log('body: ' + chunk)
        console.log(typeof chunk)
        accessToken = JSON.parse(chunk).access_token
        console.log('【ACCESS_TOKEN】: ' + accessToken)
      })
      res.on('end', () => {
        console.log('No more data')
        resolve()
      })
    })
    req.on('error', err => {
      console.error(`ERROR: ${err}`)
    })
    req.end()
  })
  .then(() => {
    // person取得
    const options = {
      protocol: 'https:',
      host: 'api.linkedin.com',
      path: '/v1/people/~?format=json',
      method: 'GET',
　　　　  headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
    }
    const req = http.request(options, res => {
      console.log(`STATUS: ${res.statusCode}`)
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`)
      res.setEncoding('utf8')
      res.on('data', (chunk) => {
        console.log('body: ' + chunk)
      })
      res.on('end', () => {
        console.log('No more data')
      })
    })
    req.on('error', err => {
      console.error(`ERROR: ${err}`)
    })
    req.end()
  })
})

/**
 * SALESFORCE
 */
// レコード取得
app.get('/api/getRecords',(request,response,next) => {
  conn.login('', '', (err, res) => {
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


/**
 * LINKEDIN
 */
// linkedinのアクセストークン取得
app.get('/api/auth/linkedin', (request, response, next) => {

  const params = querystring.stringify({
    'response_type': 'code',
    'client_id': client_id,
    'redirect_uri': 'http://localhost:3000/linkedin',
    'scope': 'r_emailaddress'
  })

  let authUri;

  const req = http.request('https://www.linkedin.com/oauth/v2/authorization?'+params, res => {
    console.log(`STATUS: ${res.statusCode}`)
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`)
    authUri = res.headers.location
    res.setEncoding('utf8')
    res.on('data', (chunk) => {
      // ...
    })
    res.on('end', () => {
      console.log('No more data')
      response.json({status: true, result: authUri})
    })
  })
  req.on('error', err => {
    console.error(`ERROR: ${err}`)
  })
  req.end()

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
