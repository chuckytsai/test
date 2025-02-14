var express = require('express');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var router = express.Router();

var config = {
  server: process.env['DB_HOST'],
  authentication: {
    type: 'default',
    options: {
      userName: process.env['DB_USER'],
      password: process.env['DB_PASS'],
    }
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  }
};
var connection = new Connection(config);
connection.on('connect', function (err) {
  // If no error, then good to proceed.
  if (err) {
    console.log("Connection Failed");
    throw err;
  }
  executeStatement();
});

connection.connect();

function executeStatement() {
  request = new Request("SELECT TOP (1000) [Id],[Name],[NameEng],[EmployeeId],[Title],[IsEnabled],[IsAdmin],[Setting] FROM [TmcRobo-Latest].[dbo].[User]", function (err) {
    if (err) {
      console.log(err)
    }
  });
  
  request.on("row", (columns) => {
      console.log(columns[0].value)
  });
  connection.execSql(request);
}
connection.cancel();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/test', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
