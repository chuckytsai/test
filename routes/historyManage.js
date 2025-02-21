const dayjs = require('dayjs');
const express = require('express');
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const router = express.Router();
const keyWordIsNull = require("../public/javascripts/keyWordIsNull");

const config = {
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

/* 檢驗歷程查詢清單. */
router.post('/list', function (req, res, next) {
  const reqStartAt = req.body.startAt ? req.body.startAt : dayjs().format("YYYY-MM-DD");
  const reqEndAt = req.body.endAt ? req.body.endAt : dayjs().format("YYYY-MM-DD");
  const reqSortBy = req.body.sortBy ? req.body.sortBy.toUpperCase() : "ExamineDate";
  const reqSort = req.body.sort ? req.body.sort.toUpperCase() : "ASC";
  const reqPageSize = req.body.pageSize ? req.body.pageSize : 999;
  const reqPageNumber = req.body.pageNumber ? req.body.pageNumber : 1;

  const examineJobList = [];
  const connection = new Connection(config);
  connection.on('connect', function await(err) {
    // If no error, then good to proceed.
    if (err) {
      res.json({
        code: 500,
        message: err,
      });
      throw err;
    }

    const sql = "SELECT DISTINCT ej.Id [Id],[PatientName],[JobTypeId],[ExamineDate],[QueueNo],[WaitingSecond],[ServiceSecond],ej.Status,us.Name FROM [TmcRobo-Latest].[dbo].[ExamineJob] as ej LEFT JOIN [TmcRobo-Latest].[dbo].[ExamineRecord] As er" + "\n";
    const jobId = "ON ej.Id = er.JobId" + "\n";
    const joninUser = "LEFT JOIN [TmcRobo-Latest].[dbo].[User] as us" + "\n";
    const userName = "ON us.Id = er.UserId" + "\n";
    const startAt = "WHERE ej.ExamineDate >= '" + reqStartAt + "'" + "\n";
    const endAt = "AND ej.ExamineDate <= '" + reqEndAt + "'" + "\n";
    const queueNo = "AND ej.QueueNo LIKE '" + keyWordIsNull(req.body.queueNo) + "'\n";
    const patientName = "AND ej.PatientName LIKE '" + keyWordIsNull(req.body.patientName) + "'\n";
    const sotBy = "ORDER BY " + reqSortBy + "\n" + reqSort + ", QueueNo ASC";
    console.log(sql + jobId + joninUser + userName + startAt + endAt + queueNo + patientName + sotBy)
    request = new Request(sql + jobId + joninUser + userName + startAt + endAt + queueNo + patientName + sotBy, function (err, rows) {
      if (err) {
        res.json({
          code: 500,
          message: err,
        });
      }

      // 處理清單顯示多寡
      const list = [];
      examineJobList.map((item, i) => {
        if (i >= (reqPageSize * (reqPageNumber - 1)) && i < (reqPageNumber * reqPageSize)) {
          list.push(item);
        }
      });

      res.json({
        code: 200,
        message: null,
        data: {
          startAt : reqStartAt,
          endAt : reqEndAt,
          counts: rows,
          totalPages: Math.ceil(rows / 10),
          list: [...list]
        }
      });
    });

    request.on("row", (columns) => {
      const datas = {};
      const UpdatedTime = String(columns[3].value);
      datas["examineId"] = columns[0].value;
      datas["examineDate"] = dayjs(UpdatedTime).format("YYYY-MM-DD");
      datas["queueNo"] = columns[4].value;
      datas["patientName"] = columns[1].value;
      datas["waitingSecond"] = columns[5].value;
      datas["serviceSecond"] = columns[6].value;
      datas["status"] = columns[7].value;
      datas["userName"] = columns[8].value;
      datas["patientName"] = columns[1].value
      examineJobList.push(datas);
    });
    connection.execSql(request);
  });
  connection.connect();

  connection.cancel();
});

/* 單筆檢驗項目清單. */
router.post('/detailList', function (req, res, next) {
  const list = [];
  const connection = new Connection(config);
  connection.on('connect', function await(err) {
    // If no error, then good to proceed.
    if (err) {
      res.json({
        code: 500,
        message: err,
      });
      throw err;
    }
    const sql = "SELECT * FROM [TmcRobo-Latest].[dbo].[ExamineJobDetail]" + "\n";
    const examineJobId = "WHERE examineJobId = '" + req.body.examineJobId + "'\n";
    console.log(sql + examineJobId)
    request = new Request(sql + examineJobId, function (err, rows) {
      if (err) {
        res.json({
          code: 500,
          message: err,
        });
      }

      res.json({
        code: 200,
        message: null,
        data: [...list]
      });
    });

    request.on("row", (columns) => {
      const datas = {};
      datas["barcode"] = columns[4].value;
      datas["test"] = columns[3].value;
      list.push(datas);
    });
    connection.execSql(request);
  });
  connection.connect();

  connection.cancel();
});

module.exports = router;
