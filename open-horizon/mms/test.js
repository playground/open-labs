#! /usr/bin/env node
const { createWriteStream, unlinkSync } = require('fs');
const https = require('https');
const { pipeline } = require('stream');
const cp = require('child_process'),
exec = cp.exec;

const tempFile = `${this.sharedVolume}/${this.tempFile}`;
let writableStream = createWriteStream('model.zip');
let url = "https://weather-labs.s3-api.us-geo.objectstorage.softlayer.net/models/version_2.0/model.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=cbee834cb0994751862d9cfd5c096c6f%2F20210831%2Fus-geo%2Fs3%2Faws4_request&X-Amz-Date=20210831T020008Z&X-Amz-Expires=900&X-Amz-Signature=2131157e353a5cc6f5d0916724ae99cf045eaabb22702f58ca50f4c4461a58c6&X-Amz-SignedHeaders=host"                                                           

https.get(url, (resp) => {
  pipeline(resp, writableStream, (err) => {
    if(!err) {
      console.log('done');
    } else {
      console.log(err);
      unlinkSync(tempFile)
    }
  })
});
