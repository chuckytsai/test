var express = require('express');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var router = express.Router();

var config = {
  server: '10.1.100.139',  //update me
  authentication: {
    type: 'default',
    options: {
      userName: 'sa', //update me
      password: 'TmcTW@2019',  //update me
    }
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    database: "TmcRobo-Latest"
  }
};
var connection = new Connection(config);
connection.on('connect', function (err) {
  // If no error, then good to proceed.
  if (err) {
    console.log("Connection Failed");
    throw err;
  }
  executeStatement()
});

connection.connect();

function executeStatement() {
  request = new Request("SELECT TOP (1000) [Id],[Name],[NameEng],[EmployeeId],[Title],[Password],[IsEnabled],[IsAdmin],[UpdatedTime],[AreaId],[EMailAddress],[Setting] FROM [TmcRobo-Latest].[dbo].[User]", function (err) {
    if (err) {
      console.log(err)
    }
  });
  
  request.on("row", (columns) => {
      console.log(columns[0].value)
  });
  connection.execSql(request);
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/test', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
