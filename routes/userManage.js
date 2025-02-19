var express = require('express');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var router = express.Router();
var { v4: uuidv4 } = require('uuid');
var dayjs = require('dayjs');

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
        var sqlAdd = "INSERT [User] (Id, Name, NameEng, EmployeeId, Title, Password, IsEnabled, IsAdmin, UpdatedTime, AreaId, EMailAddress, Setting)";
        const englishName = req.body.englishName ? req.body.englishName : ' '
        const isAdmin = req.body.isAdmin ? 1 : 0;
        const UpdatedTime = String(req["_startTime"]);

        var sqlValue = "VALUES ('" + uuidv4() + "', '" + req.body.userName + "', '" + englishName + "','" + req.body.employeeId + "', '" + req.body.title + "', 'BriJvAP8DqiRFdaMLsQCFQ==', 1, " + isAdmin + ", '" + dayjs(UpdatedTime).format("YYYY-MM-DD hh:mm:SSS") + "', NULL, NULL, NULL)";
        requestAdd = new Request(sqlAdd + sqlValue, function (err, rows) {
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
router.post('/edit', function (req, res, next) {

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
    var sqlGet = "SELECT * FROM [User] WHERE Id ='" + req.body.userId + "'";
    request = new Request(sqlGet, function (err, rows) {
      if (err) {
        res.json({
          code: 500,
          message: err,
        });
        throw err;
      }

      if (rows == 0) {
        res.json({
          code: 303,
          message: "帳號異常或是該無帳號",
        });
      }
      else {
        const isAdmin = req.body.isAdmin ? 1 : 0;
        const isEnabled = req.body.isEnabled ? 1 : 0;
        const UpdatedTime = String(req["_startTime"]);
        var sql = "UPDATE [User] SET Name='" + req.body.userName + "', NameEng='" + req.body.userNameEng + "',  Title='" + req.body.title + "', IsEnabled=" + isEnabled + ", IsAdmin=" + isAdmin + ", UpdatedTime='" + dayjs(UpdatedTime).format("YYYY-MM-DD hh:mm:SSS") + "' WHERE Id=" + "'" + req.body.userId + "'";
        requestEdit = new Request(sql, function (err, rows) {
          if (err) {
            res.json({
              code: 500,
              message: err,
            });
            throw err;
          }
          res.json({
            code: 200,
            message: "成功",
            data: {
              userName: req.body.userName,
              userNmaeEng: req.body.userNmaeEng,
              title: req.body.title,
              isEnabled: req.body.isEnabled,
              isAdmin: req.body.isAdmin,
            }
          });
        })
        connection.execSql(requestEdit)
      }
    });
    connection.execSql(request)
  });

  connection.connect();

  connection.cancel();
});

module.exports = router;
