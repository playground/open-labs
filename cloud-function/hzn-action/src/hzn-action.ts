import { Observable, of, from } from 'rxjs';
import { HznParams } from '@common/params/hzn-params';
import { Messenger } from '@common/messenger';
import { util } from '@common/utility';
import { CosClient } from '@common/cos-client';
import { mkdirSync, readdir, readFileSync, writeFileSync, stat, existsSync } from 'fs';
import path = require('path');
import  * as https from 'https';
import { maxHeaderSize } from 'http';
const cp = require('child_process'),
exec = cp.exec;

let cosClient: CosClient;

export default function main(params: HznParams) {
  cosClient = new CosClient(params);
  let result: any;
  return new Promise((resolve, reject) => {
    action.exec(params)
    .subscribe((data) => {
      result = data;
      console.log('$data', result);
    }, (err) => {
      console.log(err);
      const response = new Messenger(params);
      resolve(response.error(`something went wrong...${err}`, 400));
    }, () => {
      const response = new Messenger(params);
      resolve(response.send(result));
    });
  });
}

(<any>global).main = main;  // required when using webpack

let action = {
  exec: (params: HznParams) => {
    const baseUrl = 'https://service.us.apiconnect.ibmcloud.com/gws/apigateway/api/646d429a9e5f06572b1056ccc9f5ba4de6f5c30159f10fcd1f1773f58d35579b/hzn/';
    let path = params['__ow_headers'] ? params['__ow_headers']['x-forwarded-url'].replace(baseUrl, '').replace(/\//g, '_').replace(/\?.+/, '') : null;
    // let path = params['__ow_headers']['x-forwarded-url'].replace(baseUrl, '').replace(/\//g, '_');
    console.log('$$$$$$', params['__ow_path'], path, params.filename)
    if(!existsSync('/upload')) {
      mkdirSync('/upload');
    } 
    if(params.value && !params.func) {
      params = Object.assign(params, params.value);
    }

    return (action[path] || action[params.func] || action[params.body.func] || action.default)(params);
  },
  hzn_get: (params: HznParams) => {
    return of({data: 'test hzn get'});
  },
  hzn_post: (params: HznParams) => {
    return of({data: params.body});
  },
  hzn_mms: (params: HznParams) => {
    return new Observable((observer) => {
      cosClient.getSignedUrl(params)
      .subscribe((res) => {
        observer.next(res);
        observer.complete();
      })
    });
  },
  hzn_obj_url: (params: HznParams) => {
    return new Observable((observer) => {
      cosClient.getSignedUrl(params)
      .subscribe({
        error: (err) => observer.error(err),
        next: (res) => {
          observer.next(res);
          observer.complete();
        }
      })
    });
  },
  hzn_mms_url: (params: HznParams) => {
    return new Observable((observer) => {
      action.hzn_obj_url(params)
      .subscribe({
        next: (res: HznParams) => {
          let config = {
            hello: 'MMS delivery',
            url: res.url
          }
          let filename = params.filename || 'config.json'
          writeFileSync(filename, JSON.stringify(config));
          let arg = `/usr/bin/hzn mms object publish --type=${params.type} --id=${params.id} --object=${filename} --pattern=${params.pattern}`;
          exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
            if(!err) {
              console.log(`${arg}`);
              observer.next();
              observer.complete();
            } else {
              console.log(`failed mms publish...${err}`);
              observer.error(err);
            }
          });    
        },
        error: (err) => observer.error(err)
      })
    });  
  },
  hzn_mms_file: (params: HznParams) => {
    return new Observable((observer) => {
      let filename = params.filename;
      let url = `https://${params.bucket}/${params.directory}/${filename}`;
      https.get(url, (resp) => {
        resp.setEncoding('binary');
        let chunks = [];
        resp.on('data', (chunk) => {
          chunks.push(Buffer.from(chunk, 'binary'));
        });
        resp.on('error', (err) => {
          observer.next(`${filename} download failed...`);
          observer.complete();
        });
        resp.on('end', () => {
          let binary = Buffer.concat(chunks);
          writeFileSync(filename, binary);
          let arg = `hzn mms object publish --type=${params.type} --id=${filename} --object=${filename} --pattern=${params.pattern}`;
          exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
            if(!err) {
              console.log(`mms published...${arg}`);
              observer.next();
              observer.complete();
            } else {
              console.log(`failed mms...${err}`);
              observer.next();
              observer.complete();
            }
          });
        });
      });
    });
  },
  demo_post: (params: HznParams) => {
    return of({data: params.body});
  },
  hzn_list: (params: HznParams) => {
    let body = params.body;
    return new Observable((observer) => {
      let dirFiles;
      cosClient.ls(params.bucket, body.directory)
        .subscribe((data) => {
          dirFiles = data;
          //console.log(dirFiles)
        }, (error) => {
          console.log('list error', error);
          observer.next(error);
          observer.complete();
        }, () => {
          let files = [];
          if(dirFiles && dirFiles.Contents) {
            dirFiles.Contents.map((file) => {
              let key = file.Key;
              files.push(key);
            });
          }
          observer.next(files);
          observer.complete();
        });
    });
  },
  traverse: (dir, done) => {
    var results = [];
    readdir(dir, (err, list) => {
      if (err) return done(err);
      var i = 0;
      (function next() {
        var file = list[i++];
        if (!file) return done(null, results);
        file = path.resolve(dir, file);
        stat(file, (err, stat) => {
          if (stat && stat.isDirectory()) {
            action.traverse(file, (err, res) => {
              results = results.concat(res);
              next();
            });
          } else {
            results.push(file);
            next();
          }
        });
      })();
    });
  },
  removeDir: (dir: string) => {
    return new Observable((observer) => {
      let arg = `rm -rf ${dir}`;
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
        if(!err) {
          console.log(`${dir} removed...`);
          observer.next();
          observer.complete();
        } else {
          console.log(`failed to remove...${err}`);
          observer.next();
          observer.complete();
        }
      });
    });    
  },
  upload: (body, f, params) => {
    return new Observable((observer) => {
      params.body = body;
      params.filename = f;

      cosClient.upload(params)
        .subscribe(() => {
          // console.log('uploading...');
        }, (err) => {
          console.log(err);
          observer.next(`${f} upload failed...`);
          observer.complete();
        }, () => {
          // console.log('upload completed...');
          observer.next(`${f} uploaded...`);
          observer.complete();
        });
      });
  }, 
  error: (msg) => {
    return new Observable((observer) => {
      observer.next(msg);
      observer.complete();
    });
  },
  default: (params: HznParams) => {
    return new Observable((observer) => {
      observer.next(`Method ${params.method} not found.`);
      observer.complete();
    });
  }
}