#! /usr/bin/env node
const { Observable } = require('rxjs');

const env = process.env.npm_config_env || 'biz';

class Utils {
  static init() {
  }
  static listService(service) {
    return this.shell(`hzn exchange service list` + service ? ` ${service}` : '');
  }
  static listPattern(pattern) {
    return this.shell(`hzn exchange pattern list` + patterrn ? ` ${pattern}` : '');
  }
  shell(arg) {
    return new Observable((observer) => {
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
        if(!err) {
          pEnv.ARCH = envVars.ARCH = stdout.replace(/\r?\n|\r/g, '');
          observer.next(stdout);
          observer.complete();
        } else {
          console.log(`shell command failed: ${err}`);
          observer.error(err);
        }
      });  
    });

  }
}

const _Utils = Utils;
export { _Utils as Utils };