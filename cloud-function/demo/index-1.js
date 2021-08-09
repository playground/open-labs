"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const messenger_1 = require("./js/messenger");
const utility_1 = require("./js/utility");
const cos_client_1 = require("./js/cos-client");
const fs_1 = require("fs");
const path = require('path');
const multipart = require('parted').multipart;
const str2stream = require('string-to-stream');
let cosClient;
function main(params) {
    cosClient = new cos_client_1.CosClient(params);
    let result;
    return new Promise((resolve, reject) => {
        action.exec(params)
            .subscribe((data) => {
            result = data;
            console.log('$data', result);
        }, (err) => {
            console.log(err);
            const response = new messenger_1.Messenger(params);
            resolve(response.error('something went wrong...', 400));
        }, () => {
            const response = new messenger_1.Messenger(params);
            resolve(response.send(result));
        });
    });
}
exports.main = main;
global.main = main; // required when using webpack
let action = {
    exec: (params) => {
        const baseUrl = 'https://service.us.apiconnect.ibmcloud.com/gws/apigateway/api/646d429a9e5f06572b1056ccc9f5ba4de6f5c30159f10fcd1f1773f58d35579b/demo/';
        let path = params['__ow_headers']['x-forwarded-url'].replace(baseUrl, '').replace(/\//g, '_');
        console.log('$$$$$$', params['__ow_path'], path);
        params.days = params.days ? params.days : '1';
        fs_1.mkdirSync('/upload');
        if (!params.date) {
            const date = utility_1.util.formatMD(utility_1.util.getDate());
            params.date = `${date.year}${date.month}${date.day}`;
        }
        return (action[path] || action[params.method] || action.default)(params);
    },
    demo_get: (params) => {
        return rxjs_1.of({ data: 'test demo get' });
    },
    demo_post: (params) => {
        return rxjs_1.of({ data: params.body });
    },
    demo_cos_list: (params) => {
        let body = params.body;
        return new rxjs_1.Observable((observer) => {
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
                if (dirFiles && dirFiles.Contents) {
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
        fs_1.readdir(dir, (err, list) => {
          if (err) return done(err);
          var i = 0;
          (function next() {
            var file = list[i++];
            if (!file) return done(null, results);
            console.log('$$$file ', file)
            file = path.resolve(dir, file);
            console.log('$$$file2 ', file)
            fs_1.stat(file, (err, stat) => {
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
    demo_cos_upload: (params) => {
        return new rxjs_1.Observable((observer) => {
            try {
                // console.log(params);
                let decoded = Buffer.from(params['__ow_body'], 'base64');
                const stream = str2stream(decoded);
                console.log('$$$path', __dirname + '/upload')
                let parser = new multipart(params['__ow_headers']['content-type'], {
                    limit: 30 * 1024,
                    diskLimit: 30 * 1024 * 1024,
                    path: '/upload',
                    multiple: true
                });
                let parts = {};
                parser.on('error', function (err) {
                    console.log('Whoops!', err);
                });
                parser.on('part', function (field, part) {
                    parts[field] = part;
                });
                parser.on('end', async function () {
                    console.log('$$$parts', parts);
                    console.log('$$$parts', parts.file);
                    action.traverse(`/upload`, (err, files) => {
                        if(err) {
                            console.log('$$$error', err)
                        }
                        console.log('$$$file: ', files)

                        let obj = fs_1.readFileSync( parts['file'] );
                        console.log('$$$parts', obj);
                        observer.next('Upload successfully.');
                        observer.complete();
                    })
                });
                stream.pipe(parser);
                // const boundary = /multipart\/form-data; boundary=(.*)/.exec(params['__ow_headers']['content-type']);
                // console.log('$$boundary: ', boundary[1]);
                // stream.pipe( form.parse );
                // observer.next('Upload successfully.');
                // observer.complete();
                // forkJoin($upload)
                // .subscribe({
                //   next: (value) => {
                //     console.log(value)
                //   },
                //   complete: () => {
                //     observer.next('Upload successfully.');
                //     observer.complete();  
                //   }
                // });
            }
            catch (err) {
                observer.next(`Upload failed. ${err}`);
                observer.complete();
            }
        });
    },
    error: (msg) => {
        return new rxjs_1.Observable((observer) => {
            observer.next(msg);
            observer.complete();
        });
    },
    default: (params) => {
        return new rxjs_1.Observable((observer) => {
            observer.next(`Method ${params.method} not found.`);
            observer.complete();
        });
    }
};
//# sourceMappingURL=demo-action.js.map