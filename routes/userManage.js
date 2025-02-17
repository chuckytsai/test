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

/* GET home page. */
router.get('/list', function (req, res, next) {
  var userManageList = [];
  var connection = new Connection(config);
  connection.on('connect', function await(err) {
    // If no error, then good to proceed.
    if (err) {
      res.json({
        code: 500,
        message: err,
      });
      throw err;
    }
    request = new Request("SELECT TOP (1000) [Id],[Name],[NameEng],[EmployeeId],[Title],[IsEnabled],[IsAdmin] FROM [TmcRobo-Latest].[dbo].[User]", function (err) {
      if (err) {
        res.json({
          code: 500,
          message: err,
        });
      }

      res.json({
          code: 200,
          message: null,
          data: [...userManageList]
        });
    });

    request.on("row", (columns) => {
      const datas = {};
      datas["userId"] = columns[0].value;
      datas["userName"] = columns[1].value;
      datas["userNmaeEng"] = columns[2].value;
      datas["employeeId"] = columns[3].value;
      datas["title"] = columns[4].value;
      datas["isEnabled"] = columns[5].value;
      datas["isAdmin"] = columns[6].value;
      userManageList.push(datas);
    });
    connection.execSql(request);
  });

  connection.connect();

  connection.cancel();
});

module.exports = router;
