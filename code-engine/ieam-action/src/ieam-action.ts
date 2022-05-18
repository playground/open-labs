import * as http from 'http';
import { Observable, of, from } from 'rxjs';
import { CosClient } from '@common/cos-client';
import { Params } from '@common/params/params';
import { util } from './utility';
import { Stream } from 'stream';
import * as readline from 'readline';

declare const process: any;
declare const Buffer: any;
declare const console: any;
let cosClient: CosClient;

http.createServer(function (request: any, response: { writeHead: (arg0: number, arg1: { 'Content-Type': string; }) => void; end: (arg0: any) => void; }) {
  cosClient = new CosClient(process.env);
  const target = process.env.TARGET ? process.env.TARGET : 'World' ;
  const msg = process.env.MSG ? process.env.MSG : 'Hello ' + target + '\n';
  let result: any;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, HEAD',
    'Access-Control-Max-Age': 2592000, // 30 days
    // 'Access-Control-Allow-Credentials': true
    /** add other headers as per requirement */
  };
  return new Promise((resolve, reject) => {
    action.exec(request)
    .subscribe((data: any) => {
      result = data;
      // console.log('$data', result);
    }, (err: any) => {
      console.log(err);
      response.writeHead(400, headers);
      resolve(response.end(`something went wrong...${JSON.stringify(err)}\n`));
    }, () => {
      response.writeHead(200, headers);
      resolve(response.end(JSON.stringify(result) + '\n'));
    });
  });

  //  response.writeHead(200, {'Content-Type': 'application/json'});
  //  response.end(JSON.stringify(request.url + ' : ' + request.method + ' : ' + request.body) + '\n');
}).listen(8080);

