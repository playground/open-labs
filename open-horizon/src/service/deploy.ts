#! /usr/bin/env node
import { Observable, forkJoin } from 'rxjs';
const cp = require('child_process'),
exec = cp.exec;
import { readFileSync, writeFileSync } from 'fs';
import { Env } from './env';
const prompt = require('prompt');

const task = process.env.npm_config_task || 'test';
const envVar = new Env();
let serviceJson: any;
let patternJson: any;
let policyJson: any;

let hzn = {
  setup: () => {
    return new Observable((observer) => {
      patternJson = process.env.npm_config_patternjson || 'config/service/pattern.json';
      serviceJson = process.env.npm_config_servicejson || 'config/service/service.json';
      policyJson = process.env.npm_config_policyjson || 'config/service/policy.json';
      observer.complete();
    });  
  },
  test: () => {
    return new Observable((observer) => {
      console.log('it works...')
      observer.complete();
    });  
  },
  publishService: () => {
    return new Observable((observer) => {
      let arg = `hzn exchange service publish -O ${envVar.getContainerCreds()} -f ${serviceJson} --pull-image`;
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
        if(!err) {
          console.log(stdout)
          console.log(`done publishing ${envVar.getMyServiceName()} service`);
          observer.next();
          observer.complete();
        } else {
          console.log('failed to publish service', err);
          observer.error(err);
        }
      });
    })  
  },
  publishPattern: () => {
    return new Observable((observer) => {
      let arg = `hzn exchange pattern publish -f ${patternJson}`;
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
        if(!err) {
          console.log(stdout)
          console.log(`done publishing ${envVar.getPatterName()} pattern`);
          observer.next();
          observer.complete();
        } else {
          console.log('failed to publish mms pattern', err);
          observer.error(err);
        }
      });
    })  
  }
}

envVar.init()
.subscribe({
  next: () => {
    hzn.setup()
    .subscribe({
      complete: () => {
        hzn[task]()
        .subscribe(() => {
          console.log('process completed.');
          process.exit(0)
        })  
      }, error: (err) => {
        console.log('something went wrong. ', err);
      }
    })
  }, error: (err) => {
    console.log('something went wrong. ', err);
  }  
})
