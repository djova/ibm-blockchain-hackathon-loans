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

function chaincodeResultToString(results) {
    if (results.result !== undefined) {
        return results.result.toString()
    } else {
        return "none"
    }
}

app.post('/chaincode/deploy', function (req, res) {
    chainlib.deployChaincode(req.body.chaincode_name, function (err, result) {
        if (err == undefined) {
            res.json({
                message: `Successfully deployed chaincode '${req.body.chaincode_name}'.`,
                result: chaincodeResultToString(result)
            })
        } else {
            res.status(500).send(`Failed to deploy chaincode '${req.body.chaincode_name}'. Err: ${err}`);
        }
    })
})

app.post('/chaincode/query', function (req, res) {
    chainlib.queryChaincode(req.body.chaincode_id, req.body.function, req.body.args, function (err, result) {
        if (err == undefined) {
            res.json({
                message: `Successfully ran chaincode query '${req.body.chaincode_id}'.`,
                result: chaincodeResultToString(result)
            })
        } else {
            res.status(500).send(`Failed to query chaincode '${req.body.chaincode_id}'. Err: ${err}`);
        }
    })
})

app.post('/chaincode/invoke', function (req, res) {
    chainlib.invokeChaincode(req.body.chaincode_id, req.body.function, req.body.args, function (err, result) {
        if (err == undefined) {
            res.json({
                message: `Chaincode invoke successful on '${req.body.chaincode_id}'`,
                result: chaincodeResultToString(result)
            })
        } else {
            res.status(500).send(`Failed to query chaincode '${req.body.chaincode_id}'. Err: ${err}`);
        }
    })
})

app.post('/proposals/create', function (req, res) {
    chainlib.createProposal(req.body.chaincode_id, req.body.proposal, function (err, result) {
        if (err == undefined) {
            res.json({
                message: `Create proposal successful on '${req.body.chaincode_id}'`,
                result: chaincodeResultToString(result)
            })
        } else {
            res.status(500).send(`Failed to create proposal on '${req.body.chaincode_id}'. Err: ${err}`);
        }
    })
})

app.get('/proposals/list', function (req, res) {
    chainlib.listProposals(req.query.chaincode_id, function (err, result) {
        if (err == undefined) {
            res.json({
                message: `List proposals successful on '${req.body.chaincode_id}'`,
                result: JSON.parse(chaincodeResultToString(result))
            })
        } else {
            res.status(500).send(`Failed to list proposals on '${req.body.chaincode_id}'. Err: ${err}`);
        }
    })
})



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