let action: any = {
  params: (req: any) => {
    let q=req.url.split('?'),result: any={};
    if(q.length>=2){
      q[1].split('&').forEach((item: string)=>{
        try {
          result[item.split('=')[0]]=decodeURIComponent(item.split('=')[1]);
        } catch (e) {
          result[item.split('=')[0]]='';
        }
      })
    }
    if(!result.bucket) {
      result.bucket = process.env.bucket
    }
    return result;
  },
  exec: (request: any): any => {
    if(request.method === 'GET') {
      let params = action.params(request);
      return (action[params.action] || action.default)(params)
    } else if(request.method === 'POST') {
      return new Observable((observer: any) => {
        const { headers } = request;
        // console.log(headers['body'], body)
        if(headers['content-type'].indexOf('multipart/form-data') == 0) {
          // observer.next({body: body, headers: headers})
          // observer.complete()
          let body = '';
          request.on('error', (err: any) => {
            console.error(err);
          }).on('data', (chunk: any) => {
            body += chunk;
          }).on('end', () => {
            // let params = {body: Buffer.concat(body).toString()};
            let params = {body: body};
            // console.log(params)
            (action['upload'] || action.default)(params)
            .subscribe({
              next: (res: any) => {
                observer.next(res)
                observer.complete()
              }, error: (err: any) => observer.error(err)
            })
          });
        } else {
          let body = '';
          request.on('data', (chunk: any) => {
            body += chunk;
          })
          request.on('end', () => {
            let params = JSON.parse(body);
            (action[params.action] || action.default)(params)
            .subscribe({
              next: (res: any) => {
                observer.next(res)
                observer.complete()
              }, error: (err: any) => observer.error(err)
            })
          })  
        }
      })
      // return of({action: request.path, body: request['Content-Type'], url: request.url})        
      // return (action[request.method] || action.default)(request)
    } else {
      return of({msg: 'nothing to do'})        
    }
  },
  hello: (params: Params) => {
    return of('hello')
  },
  get_signed_url: (params: Params) => {
    return new Observable((observer: any) => {
      cosClient.getSignedUrl(params)
      .subscribe({
        error: (err: any) => observer.error(err),
        next: (res: any) => {
          observer.next(res);
          observer.complete();
        }
      })
    });
  },
  put_bucket_cors: (params: Params) => {
    return new Observable((observer: any) => {
      cosClient.putBucketCors(params)
      .subscribe({
        error: (err: any) => observer.error(err),
        next: (res: any) => {
          observer.next(res);
          observer.complete();
        }
      })
    });
  },
  list: (params: Params) => {
    return new Observable((observer: any) => {
      let result: any;
      console.log('bucket: ', params.bucket)
      cosClient.ls(params.bucket, params.directory ? params.directory : '', params.delimiter ? params.delimiter : null)
      .subscribe((data: any) => {
        result = data;
      }, (err: any) => {
        console.log(err);
        observer.next({});
        observer.complete();
      }, () => {
        const directories = result.CommonPrefixes.map((p: any) => {
          return p.Prefix;
        });
        const files = result.Contents.map((f: any) => {
          return {key: f.Key, date: f.LastModified, size: f.Size};
        });
        observer.next({directories: directories, files: files});
        observer.complete();
      });
    });
  },
  list_files: (params: Params) => {
    return new Observable((observer: any) => {
      let dirFiles: any;
      cosClient.ls(params.bucket, params.directory ? params.directory : '', params.delimiter ? params.delimiter : null)
      .subscribe((data: any) => {
        dirFiles = data;
        //console.log(dirFiles)
      }, (error: any) => {
        console.log('list error', error);
        observer.error(error);
      }, () => {
        let files:any = [];
        if(dirFiles && dirFiles.Contents) {
          dirFiles.Contents.map((file: any) => {
            let key = file.Key;
            files.push(key);
          });
        }
        observer.next(files);
        observer.complete();
      });
    });
  },
  mkdir: (params: Params) => {
    return cosClient.mkdir(params)
  },
  upload2: (params: Params) => {
    return of({upload: 'reload'})
  },
  upload: (params: Params) => {
    return new Observable((observer: any) => {
      console.log('$$$stream')
      const stream = new Stream.PassThrough();
      console.log('$$$stream through')
      const buffer = Buffer.from(params['body'], 'utf-8');
      // const buffer = params.body;
      console.log('$$$stream buffer')
      stream.end(buffer);

      console.log('$$$before interface')
      let rl = readline.createInterface({
        input: stream,
      });
      console.log('$$$after interface')
      let length = buffer.byteLength;
      let file = {data: '', reading: false}
      let config = {data: '', reading: false}
      rl.on('line', function (line, lineCount, byteCount) {
        console.log('reading', line)
        if(line.indexOf('------WebKitFormBoundary') === 0) {
          file.reading = false;
          config.reading = false;
        } else if(file.reading) {
          if(line.trim().length > 0) {
            file.data += line;
          }
        } else if(config.reading) {
          if(line.length > 0) {
            config.data += line;
          }
        } else if(line.indexOf('Content-Disposition:') === 0 && line.match(/name="file"/)) {
          file.reading = true;
          config.reading = false;
        } else if(line.indexOf('Content-Disposition:') === 0 && line.match(/name="config"/)) {
          config.reading = true;
          file.reading = false;
        }
      })
      .on('close', () => {
        try {
          let data = JSON.parse(config.data);
          let fields = ['bucket', 'filename', 'acl'];
          fields.forEach((field) => {
            if(data[field]) {
              console.log('field', field, data[field])
              params[field] = data[field];
            }
          });
          let matches: any = file.data.match(/^data:([A-Za-z-+\/.]+);base64,(.+)$/);
          console.log('matches', matches)
          if (!matches && matches.length !== 3) {
            observer.next({result: 'Invalid file format'});
            observer.complete();
          }
          params.body = Buffer.from(matches[2], 'base64');
          params.contentType = matches[1];

          cosClient.upload(params)
          .subscribe((res: any) => {
            observer.next(res);
            observer.complete();
          });
        } catch(e) {
          observer.next({result: `catch: ${e}`});
          observer.complete();
        }
      })
    });
  },
  session: (params: Params) => {
    return new Observable((observer: any) => {
      const sessionId = util.encryptAES()
      const seed = util.decryptAES(sessionId)
      console.log(sessionId, seed)
      observer.next(sessionId);
      observer.complete();
    });
  },
  signature: (params: Params) => {
    return util.signature(params)
  },
  validate_session: (params: Params) => {
    return of({valid: util.validateSession(params.sessionId)})
  },
  error: (msg: string) => {
    return new Observable((observer: any) => {
      observer.next(msg);
      observer.complete();
    });
  },
  default: (params: Params) => {
    return new Observable((observer: any) => {
      observer.next(`Method ${params.method} not found.`);
      observer.complete();
    });
  }
}

console.log('Server running at http://0.0.0.0:8080/');