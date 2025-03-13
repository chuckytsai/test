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

/* 櫃台叫號模式管理清單. */
router.get('/list', function (req, res, next) {
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

    const sql = "SELECT ck.Id,[SequenceNo],[DisplayName], jb.TicketName, jb.DisplaySeqeunce, cki.CallOrder FROM [TmcRobo-Latest].[dbo].[Clerk] as ck LEFT JOIN [TmcRobo-Latest].[dbo].[ClerkJobTypeMapping] as cki" + "\n";
    const clerkId = "ON ck.Id = cki.ClerkId" + "\n";
    const joninJobType = "LEFT JOIN [TmcRobo-Latest].[dbo].[JobType] as jb" + "\n";
    const clerkTypeId = "ON cki.ClerkTypeId = jb.Id" + "\n";
    const sotBy = "ORDER BY ck.SequenceNo ASC, cki.CallOrder ASC";
    console.log(sql + clerkId + joninJobType + clerkTypeId + sotBy);
    request = new Request(sql + clerkId + joninJobType + clerkTypeId + sotBy, function (err, rows) {
      if (err) {
        res.json({
          code: 500,
          message: err,
        });
      }

      const jobTypeList = [];

      list.map((item) => {
        const idx = jobTypeList.map((items) => {
          return items?.counterId;
        }).indexOf(item.counterId);
        if(idx < 0 && item.callOrder){
          jobTypeList.push({
            counterId: item.counterId,
            counterName: item.containerName,
            counterNo: item.counterNo,
            enabledJobTypes: [{
                callOrder: item.callOrder,
                jobType: item.jobType,
                displayName: item.displayName
            }]
          });
        }
        if(idx < 0 && !item.callOrder){
          jobTypeList.push({
            counterId: item.counterId,
            counterName: item.containerName,
            counterNo: item.counterNo,
            enabledJobTypes: []
          });
        }
        else if(idx > -1) {
          jobTypeList[idx].enabledJobTypes.push({
            callOrder: item.callOrder,
            jobType: item.jobType,
            displayName: item.displayName
          });
        }
      });
      res.json(jobTypeList);
    });

    request.on("row", (columns) => {
      const datas = {};
      datas["counterId"] = columns[0].value;
      datas["counterName"] = columns[2].value;
      datas["counterNo"] = columns[1].value;
      datas["callOrder"] = columns[5].value;
      datas["jobType"] = columns[4].value;
      datas["displayName"] = columns[3].value;

      list.push(datas);
    });
    connection.execSql(request);
  });
  connection.connect();

  connection.cancel();
});

/* 獲取指定櫃台的工作類型清單. */
router.post('/counterId', function (req, res, next) {
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

    if (!req.body.counterId) {
      res.json({
        code: 403,
        message: "no counterId",
      });
    }

    const sql = "SELECT ck.Id,[SequenceNo],[DisplayName], jb.TicketName, jb.DisplaySeqeunce, cki.CallOrder FROM [TmcRobo-Latest].[dbo].[Clerk] as ck LEFT JOIN [TmcRobo-Latest].[dbo].[ClerkJobTypeMapping] as cki" + "\n";
    const clerkId = "ON ck.Id = cki.ClerkId" + "\n";
    const joninJobType = "LEFT JOIN [TmcRobo-Latest].[dbo].[JobType] as jb" + "\n";
    const clerkTypeId = "ON cki.ClerkTypeId = jb.Id" + "\n";
    const whitch = "WHERE ck.Id = '"+ req.body.counterId + "'" + "\n";
    const sotBy = "ORDER BY ck.SequenceNo ASC, cki.CallOrder ASC";
    console.log(sql + clerkId + joninJobType + clerkTypeId + whitch + sotBy);
    request = new Request(sql + clerkId + joninJobType + clerkTypeId + whitch + sotBy, function (err, rows) {
      if (err) {
        res.json({
          code: 500,
          message: err,
        });
      }

      const jobTypeList = {};

      jobTypeList.counterId = list[0]?.counterId;
      jobTypeList.counterName = list[0]?.counterName;
      jobTypeList.counterNo = list[0]?.counterNo;
      jobTypeList.enabledJobTypes = [];

      list.map((item) => {
        if(item.callOrder) {
          jobTypeList.enabledJobTypes.push({
            callOrder: item.callOrder,
            jobType: item.jobType,
            displayName: item.displayName
          })
        }
      });
  
      res.json(jobTypeList);
    });

    request.on("row", (columns) => {
      const datas = {};
      datas["counterId"] = columns[0].value;
      datas["counterName"] = columns[2].value;
      datas["counterNo"] = columns[1].value;
      datas["callOrder"] = columns[5].value;
      datas["jobType"] = columns[4].value;
      datas["displayName"] = columns[3].value;

      list.push(datas);
    });
    connection.execSql(request);
  });
  connection.connect();

  connection.cancel();
});

/* 編輯指定櫃台的工作類型清單. */
router.post('/counterIdEdit', function (req, res, next) {
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

    if (!req.body.counterId) {
      res.json({
        code: 403,
        message: "no counterId",
      });
    }

    if (!req.body.enabledJobTypes || !Array.isArray(req.body.enabledJobTypes)) {
      res.json({
        code: 403,
        message: "no enabledJobTypes",
      });
    }

    req.body.enabledJobTypes.map((item) => {
      if(typeof(item.jobTypeId) !== "number" || typeof(item.order) !== "number")
        res.json({
          code: 404,
          message: "no jobTypeId or order",
        });
    });

    const sql = "DELETE FROM [TmcRobo-Latest].[dbo].[ClerkJobTypeMapping]" + "\n";
    const where = "WHERE ClerkId = '"+ req.body.counterId +"'" + "\n";
    const insert =  "INSERT [ClerkJobTypeMapping] (ClerkId, ClerkTypeId, CallOrder) VALUES";
    const values = req.body.enabledJobTypes.map((item) => {
      return "('" + req.body.counterId + "'," + item.jobTypeId + ", " +  item.order + ")"
    });

    console.log(sql + where + insert + values);
    request = new Request(sql + where + insert + values , function (err, rows) {
      if (err) {
        res.json({
          code: 500,
          message: err,
        });
      }

      res.json(true);
    });
    connection.execSql(request);
  });
  connection.connect();

  connection.cancel();
});

module.exports = router;
