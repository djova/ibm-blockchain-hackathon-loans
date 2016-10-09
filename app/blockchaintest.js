const hfc = require('hfc');
const util = require('util');
const fs = require('fs');
const https = require('https');
const config = require('../config/settings.json')

process.env['GRPC_SSL_CIPHER_SUITES'] = 'ECDHE-RSA-AES128-GCM-SHA256:' +
    'ECDHE-RSA-AES128-SHA256:' +
    'ECDHE-RSA-AES256-SHA384:' +
    'ECDHE-RSA-AES256-GCM-SHA384:' +
    'ECDHE-ECDSA-AES128-GCM-SHA256:' +
    'ECDHE-ECDSA-AES128-SHA256:' +
    'ECDHE-ECDSA-AES256-SHA384:' +
    'ECDHE-ECDSA-AES256-GCM-SHA384';


module.exports.initChain = function() {
    console.log("Initializing chain")
    //var chain = hfc.newChain("targetChain");
    console.log(`Loading service credentials from ${config.serviceCredentialsFile}`)
    var servCreds = JSON.parse(fs.readFileSync(config.serviceCredentialsFile, 'utf8'))
    console.log("Loaded service credentials")

    var ca_id = Object.keys(servCreds.ca)[0]
    var memberServicesUrl = `grpcs://${servCreds.ca[ca_id].url}`
    var keystore = `${config.hfcKeystoreDir}/keyValStore-${ca_id}`

    var chain = hfc.newChain("targetChain");

    console.log(`Setting HFC keystore: ${keystore}`)
    chain.setKeyValStore(hfc.newFileKeyValStore(keystore));

    var pem = fs.readFileSync(config.certPath)

    console.log(`Setting member services url: ${memberServicesUrl}`)
    chain.setMemberServicesUrl(memberServicesUrl, {
        pem: pem
    })

    console.log(`Adding ${servCreds.peers.length} peers`)
    servCreds.peers.forEach(function (peer) {
        console.log(`Added peer ${peer.id}`)
        chain.addPeer(`grpcs://${peer.discovery_host}:${peer.discovery_port}`, {
            pem: pem
        })
    })

    chain.enroll("WebAppAdmin", "375d12930a", function(err, webAppAdmin) {
        if (err) {
            console.log("ERROR: failed to enroll client: %s",err)
        } else {
            // Successfully enrolled WebAppAdmin during initialization.
            // Set this user as the chain's registrar which is authorized to register other users.
            chain.setRegistrar(webAppAdmin)
            // Now begin listening for web app requests
            console.log("Registered admin")
        }
    })
}

function initChain2(keyStore, memberServiceUr) {
    var chain = hfc.newChain("targetChain");
    chain.setKeyValStore(hfc.newFileKeyValStore('/tmp/keyValStore') );
    chain.setMemberServicesUrl("grpc://MEMBERSRVC_ADDRESS");
    chain.addPeer("grpc://PEER_ADDRESS");
    chain.enroll("WebAppAdmin", "DJY27pEnl16d", function(err, webAppAdmin) {
        if (err) return console.log("ERROR: failed to register %s: %s",err);
        // Successfully enrolled WebAppAdmin during initialization.
        // Set this user as the chain's registrar which is authorized to register other users.
        chain.setRegistrar(webAppAdmin);
        // Now begin listening for web app requests
        listenForUserRequests();
    });
}
