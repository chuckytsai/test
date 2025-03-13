const dayjs = require('dayjs');
const express = require('express');
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const router = express.Router();

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

/* 取得全部區域 */
router.get('/getAllExamineAreas', function (req, res, next) {

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
        const sql = "SELECT * FROM [TmcRobo-Latest].[dbo].[ExamineArea]";
        request = new Request(sql, function (err, rows) {
            if (err) {
                res.json({
                    code: 500,
                    message: err,
                });
            }
           
            res.json(list);
        });

        request.on("row", (columns) => {
            const datas = {};
            datas["id"] = columns[0].value;
            datas["name"] = columns[1].value;
            datas["isAutoDispatchEnabled"] = columns[2].value == 1 ? true : false;
            datas["setting"] = columns[3].value;
            datas["holidays"] = [];
            datas["kiosks"] = [];
            datas["queueDisplays"] = [];
            datas["roboServers"] = [];
            list.push(datas);
        });

        connection.execSql(request);
    });
    connection.connect();

    connection.cancel();
});

/* 取得工作類型 */
router.get('/getJobTypesList', function (req, res, next) {

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
        const sql = "SELECT * FROM [TmcRobo-Latest].[dbo].[JobType]";
        request = new Request(sql, function (err, rows) {
            if (err) {
                res.json({
                    code: 500,
                    message: err,
                });
            }
           
            res.json(list);
        });

        request.on("row", (columns) => {
            const datas = {};
            datas["id"] = columns[0].value;
            datas["name"] = columns[1].value;
            datas["isDisplay"] = columns[2].value;
            datas["displaySeqeunce"] = columns[3].value;
            datas["ticketName"] = columns[4].value;
            datas["color"] = columns[5].value;
            datas["clerkJobTypeMappingTemplateSettings"] = [];
            datas["clerkJobTypeMappings"] = [];
            datas["examineJobs"] = [];
            list.push(datas);
        });

        connection.execSql(request);
    });
    connection.connect();

    connection.cancel();
});

module.exports = router;