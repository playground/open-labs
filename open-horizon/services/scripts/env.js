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
            this.setAdditionalEnv();
            observer.next();
            observer.complete();
          } else {
            console.log('failed to identify arch', err);
            observer.error(err);
          }
        });  
      } else {
        this.setAdditionalEnv();
        console.log(envVars.ARCH)
        observer.next();
        observer.complete();
      }    
    });
  }
  static setAdditionalEnv() {
    pEnv.PATTERN_NAME = `pattern-${pEnv.SERVICE_NAME}-${pEnv.ARCH}`;
    pEnv.SERVICE_CONTAINER = `${pEnv.YOUR_DOCKERHUB_ID}/${pEnv.SERVICE_NAME}_${pEnv.ARCH}:${pEnv.SERVICE_VERSION}`.replace(/\r?\n|\r/g, '')
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
    return pEnv.SERVICE_NAME;
  }
  static getMyServiceVersion() {
    return pEnv.SERVICE_VERSION;
  }
  static getMMSSharedVolume() {
    return pEnv.MMS_SHARED_VOLUME;
  }
  static getVolumeMount() {
    return pEnv.VOLUME_MOUNT;
  }
  static getMyDockerHubId() {
    return pEnv.YOUR_DOCKERHUB_ID;
  }
  static getDockerImageBase() {
    return `${pEnv.YOUR_DOCKERHUB_ID}/${pEnv.SERVICE_NAME}`;
  }
  static getContainerCreds() {
    return pEnv.CONTAINER_CREDS;
  }
  static getPatterName() {
    return pEnv.PATTERN_NAME;
  }
  static getServiceContainer() {
    return pEnv.SERVICE_CONTAINER;
  }
  static getArch() {
    return pEnv.ARCH;
  }
}

module.exports.Env = Env;