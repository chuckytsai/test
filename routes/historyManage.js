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

const examineRecordFindUserId = (jobId) => {
  let id = null;
  var connection = new Connection(config);
  connection.on('connect', function await(err) {
    // If no error, then good to proceed.
    if (err) {
      throw err;
    }
    var sqlTest = "SELECT * FROM [TmcRobo-Latest].[dbo].[ExamineRecord] WHERE JobId = '" + jobId + "'"
    requestTest = new Request(sqlTest, function (err, rows) {
      if (err) {
        throw err;
      }
    });

    requestTest.on("row", (columns) => {
      console.log(columns[0].value)
    });
    connection.execSql(requestTest);
  });
  connection.connect();

  connection.cancel();
}

/* 檢驗歷程查詢清單. */
router.post('/list', function (req, res, next) {
  var examineJobList = [];
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
    var sql = "SELECT * FROM [TmcRobo-Latest].[dbo].[ExamineJob] WHERE ExamineDate >= '" + req.body.startAt + "' AND ExamineDate <= '" + req.body.endAt + "' ORDER BY " + req.body.sortBy + " " + req.body.sort;
    request = new Request(sql, function (err, rows) {
      if (err) {
        res.json({
          code: 500,
          message: err,
        });
      }

      // 處理清單顯示多寡 && 利用ExamineRecord表單放入使用者ID
      const list = [];
      examineJobList.map((item, i) => {
        if (i >= (req.body.pageSize * (req.body.pageNumber - 1)) && i < (req.body.pageNumber * req.body.pageSize)) {
          setTimeout(() => {
            console.log(examineRecordFindUserId(item.examineId))
            list.push(item);
          }, 1000);
        }
      });

      setInterval(() => {
        console.log("不可以送出")
      })

      res.json({
        code: 200,
        message: null,
        data: {
          counts: rows,
          totalPages: Math.ceil(rows / 10),
          list: [...list]
        }
      });
    });

    request.on("row", (columns) => {
      const datas = {};
      const UpdatedTime = String(columns[8].value);
      datas["examineId"] = columns[0].value;
      datas["examineDate"] = Date.parse(UpdatedTime) / 1000;
      datas["queueNo"] = columns[10].value;
      datas["patientName"] = columns[2].value;
      datas["waitingSecond"] = columns[17].value;
      datas["serviceSecond"] = columns[18].value;
      datas["status"] = columns[19].value;
      datas["userName"] = null;
      examineJobList.push(datas);
    });
    connection.execSql(request);
  });
  connection.connect();

  connection.cancel();
});

module.exports = router;
