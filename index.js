const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const multer = require('multer')
const config = require('./config/settings.json')
const chainlib = require('./app/chainlib.js')
const app = express()

console.log(`Starting blockchain test server`)

// middleware
app.use(morgan('combined'))
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


// routes

app.post('/chaincode/deploy', function (req, res) {
    chainlib.deployChaincode(req.body.chaincode_name, function (err, result) {
        if (err == undefined) {
            res.json({
                message: `Successfully deployed chaincode '${req.body.chaincode_name}'.`,
                result: result
            })
        } else {
            res.status(500).send(`Failed to deploy chaincode '${req.body.chaincode_name}'. Err: ${err}`);
        }
    })
});

app.get('/chaincode/query', function (req, res) {
    chainlib.queryChaincode(req.query.chaincode_id, req.query.function, [req.query.key], function (err, result) {
        if (err == undefined) {
            res.json({
                message: `Successfully chaincode query '${req.body.chaincode_name}'.`,
                result: result
            })
        } else {
            res.status(500).send(`Failed to query chaincode '${req.body.chaincode_name}'. Err: ${err}`);
        }
    })
});


// only start the server if the blockchain initialized properly
chainlib.initChain(function(err) {
    if (err === undefined) {
        app.listen(config.serverListenPort, function () {
            console.log(`Example app listening on port ${config.serverListenPort}!`);
        });
    } else {
        console.log(`Failed to initialize blockchain: ${err}. Server can't start.`)
    }
})
