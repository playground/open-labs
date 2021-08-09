"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const messenger_1 = require("./js/messenger");
const utility_1 = require("./js/utility");
const cos_client_1 = require("./js/cos-client");
const fs_1 = require("fs");
const path = require("path");
const multipart = require('parted').multipart;
const str2stream = require("string-to-stream");
const cp = require('child_process'), exec = cp.exec;
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
        if (!fs_1.existsSync('/upload')) {
            fs_1.mkdirSync('/upload');
        }
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
            if (err)
                return done(err);
            var i = 0;
            (function next() {
                var file = list[i++];
                if (!file)
                    return done(null, results);
                file = path.resolve(dir, file);
                fs_1.stat(file, (err, stat) => {
                    if (stat && stat.isDirectory()) {
                        action.traverse(file, (err, res) => {
                            results = results.concat(res);
                            next();
                        });
                    }
                    else {
                        results.push(file);
                        next();
                    }
                });
            })();
        });
    },
    removeDir: (dir) => {
        return new rxjs_1.Observable((observer) => {
            let arg = `rm -rf ${dir}`;
            exec(arg, { maxBuffer: 1024 * 2000 }, (err, stdout, stderr) => {
                if (!err) {
                    console.log(`${dir} removed...`);
                    observer.next();
                    observer.complete();
                }
                else {
                    console.log(`failed to remove...${err}`);
                    observer.next();
                    observer.complete();
                }
            });
        });
    },
    demo_cos_upload: (params) => {
        return new rxjs_1.Observable((observer) => {
            try {
                let decoded = Buffer.from(params['__ow_body'], 'base64');
                // @ts-ignore
                const stream = str2stream(decoded);
                let parser = new multipart(params['__ow_headers']['content-type'], {
                    limit: 30 * 1024,
                    diskLimit: 30 * 1024 * 1024,
                    path: '/upload'
                });
                let parts = {};
                let $upload = [];
                parser.on('error', function (err) {
                    console.log('Whoops!', err);
                });
                parser.on('part', function (field, part) {
                    parts[field] = part;
                });
                parser.on('end', async function () {
                    // console.log('$$$parts', parts);
                    action.traverse(`/upload`, (err, files) => {
                        if (err) {
                            console.log('$$$error', err);
                        }
                        console.log('$$$file: ', files, parts);
                        params.directory = parts['directory'];
                        if (!params.directory) {
                            observer.next('please speficfy a directory where you want the files to be uploaded in the bucket.');
                            observer.complete();
                        }
                        else {
                            let body;
                            let filename = '';
                            let splits = [];
                            files.forEach((file) => {
                                body = fs_1.readFileSync(file);
                                splits = file.split('.');
                                filename = `${params.directory}/${file.replace(splits[splits.length - 2] + '.', '').replace('/upload/', '')}`;
                                $upload.push(action.upload(body, filename, params));
                            });
                            action.removeDir('/upload/*')
                                .subscribe(() => {
                                rxjs_1.forkJoin($upload)
                                    .subscribe((uploads) => {
                                    // do something as needed
                                    splits = uploads;
                                    console.log('$$$uploads ', uploads);
                                }, (err) => {
                                    observer.error(err);
                                }, () => {
                                    observer.next(`Upload successfully...${splits}`);
                                    observer.complete();
                                });
                            });
                        }
                    });
                });
                stream.pipe(parser);
            }
            catch (err) {
                observer.next(`Upload failed. ${err}`);
                observer.complete();
            }
        });
    },
    upload: (body, f, params) => {
        return new rxjs_1.Observable((observer) => {
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