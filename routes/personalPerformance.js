const dayjs = require('dayjs');
const express = require('express');
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const router = express.Router();
const keyWordIsNull = require("../public/javascripts/keyWordIsNull");
const whatSchedule = require("../public/javascripts/whatSchedule");

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

/* 個人績效報表查詢清單. */
router.post('/list', function (req, res, next) {
  const reqStartAt = req.body.startAt ? req.body.startAt : dayjs().format("YYYY-MM-DD 00:00:00.000");
  const reqEndAt = req.body.endAt ? req.body.endAt : dayjs().format("YYYY-MM-DD 23:59:59.000");
  const reqWhitch = keyWordIsNull(req.body.userId) ? req.body.userId : "00000000-0000-0000-0000-000000000000"
  
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

    const sql = "SELECT DISTINCT ej.Id ,[JobTypeId],ej.CreatedTime,ej.UpdatedTime,[FirstCalledTime],[FinishedTime],[WaitingSecond],[ServiceSecond],er.RoboServerOutletId,us.Name,er.UserId FROM [TmcRobo-Latest].[dbo].[ExamineJob] as ej LEFT JOIN [TmcRobo-Latest].[dbo].[ExamineRecord] As er" + "\n";
    const jobId = "ON ej.Id = er.JobId" + "\n";
    const joninUser = "LEFT JOIN [TmcRobo-Latest].[dbo].[User] as us" + "\n";
    const userName = "ON us.Id = er.UserId" + "\n";
    const startAt = "WHERE ej.CreatedTime >= '" + dayjs(reqStartAt).format("YYYY-MM-DD HH:mm:ss.000") + "'" + "\n";
    const endAt = "AND ej.CreatedTime <= '" + dayjs(reqEndAt).format("YYYY-MM-DD HH:mm:ss.999") + "'" + "\n";
    const finishedTime = "AND ej.FinishedTime IS NOT NULL" + "\n";
    const roboServerOutletId = "AND er.RoboServerOutletId IS NOT NULL" + "\n";
    const whitch = "AND er.UserId = '" + reqWhitch + "'\n";

    console.log(sql + jobId + joninUser + userName + startAt + endAt + finishedTime + roboServerOutletId + whitch);
    request = new Request(sql + jobId + joninUser + userName + startAt + endAt + finishedTime + roboServerOutletId + whitch, function (err, rows) {
      if (err) {
        res.json({
          code: 500,
          message: err,
        });
      }

      // 處理清單顯示多寡 && 有服務完病患才加入至顯示清單
      let list = [];
      examineJobList.map((item, i) => {
        const idx = list.map((items) => {
          return items.examineDate;
        }).indexOf(item.examineDate);

        let upDatedTime = Date.parse(item.upDatedTime);
        upDatedTime = Date.parse(dayjs(upDatedTime).set("hour", dayjs(upDatedTime).format("HH") - 8).format("YYYY-MM-DDTHH:mm:ss"));
        
        if(idx < 0) {
          item[whatSchedule(dayjs(upDatedTime).format("HHmm")) + "PatientCount"] = item[whatSchedule(dayjs(upDatedTime).format("HHmm")) + "PatientCount"] + 1;
          list.push(item);
        }
        else if(idx > -1) {
          list[idx][whatSchedule(dayjs(upDatedTime).format("HHmm")) + "PatientCount"] = list[idx][whatSchedule(dayjs(upDatedTime).format("HHmm")) + "PatientCount"] + 1;
          list[idx].waitingSecond;
          list[idx].count = list[idx].count + 1;
          list[idx].waitingSecond = (list[idx].waitingSecond + item.waitingSecond);
          list[idx].serviceSecond = (list[idx].serviceSecond + item.serviceSecond);
        }
      });

      // response 資料整理
      list = list.map((item) => {
        return {
          examineDate: item.examineDate,
          userName: item.userName,
          averageWaitingSecond: item.waitingSecond / item.count,
          averageServicedSecond: item.serviceSecond / item.count,
          count: item.count,
          morningPatientCount: item.morningPatientCount,
          afternoonPatientCount: item.afternoonPatientCount,
          eveningPatientCount: item.eveningPatientCount,
        }
      }).sort(function (a,b) {
        return Date.parse(a.examineDate) - Date.parse(b.examineDate);
      });

      res.json({
        code: 200,
        message: null,
        data: {
          startAt : dayjs(reqStartAt).format("YYYY-MM-DD 00:00:00:000"),
          endAt : dayjs(reqEndAt).format("YYYY-MM-DD 00:00:00:000"),
          list: [...list]
        }
      });
    });

    request.on("row", (columns) => {
      const datas = {};
      datas["examineDate"] = dayjs(columns[5].value).set("hour", dayjs(columns[5].value).format("HH") - 8).format("YYYY-MM-DD");
      datas["userId"] = columns[10].value;
      datas["userName"] = columns[9].value;
      datas["waitingSecond"] = columns[6].value;
      datas["serviceSecond"] = columns[7].value;
      datas["count"] = 1;
      datas["upDatedTime"] = columns[5].value;
      datas["morningPatientCount"] = 0;
      datas["afternoonPatientCount"] = 0;
      datas["eveningPatientCount"] = 0;
      examineJobList.push(datas);
    });
    connection.execSql(request);
  });
  connection.connect();

  connection.cancel();
});
module.exports = router;
