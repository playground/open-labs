const { Observable } = require('rxjs');
const hznJson = require('../config/.env-hzn.json');
const cp = require('child_process'),
exec = cp.exec;

const env = process.env.npm_config_env || 'biz';
const envVars = hznJson[env]['envVars'];
let metaVars = hznJson[env]['metaVars'];
const pEnv = process.env;

class Env {
  static init() {
    return new Observable((observer) => {
      for(const [key, value] of Object.entries(envVars)) {
        process.env[key] = value.replace(/\r?\n|\r/g, '');
        console.log(`${key}: ${process.env[key]}`);
      }
      if(!envVars.ARCH || envVars.ARCH === undefined) {
        let arg = `hzn architecture`
        exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
          if(!err) {
            pEnv.ARCH = envVars.ARCH = stdout.replace(/\r?\n|\r/g, '');
            this.setMMSContainer();
            observer.next();
            observer.complete();
          } else {
            console.log('failed to identify arch', err);
            observer.error(err);
          }
        });  
      } else {
        this.setMMSContainer();
        console.log(envVars.ARCH)
        observer.next();
        observer.complete();
      }    
    });
  }
  static setMMSContainer() {
    let container = `${pEnv.YOUR_DOCKERHUB_ID}/${pEnv.MMS_SERVICE_NAME}_${pEnv.ARCH}:${pEnv.MMS_SERVICE_VERSION}`.replace(/\r?\n|\r/g, '')
    pEnv.MMS_CONTAINER = container;
  }
  static getEnv() {
    return env;
  }
  static getOrgId() {
    console.log(pEnv.HZN_ORG_ID)
    return pEnv.HZN_ORG_ID;
  }
  static getExchangeUserAuth() {
    return pEnv.HZN_EXCHANGE_USER_AUTH;
  }
  static getExchangeUrl() {
    return pEnv.HZN_EXCHANGE_URL;
  }
  static getFSSCSSUrl() {
    return pEnv.HZN_FSS_CSSURL;
  }
  static getMyServiceName() {
    return pEnv.YOUR_SERVICE_NAME;
  }
  static getMyServiceVersion() {
    return pEnv.YOUR_SERVICE_VERSION;
  }
  static getMMSSharedVolume() {
    return pEnv.MMS_SHARED_VOLUME;
  }
  static getMyDockerHubId() {
    return pEnv.YOUR_DOCKERHUB_ID;
  }
  static getDockerImageBase() {
    return `${pEnv.YOUR_DOCKERHUB_ID}/${pEnv.MMS_SERVICE_NAME}`;
  }
  static getMMSContainerCreds() {
    return pEnv.MMS_CONTAINER_CREDS;
  }
  static getMMSPatterName() {
    return pEnv.MMS_PATTERN_NAME;
  }
  static getMMSServiceName() {
    return pEnv.MMS_SERVICE_NAME;
  }
  static getMMSServiceVersion() {
    return pEnv.MMS_SERVICE_VERSION;
  }
  static getMMSContainer() {
    return pEnv.MMS_CONTAINER;
  }
  static getArch() {
    return pEnv.ARCH;
  }
  static getMMSObjectType() {
    return metaVars.MMS_OBJECT_TYPE;
  }
  static getMMSObjectId() {
    return metaVars.MMS_OBJECT_ID
  }
  static getMMSObjectFile() {
    return metaVars.MMS_OBJECT_FILE
  }
}

module.exports.Env = Env;