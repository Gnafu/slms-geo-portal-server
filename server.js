const logger = require('morgan'),
      cors = require('cors'),
      http = require('http'),
      // https = require('https'),
      // fs = require('fs'),
      express = require('express'),
      errorhandler = require('errorhandler'),
      dotenv = require('dotenv'),
      bodyParser = require('body-parser');

const app = express();

dotenv.load();

// Parsers
// old version of line
// app.use(bodyParser.urlencoded());
// new version of line
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.use(function(err, req, res, next) {
  if (err.name === 'StatusError') res.send(err.status, err.message);
  else next(err);
});

if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
  app.use(errorhandler());
}

app.use(require('./anonymous-routes'));
app.use(require('./protected-routes'));
app.use(require('./user-routes'));

const port = process.env.PORT || 3001;

http.createServer(app).listen(port, function(err_) {
  console.log('listening in http://localhost:' + port);
});

// const app2 = express();
// app2.use(bodyParser.urlencoded({ extended: true }));
// app2.use(bodyParser.json());
// app2.use(cors());

// app2.use(function(err, req, res, next) {
//   if (err.name === 'StatusError') res.send(err.status, err.message);
//   else next(err);
// });

// if (process.env.NODE_ENV === 'development') {
//   app2.use(logger('dev'));
//   app2.use(errorhandler());
// }

// app2.use(require('./protected-routes'));
// app2.use(require('./user-routes'));

// https.createServer({
//   key: fs.readFileSync('key.pem'),
//   cert: fs.readFileSync('cert.pem')
// }, app2).listen(4433);
