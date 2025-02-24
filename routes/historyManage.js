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
  const reqExamineJobId = req.body.examineJobId ? "'" +  req.body.examineJobId + "'\n" : "'00000000-0000-0000-0000-000000000000'" + "\n";
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
    const sql = "SELECT ejd.Id,ejd.ExamineJobId,ejd.Status,ejd.HisRawData,ejd.Barcode,ejd.UpdatedTime,ej.Status, ejd.Memo FROM [TmcRobo-Latest].[dbo].[ExamineJobDetail] as ejd LEFT JOIN [TmcRobo-Latest].[dbo].[ExamineJob] As ej" + "\n";
    const id = "ON ejd.ExamineJobId = ej.Id" + "\n";
    const examineJobId = "WHERE ExamineJobId = " + reqExamineJobId;
    const sotBy = "ORDER BY Barcode ASC";
    console.log(sql + id + examineJobId + sotBy)
    request = new Request(sql + id +  examineJobId + sotBy, function (err, rows) {
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
      datas["status"] = columns[6].value;
      if(JSON.parse(columns[3].value)["ContainerName"]) {
        datas["containerName"] = JSON.parse(columns[3].value)["ContainerName"];
      }
      else {
        datas["containerName"] = null;
      }

      if(JSON.parse(columns[3].value)["SpecimenName"]) {
        datas["specimenName"] = JSON.parse(columns[3].value)["SpecimenName"];
      }
      else {
        datas["specimenName"] = null;
      }

      if(JSON.parse(columns[3].value)["OrderNames"]) {
        datas["orderNames"] = JSON.parse(columns[3].value)["OrderNames"];
      }
      else {
        datas["opecimenName"] = null;
      }

      datas["isUrgent"] = JSON.parse(columns[3].value)["IsUrgent"];

      if(columns[7].value && JSON.parse(columns[7].value)["Orders"]) {
        datas["checkOrders"] = JSON.parse(columns[7].value)["Orders"].map((item) => {
          return item.OrderName;
        });
      }
      else {
        datas["checkOrders"] = [];
      }

      list.push(datas);
    });
    connection.execSql(request);
  });
  connection.connect();

  connection.cancel();
});

/* 單筆檢驗歷程清單. */
router.post('/recordList', function (req, res, next) {
  const reqExamineJobId = req.body.examineJobId ? "'" +  req.body.examineJobId + "'\n" : "'00000000-0000-0000-0000-000000000000'" + "\n"

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
    const sql = "SELECT * FROM [TmcRobo-Latest].[dbo].[ExamineRecord] as er LEFT JOIN [TmcRobo-Latest].[dbo].[User] As us" + "\n";
    const id = "ON er.UserId = us.Id"+ "\n";
    const clerk = "LEFT JOIN [TmcRobo-Latest].[dbo].[Clerk] As ck"+ "\n";
    const clerkId = "ON er.ClerkId LIKE ck.Id"+ "\n";
    const examineJobId = "WHERE JobId = " + reqExamineJobId;
    const sotBy = "ORDER BY CreatedTime ASC";
    console.log(sql + id +  clerk + clerkId + examineJobId + sotBy)
    request = new Request(sql + id + clerk + clerkId + examineJobId + sotBy, function (err, rows) {
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
      const CreatedTime = Date.parse(columns[7].value);
      datas["id"] = columns[0].value;
      datas["status"] = columns[5].value;
      datas["createdAt"] = Date.parse(dayjs(CreatedTime).set("hour", dayjs(CreatedTime).format("hh") - 8).format("YYYY-MM-DDThh:mm:ss")) / 1000;
      datas["userName"] = columns[10].value;
      datas["counterNo"] = columns[24].value;
      list.push(datas);
    });
    connection.execSql(request);
  });
  connection.connect();

  connection.cancel();
});

module.exports = router;
