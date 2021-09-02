#! /usr/bin/env node
const { Observable, forkJoin } = require('rxjs');
const cp = require('child_process'),
exec = cp.exec;
const { readFileSync, writeFileSync } = require('fs');
const { Env } = require('./env') ;
const { Utils } require('../../common/utils');
const prompt = require('prompt');

const task = process.env.npm_config_task || 'build';
let objectType;
let objectId;
let objectFile;

let hzn = {
  setup: () => {
    return new Observable((observer) => {
      objectType = process.env.npm_config_type || Env.getMMSObjectType();
      objectId = process.env.npm_config_id || Env.getMMSObjectId();
      objectFile = process.env.npm_config_object || Env.getMMSObjectFile();
      pattern = process.env.npm_config_pattern || Env.getMMSPatterName();
      observer.complete();
    });  
  },
  exportHzn: () => {
    return new Observable((observer) => {
      // hznJson = require('../config/hzn.json');
      // let json = {};
      // let recurse = (obj) => {
      //   for(const [key, value] of Object.entries(obj)) {
      //     if(value != undefined) {
      //       if(value && typeof value === 'object') {
      //         recurse(value);
      //       } else {
      //         json[key] = value;
      //       }
      //     }
      //   }  
      // }
      // recurse(hznJson);
      // for(const [key, value] of Object.entries(json)) {
      //   process.env[key] = value;
      //   console.log(`${key}: ${process.env[key]}`);
      // }
      console.log(Env.getDockerImageBase())
      console.log(process.env.HZN_ORG_ID)
      if(!Env.getArch() || Env.getArch() === undefined) {
        let arg = `echo $HZN_ORG_ID $MMS_SERVICE_NAME $ARCH $MMS_SERVICE_NAME $MMS_SERVICE_VERSION $YOUR_SERVICE_NAME $YOUR_SERVICE_VERSION $MMS_CONTAINER $MMS_SHARED_VOLUME`
        exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
          if(!err) {
            console.log(stdout)
            console.log(`done echoing hzn envs`);
          } else {
            console.log('failed to echo hzn envs', err);
          }
          observer.next();
          observer.complete();
        });  
      } else {
        observer.next();
        observer.complete();
      }
    })  
  },
  build: () => {
    return new Observable((observer) => {
      // let tag = `${Env.getDockerImageBase()}_${Env.getArch()}:${Env.getMMSServiceVersion()}`;
      let arg = `docker build -t ${Env.getMMSContainer()} -f Dockerfile.${Env.getArch()} .`.replace(/\r?\n|\r/g, '');
      // arg = 'docker build -t playbox21/my-mms-service_amd64:1.0.0 -f Dockerfile.arm64 .' 
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
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
      let arg = `docker push ${Env.getMMSContainer()}`;
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
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
      let arg = `hzn exchange service publish -O ${Env.getMMSContainerCreds()} -f config/service.json`;
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
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
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
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
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
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
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
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
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
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
      let props = [];
      data.forEach((el, i) => {
        if(el.length > 0) {
          let prop = el.split('=');
          if(prop && prop.length > 0) {
            props[i] = {name: prop[0], default: prop[1], required: true};
          }  
        }
      });
      console.log('\nKey in new value or press Enter to keep current value: ')
      prompt.get(props, (err, result) => {
        console.log(result)

        console.log('\nWould like to update horizon: Y/n?')
        prompt.get({name: 'answer', required: true}, (err, question) => {
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
  copyFile: (arg) => {
    return new Promise((resolve, reject) => {
      try {
        console.log(arg);
        exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
          if(!err) {
            console.log(`done moving file`);
          } else {
            console.log('failed to move file', err);
          }
          resolve();
        });       
      } catch(e) {
        console.log(e)
        resolve();
      }
    });
  },
  listService: () => {
    let service = process.env.npm_config_service || '';
    return Utils.listService(service);
  },
  listPattern: () => {
    let pattern = process.env.npm_config_pattern || '';
    return Utils.listService(pattern);
  }
}

Env.init()
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
