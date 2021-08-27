#! /usr/bin/env node
const cp = require('child_process'),
exec = cp.exec;

// A simple Horizon sample edge service that shows how to use a Model Management System (MMS) file with your service.
// In this case we use a MMS file as a config file for this service that can be updated dynamically. The service has a default
// copy of the config file built into the docker image. Once the service starts up it periodically checks for a new version of
// the config file using the local MMS API (aka ESS) that the Horizon agent provides to services. If an updated config file is
// found, it is loaded into the service and the config parameters applied (in this case who to say hello to).

// Of course, MMS can also hold and deliver inference models, which can be used by services in a similar way.

let pEnv = process.env;

class Mms {
  // The type and name of the MMS file we are using
  objectType = `${pEnv.HZN_DEVICE_ID}.${pEnv.OBJECT_TYPE}`;
  objectId = pEnv.OBJECT_ID;
  // ${HZN_ESS_AUTH} is mounted to this container by the Horizon agent and is a json file with the credentials for authenticating to ESS.
  // ESS (Edge Sync Service) is a proxy to MMS that runs in the Horizon agent.
  essAuth;
  user;
  password;
  auth;
  // ${HZN_ESS_CERT} is mounted to this container by the Horizon agent and the cert clients use to verify the identity of ESS.
  cert = `--cacert ${pEnv.HZN_ESS_CERT}`;
  socket = `--unix-socket ${pEnv.HZN_ESS_API_ADDRESS}`;
  baseUrl = 'https://localhost/api/v1/objects';
  sharedVolume = pEnv.SHARED_VOLUME;
  tempFile = `.${pEnv.OBJECT_ID}`;
  essObjectList;
  essObjectGet;
  essObjectReceived;
  timer;
  timout = 5000;

  constructor() {
    this.essAuth = require(`.${pEnv.HZN_ESS_AUTH}`);
    this.user = this.essAuth.id;
    this.password = this.essAuth.token;
    this.auth = `-u ${this.user}:${this.password}`;

    this.essObjectList = `curl -sSL -u ${this.auth} ${this.cert} ${this.socker} ${this.baseUrl}/${this.objectType}`;
    this.essObjectGet = `curl -sSL -u ${this.auth} ${this.cert} ${this.socker} ${this.baseUrl}/${this.objectType}/${this.objectType}/data -o ${this.sharedVolume}/${this.tempFile}`;
    this.essObjectReceived = `curl -sSL -X PUT -u ${this.auth} ${this.cert} ${this.socker} ${this.baseUrl}/${this.objectType}/${this.objectType}/${this.objectId}/received`;
    this.monitor(this.timeout);
  }

  monitor(ms) {
    this.timer = setInterval(() => {
      this.process();
    }, ms)
  }

  resetTimer() {
    clearInterval(this.timer);
    this.monitor(this.timout);  
  }

  process() {
    clearInterval(this.timer);
    // See if there is a new version of the config.json file

    try {
      exec(this.essObjectList, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
        if(!err) {
          console.log(stdout)
          console.log(`done curling`);
          let config = JSON.parse(stdout);
          console.log(config[this.objectType]);
          if(!config.deleted) {
            exec(this.essObjectGet, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
              if(!err) {
                console.log('ESS object file copy was successful.');
                exec(this.essObjectReceived, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
                  if(!err) {
                    console.log('ESS object received command was successful.');
                  } else {
                    console.log("ERROR ", err);
                  }
                });      
              } else {
                console.log("ERROR ", err);
              }
            });
          }
        } else {
          console.log('ERROR ', err);
        }
      });
    } catch(e) {
      console.log(e);
    }
    this.resetTimer();
  }
}

new Mms();
