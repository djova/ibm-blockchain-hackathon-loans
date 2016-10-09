const hfc = require('hfc');
const util = require('util');
const fs = require('fs');
const https = require('https');
const config = require('../config/settings.json')
const serviceCredentials = JSON.parse(fs.readFileSync(config.serviceCredentialsFile, 'utf8'))

module.exports.deployChaincode = deployChaincode
module.exports.queryChaincode = queryChaincode
module.exports.initChain = initChain

process.env['GRPC_SSL_CIPHER_SUITES'] = 'ECDHE-RSA-AES128-GCM-SHA256:' +
    'ECDHE-RSA-AES128-SHA256:' +
    'ECDHE-RSA-AES256-SHA384:' +
    'ECDHE-RSA-AES256-GCM-SHA384:' +
    'ECDHE-ECDSA-AES128-GCM-SHA256:' +
    'ECDHE-ECDSA-AES128-SHA256:' +
    'ECDHE-ECDSA-AES256-SHA384:' +
    'ECDHE-ECDSA-AES256-GCM-SHA384';


function createAndConnectChain() {
    console.log("Initializing chain")
    //var chain = hfc.newChain("targetChain");
    console.log(`Loading service credentials from ${config.serviceCredentialsFile}`)
    console.log("Loaded service credentials")

    var ca_id = Object.keys(serviceCredentials.ca)[0]
    var memberServicesUrl = `grpcs://${serviceCredentials.ca[ca_id].url}`
    var keystore = `${config.hfcKeystoreDir}/keyValStore-${ca_id}`

    var chain = hfc.newChain("targetChain");

    console.log(`Setting HFC keystore: ${keystore}`)
    chain.setKeyValStore(hfc.newFileKeyValStore(keystore));
    chain.setDeployWaitTime(config.chainDeployWaitTime)

    var pem = fs.readFileSync(config.localChainCertificatePath)

    console.log(`Setting member services url: ${memberServicesUrl}`)
    chain.setMemberServicesUrl(memberServicesUrl, {
        pem: pem
    })

    console.log(`Adding ${serviceCredentials.peers.length} peers`)
    serviceCredentials.peers.forEach(function (peer) {
        // console.log(`Added peer ${peer.id}`)
        chain.addPeer(`grpcs://${peer.discovery_host}:${peer.discovery_port}`, {
            pem: pem
        })
    })

    return chain
}

var state = {}

function successfulChainInit(chain, contractUser) {
    console.log("Chain successfully initialized.")
    state['chain'] = chain
    state['contractUser'] = contractUser
}

/**
 * Initializes the chain using the local configuration and enrolls the admin user
 * https://github.com/hyperledger/fabric/tree/master/sdk/node#terminology
 */
function initChain(callback) {
    var chain = createAndConnectChain()
    var adminUser = serviceCredentials.users.find(user => user.enrollId == config.userEnrollIdToUseForAdmin)
    var contractUser = serviceCredentials.users.find(user => user.enrollId == config.userEnrollIdToUseForContracts)

    if (adminUser === undefined) {
        callback(`ERROR: Couldn't find admin user '${config.userEnrollIdToUseForAdmin}' in ${config.serviceCredentialsFile}`)
    }
    if (contractUser === undefined) {
        callback(`ERROR: Couldn't find contract user '${config.userEnrollIdToUseForContracts}' in ${config.serviceCredentialsFile}`)
    }

    console.log(`Enrolling admin user: ${adminUser.enrollId}`)
    chain.enroll(adminUser.enrollId, adminUser.enrollSecret, function(err, user1) {
        if (err) {
            callback(`ERROR: failed to enroll admin user: ${err}`)
        } else {
            console.log(`Successfully enrolled admin user ${adminUser.enrollId}`)
            chain.setRegistrar(user1)
            chain.enroll(contractUser.enrollId, contractUser.enrollSecret, function(err, user2) {
                if (err) {
                    callback(`ERROR: failed to enroll contract user: ${err}`)
                } else {
                    console.log(`Successfully enrolled contract user ${contractUser.enrollId}`)
                    successfulChainInit(chain, user2)
                    callback(undefined)
                }
            })
        }
    })
}

function deploySpecificChaincode(chaincode_name, args, callback) {
    var deployRequest = {
        fcn: "init",
        args: args,
        certificatePath: config.remoteChainCertificatePath,
        chaincodePath: `github.com/djova/loaning-chain/chaincode/${chaincode_name}`
    };

    console.log(`Initiating deploy request: ${JSON.stringify(deployRequest)}`)

    var deployTx = state.contractUser.deploy(deployRequest);

    deployTx.on('complete', function(results) {
        console.log(`Successfully deployed chaincode '${chaincode_name}'. Resulting ID: ${results.chaincodeID}`)
        console.log(`Full response: ${JSON.stringify(results)}`)
        callback(undefined, results.chaincodeID)
    });

    deployTx.on('error', function(err) {
        callback(`Failed to deploy chaincode: ${err}`)
    });
}

function deployChaincode(chaincode_name, callback) {
    switch (chaincode_name) {
        case "hello_chaincode":
            deploySpecificChaincode(chaincode_name, ['yayaya'], callback)
            break;
        default:
            callback(`Invalid chaincode: ${chaincode_name}`)
    }
}

function queryChaincode(chaincode_id, func, args, callback) {
    console.log(`Querying chaincode '${chaincode_id}, function '${func}', args '${args}'`)
    var queryRequest = {
        chaincodeID: chaincode_id,
        fcn: func,
        args: args
    };

    // Trigger the query transaction
    var queryTx = state.contractUser.query(queryRequest);

    // Print the query results
    queryTx.on('complete', function(results) {
        console.log(`Successful chaincode query: ${JSON.stringify(results)}`)
        callback(undefined, results)
    });

    queryTx.on('error', function(err) {
        console.log(`Failed to query chaincode: ${JSON.stringify(err)}`)
        callback(`Failed to query chaincode: ${JSON.stringify(err)}`)
    });
}

