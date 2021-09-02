#! /usr/bin/env node
const { Observable } = require('rxjs');
const cp = require('child_process'),
exec = cp.exec;

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
  static shell(arg) {
    return new Observable((observer) => {
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
        if(!err) {
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

module.exports.Utils = Utils;