const express = require('express')
const morgan = require('morgan')
const config = require('./config/settings.json')
const blockchaintest = require('./app/blockchaintest.js')
const app = express()

console.log(`Starting blockchain test server`)

const chain = blockchaintest.initChain()

app.use(morgan('combined'))

app.get('/hello', function (req, res) {
    res.send('GET /hello request to the homepage');
});

// POST method route
app.post('/', function (req, res) {
    res.send('POST request to the homepage');
});

app.listen(config.serverListenPort, function () {
    console.log(`Example app listening on port ${config.serverListenPort}!`);
});


