const index = require('./app/index')
const config = require('./config/settings.json')
const blockchaintest = require('./app/blockchaintest.js')

console.log(`Starting blockchain test`)
blockchaintest.initChain()
