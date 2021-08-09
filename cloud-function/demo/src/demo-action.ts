import { forkJoin, Observable, of, from } from 'rxjs';
import { ApiParams } from '@common/params/api-params';
import { Messenger } from '@common/messenger';
import { util } from '@common/utility';
import { CosClient } from '@common/cos-client';
import { mkdirSync, readdir, readFileSync, stat, existsSync } from 'fs';
import path = require('path');
const multipart = require('parted').multipart;
import str2stream = require('string-to-stream');
const cp = require('child_process'),
exec = cp.exec;

let cosClient: CosClient;

export default function main(params: ApiParams) {
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
      resolve(response.error('something went wrong...', 400));
    }, () => {
      const response = new Messenger(params);
      resolve(response.send(result));
    });
  });
}

(<any>global).main = main;  // required when using webpack

let action = {
  exec: (params: ApiParams) => {
    const baseUrl = 'https://service.us.apiconnect.ibmcloud.com/gws/apigateway/api/646d429a9e5f06572b1056ccc9f5ba4de6f5c30159f10fcd1f1773f58d35579b/demo/';
    let path = params['__ow_headers']['x-forwarded-url'].replace(baseUrl, '').replace(/\//g, '_');
    console.log('$$$$$$', params['__ow_path'], path)
    params.days = params.days ? params.days : '1';
    if(!existsSync('/upload')) {
      mkdirSync('/upload');
    } 
    if(!params.date) {
      const date = util.formatMD(util.getDate());
      params.date = `${date.year}${date.month}${date.day}`;
    }
    return (action[path] || action[params.method] || action.default)(params);
  },
  demo_get: (params: ApiParams) => {
    return of({data: 'test demo get'});
  },
  demo_post: (params: ApiParams) => {
    return of({data: params.body});
  },
  demo_cos_list: (params: ApiParams) => {
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
  demo_cos_upload: (params: ApiParams)=> {
    return new Observable((observer) => {
      try {
        let decoded = Buffer.from( params['__ow_body'], 'base64' );
        // @ts-ignore
        const stream = str2stream(decoded);

        let parser = new multipart(
          params['__ow_headers'][ 'content-type' ], {
            limit: 30 * 1024,
            diskLimit: 30 * 1024 * 1024,
            path: '/upload'
          }
        );
        let parts = {};
        let $upload = [];

        parser.on('error', function( err ) {
          console.log( 'Whoops!', err );
        } );
    
        parser.on('part', function( field, part ) {
          parts[field] = part;
        } );

        parser.on('end', async function() {
          // console.log('$$$parts', parts);
          action.traverse(`/upload`, (err, files) => {
            if(err) {
                console.log('$$$error', err)
            }
            console.log('$$$file: ', files, parts)
            params.directory = parts['directory'];
            if(!params.directory) {
              observer.next('please speficfy a directory where you want the files to be uploaded in the bucket.');
              observer.complete();
            } else {
              let body: any;
              let filename = '';
              let splits = [];
              files.forEach((file) => {
                body = readFileSync(file);
                splits = file.split('.');
                filename = `${params.directory}/${file.replace(splits[splits.length-2] + '.', '').replace('/upload/', '')}`;
                $upload.push(action.upload(body, filename, params));
              });
              action.removeDir('/upload/*')
              .subscribe(() => {
                forkJoin($upload)
                .subscribe((uploads) => {
                  // do something as needed
                  splits = uploads;
                  console.log('$$$uploads ', uploads)
                }, (err) => {
                  observer.error(err);
                }, () => {
                  observer.next(`Upload successfully...${splits}`);
                  observer.complete();
                })
              });
            }
          })
        });
        stream.pipe( parser );
      } catch(err) {
        observer.next(`Upload failed. ${err}`);
        observer.complete();
      }  
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
  default: (params: ApiParams) => {
    return new Observable((observer) => {
      observer.next(`Method ${params.method} not found.`);
      observer.complete();
    });
  }
}