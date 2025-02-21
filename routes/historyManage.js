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
    const startAt = "WHERE ej.ExamineDate >= '" + req.body.startAt + "'" + "\n";
    const endAt = "AND ej.ExamineDate <= '" + req.body.endAt + "'" + "\n";
    const queueNo = "AND ej.QueueNo LIKE '" + keyWordIsNull(req.body.queueNo) + "'\n";
    const patientName = "AND ej.PatientName LIKE '" + keyWordIsNull(req.body.patientName) + "'\n";
    const sotBy = "ORDER BY " + req.body.sortBy.toUpperCase() + "\n" + req.body.sort.toUpperCase() + ", QueueNo ASC";
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
        if (i >= (req.body.pageSize * (req.body.pageNumber - 1)) && i < (req.body.pageNumber * req.body.pageSize)) {
          list.push(item);
        }
      });

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

module.exports = router;
