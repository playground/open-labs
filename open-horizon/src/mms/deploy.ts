#! /usr/bin/env node
import { Observable, forkJoin } from 'rxjs';
const cp = require('child_process'),
exec = cp.exec;
import { readFileSync, writeFileSync } from 'fs';
import { Env } from './env';
import { Utils } from '@common/utils';
const prompt = require('prompt');

const task = process.env.npm_config_task || 'test';
let objectType: any;
let objectId: any;
let objectFile: any;
let pattern: any;
const envVar = new Env();
const utils = new Utils();

let hzn = {
  setup: () => {
    return new Observable((observer) => {
      objectType = process.env.npm_config_type || envVar.getMMSObjectType();
      objectId = process.env.npm_config_id || envVar.getMMSObjectId();
      objectFile = process.env.npm_config_object || envVar.getMMSObjectFile();
      pattern = process.env.npm_config_pattern || envVar.getMMSPatterName();
      observer.complete();
    });  
  },
  test: () => {
    return new Observable((observer) => {
      console.log('it works...')
      observer.complete();
    });  
  },
  build: () => {
    return new Observable((observer) => {
      // let tag = `${envVar.getDockerImageBase()}_${envVar.getArch()}:${envVar.getMMSServiceVersion()}`;
      let arg = `docker build -t ${envVar.getMMSContainer()} -f Dockerfile.${envVar.getArch()} .`.replace(/\r?\n|\r/g, '');
      // arg = 'docker build -t playbox21/my-mms-service_amd64:1.0.0 -f Dockerfile.arm64 .' 
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err: any, stdout: any, stderr: any) => {
        if(!err) {
          console.log(stdout)
          console.log(`done building docker image`);
        } else {
          console.log('failed to build docker image', err);
        }
        observer.next();
        observer.complete();
      });
    })  
  },
  push: () => {
    return new Observable((observer) => {
      let arg = `docker push ${envVar.getMMSContainer()}`;
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err: any, stdout: any, stderr: any) => {
        if(!err) {
          console.log(stdout)
          console.log(`done publishing mms service`);
          observer.next();
          observer.complete();
        } else {
          console.log('failed to publish mms service', err);
          observer.error(err);
        }
      });
    })  
  },
  publishService: () => {
    return new Observable((observer) => {
      let arg = `hzn exchange service publish -O ${envVar.getMMSContainerCreds()} -f config/service.json`;
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err: any, stdout: any, stderr: any) => {
        if(!err) {
          console.log(stdout)
          console.log(`done publishing mms service`);
          observer.next();
          observer.complete();
        } else {
          console.log('failed to publish mms service', err);
          observer.error(err);
        }
      });
    })  
  },
  publishPattern: () => {
    return new Observable((observer) => {
      let arg = `hzn exchange pattern publish -f config/pattern.json`;
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err: any, stdout: any, stderr: any) => {
        if(!err) {
          console.log(stdout)
          console.log(`done publishing mss pattern`);
          observer.next();
          observer.complete();
        } else {
          console.log('failed to publish mms pattern', err);
          observer.error(err);
        }
      });
    })  
  },
  agentRun: () => {
    return new Observable((observer) => {
      let arg = `hzn register --policy config/policy.json --pattern "${pattern}"`;
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err: any, stdout: any, stderr: any) => {
        if(!err) {
          console.log(stdout)
          console.log(`done registering mss agent`);
          observer.next();
          observer.complete();
        } else {
          console.log('failed to register mms agent', err);
          observer.error(err);
        }
      });
    })  
  },
  publishObject: () => {
    return new Observable((observer) => {
      let arg = `hzn mms object publish --type=${objectType} --id=${objectId} --object=${objectFile} --pattern=${pattern}`
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err: any, stdout: any, stderr: any) => {
        if(!err) {
          console.log(stdout)
          console.log(`done publishing object`);
          observer.next();
          observer.complete();
        } else {
          console.log('failed to publish object', err);
          observer.error(err);
        }
      });
    })  
  },
  unregisterAgent: () => {
    return new Observable((observer) => {
      let arg = `hzn unregister -f`;
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err: any, stdout: any, stderr: any) => {
        if(!err) {
          console.log(stdout)
          console.log(`done unregistering mss agent`);
          observer.next();
          observer.complete();
        } else {
          console.log('failed to unregister mms agent', err);
          observer.error(err);
        }
      });
    })  
  },
  registerAgent: () => {
    return new Observable((observer) => {
      hzn.unregisterAgent().subscribe({
        complete: () => {
          hzn.build().subscribe({
            complete: () => {
              hzn.push().subscribe({
                complete: () => {
                  hzn.publishService().subscribe({
                    complete: () => {
                      hzn.publishPattern().subscribe({
                        complete: () => {
                          hzn.agentRun().subscribe({
                            complete: () => {
                              observer.next();
                              observer.complete();
                            }, error: (err) => {
                              observer.error(err);
                            }
                          })
                        }, error: (err) => {
                          observer.error(err);
                        }  
                      })
                    }, error: (err) => {
                      observer.error(err);
                    }
                  })
                }, error: (err) => {
                  observer.error(err);
                }
              })
            }, error: (err) => {
              observer.error(err);
            }    
          })
        }, error: (err) => {
          observer.error(err);
        }    
      })
    });
  },
  showHorizonInfo: () => {
    return new Observable((observer) => {
      const file = hzn.getHorizonInfo();
      console.log(file)
      observer.next(file);
      observer.complete();
    })  
  },
  getHorizonInfo: () => {
    return readFileSync('/etc/default/horizon').toString().split('\n');
  },
  updateHorizonInfo: () => {
    return new Observable((observer) => {
      let data = hzn.getHorizonInfo();
      let props: any[] = [];
      data.forEach((el, i) => {
        if(el.length > 0) {
          let prop = el.split('=');
          if(prop && prop.length > 0) {
            props[i] = {name: prop[0], default: prop[1], required: true};
          }  
        }
      });
      console.log('\nKey in new value or press Enter to keep current value: ')
      prompt.get(props, (err: any, result: any) => {
        console.log(result)

        console.log('\nWould like to update horizon: Y/n?')
        prompt.get({name: 'answer', required: true}, (err: any, question: any) => {
          if(question.answer === 'Y') {
            let content = '';
            for(const [key, value] of Object.entries(result)) {
              content += `${key}=${value}\n`; 
            }
            hzn.copyFile('sudo cp /etc/default/horizon /etc/default/.horizon').then(() => {
              writeFileSync('.horizon', content);
              hzn.copyFile(`sudo mv .horizon /etc/default/horizon`).then(() => {
                observer.next();
                observer.complete();  
              })
            })
          }
        })
      })
    })  
  },
  copyFile: (arg: string) => {
    return new Promise((resolve, reject) => {
      try {
        console.log(arg);
        exec(arg, {maxBuffer: 1024 * 2000}, (err: any, stdout: any, stderr: any) => {
          if(!err) {
            console.log(`done moving file`);
          } else {
            console.log('failed to move file', err);
          }
          resolve(stdout);
        });       
      } catch(e) {
        console.log(e)
        resolve(e);
      }
    });
  },
  listService: () => {
    return utils.listService();
  },
  listPattern: () => {
    return utils.listPattern();
  },
  listNode: () => {
    return utils.listNode();
  },
  listObject: () => {
    return utils.listObject();
  },
  listDeploymentPolicy: () => {
    return utils.listDeploymentPolicy();
  },
  checkConfigState: () => {
    return utils.checkConfigState();
  },
  listNodePattern: () => {
    return utils.listNodePattern();
  },
  getDeviceArch: () => {
    return utils.getDeviceArch();
  },
  createHznKey: () => {
    return utils.createHznKey();
  }
}

envVar.init()
.subscribe({
  next: () => {
    hzn.setup()
    .subscribe({
      complete: () => {
        // @ts-ignore
        console.log(task)
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
