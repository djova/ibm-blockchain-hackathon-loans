const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const multer = require('multer')
const config = require('./config/settings.json')
const blockchaintest = require('./app/blockchaintest.js')
const app = express()

console.log(`Starting blockchain test server`)

// middleware
app.use(morgan('combined'))
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


// routes

app.post('/chaincode/deploy', function (req, res) {
    console.log(`Deploying chaincode: ${req.body.chaincode_name}`)
    res.send(`Successfully deployed chaincode: ${req.body.chaincode_name}`);
});


// only start the server if the blockchain initialized properly
blockchaintest.initChain(function(err) {
    if (err === undefined) {
        app.listen(config.serverListenPort, function () {
            console.log(`Example app listening on port ${config.serverListenPort}!`);
        });
    } else {
        console.log(`Failed to initialize blockchain: ${err}. Server can't start.`)
    }
})

