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
    database: process.env['DB_BASE']
  }
};

/* 使用者管理清單. */
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
    request = new Request("SELECT * FROM [User]", function (err) {
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
      datas["isEnabled"] = columns[6].value;
      datas["isAdmin"] = columns[7].value;
      userManageList.push(datas);
    });
    connection.execSql(request);
  });

  connection.connect();

  connection.cancel();
});

// 新增使用者
router.post('/add', function (req, res, next) {
  // console.log(req["_startTime"])
  // console.log(req.body)
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
    var sqlGet = "SELECT * FROM [User] WHERE EmployeeId ='" + req.body.employeeId + "'";
    request = new Request(sqlGet, function (err, rows) {
      if (err) {
        res.json({
          code: 500,
          message: err,
        });
      }

      if (rows > 0) {
        res.json({
          code: 303,
          message: "已有重複帳號",
        });
      }
      else {
        var sqlAdd = "INSERT [User] (Id, Name, NameEng, EmployeeId, Title, Password, IsEnabled, IsAdmin, UpdatedTime, AreaId, EMailAddress, Setting) VALUES ('00000000-0000-0000-0000-000000000001', 'Test', '','000002', '管理者', 'BriJvAP8DqiRFdaMLsQCFQ==', 1, 1, '2015-03-11 00:00:00.000', NULL, NULL, NULL)";
        requestAdd = new Request(sqlAdd, function (err, rows) {
          if (err) {
            res.json({
              code: 500,
              message: err,
            });
          }
          res.json({
            code: 200,
            message: "成功",
          });
        })

        connection.execSql(requestAdd)
      }
    });

    connection.execSql(request)
  });

  connection.connect();

  connection.cancel();
});

// 編輯使用者
router.get('/edit', function (req, res, next) {
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

    // INSERT [User] (Id, Name, NameEng, EmployeeId, Title, Password, IsEnabled, IsAdmin, UpdatedTime, AreaId, EMailAddress, Setting)
    // VALUES ('00000000-0000-0000-0000-000000000001', 'Test', '','000002', '管理者', 'BriJvAP8DqiRFdaMLsQCFQ==', 1, 1, '2015-03-11 00:00:00.000', NULL, NULL, NULL)

    request = new Request("SELECT * FROM [TmcRobo-Latest].[dbo].[User]", function (err) {
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
