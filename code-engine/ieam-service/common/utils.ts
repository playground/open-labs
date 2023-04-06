import * as https from 'https';
import { Observable } from 'rxjs';

import { HznParams } from './params/hzn-params';

const cp = require('child_process'),
exec = cp.exec;

export class Utils {
  homePath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  mmsPath = '/mms-shared';
  localPath = './local-shared';
  assets = './assets';
  sharedPath = '';
  intervalMS = 10000;
  timer: NodeJS.Timer = null;
  timestamp = Date.now();
  logTime = Date.now();

  constructor() {
    this.init()
  }
  init() {
    console.log(`initializng...`) 
  }

  httpGet(url) {
    return new Observable((observer) => {
      https.get(url, (resp) => {
        let data = '';
      
        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
          data += chunk;
        });      
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
          observer.next(JSON.parse(data));
          observer.complete();
        });     
      }).on("error", (err) => {
        console.log("Error: " + err.message);
        observer.error(err);
      });
    });  
  }
  unregister(params: HznParams) {
    return this.shell(`oh deploy autoUnregister`)
  }
  registerWithPolicy(params: HznParams) {
    return this.shell(`oh deploy autoRegisterWithPolicy`)
  }
  registerWithPattern(params: HznParams) {
    return this.shell(`oh deploy autoRegisterWithPattern`)
  }
  updatePolicy(params: HznParams) {
    return this.shell(`oh deploy autoAddpolicy`)
  }
  shell(arg: string, success='command executed successfully', error='command failed', prnStdout=true, options={maxBuffer: 1024 * 2000}) {
    return new Observable((observer) => {
      console.log(arg);
      if(!prnStdout) {
        options = Object.assign(options, {stdio: 'pipe', encoding: 'utf8'})
      }
      exec(arg, options, (err: any, stdout: any, stderr: any) => {
        if(!err) {
          if(prnStdout) {
            console.log(stdout);
          }
          console.log(success);
          observer.next(stdout);
          observer.complete();
        } else {
          console.log(`${error}: ${err}`);
          observer.error(err);
        }
      })  
    });
  }
}