#! /usr/bin/env node
const cp = require('child_process'),
  exec = cp.exec;
const fs = require('fs');
var dotenv = require('dotenv');
const cosAccess = require('../.env-cos.json');

if(fs.existsSync('.env-local')) {
  const localEnv = dotenv.parse(fs.readFileSync('.env-local'));
  for(var i in localEnv) {
    process.env[i] = localEnv[i];
  }
}

const env = process.env.npm_config_env || 'dev';
const task = process.env.npm_config_task || 'deploy';
const package = process.env.npm_config_package || 'wx-labs';
const yaml = process.env.npm_config_api ? 'manifest-api.yaml' : 'manifest.yaml';

let build = {
  deployTS: () => {
    build.getEnvVar();
    let arg = `BUCKET=${process.env.BUCKET} ACCESSKEYID=${process.env.ACCESSKEYID} `;
    arg += `SECRETACCESSKEY=${process.env.SECRETACCESSKEY}  COS_ENDPOINT=${process.env.COS_ENDPOINT} `;
    arg += ` COS_IBMAUTHENDPOINT=${process.env.COS_IBMAUTHENDPOINT} REGION=${process.env.REGION} `;
    arg += ` SERVICEINSTANCEID=${process.env.SERVICEINSTANCEID} wskdeploy -m ${yaml}`;
    console.log('deploying...')
    exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
      if(!err) {
        console.log(stdout)
        console.log(`done deploying ${package}`);
      } else {
        console.log('failed to deploy', err);
      }
    });
  },
  deploy: () => {
    build.getEnvVar();
    let arg = `ibmcloud fn action update ${package}/hzn-action --memory 2048 --timeout 20000 --docker playbox21/hzn-action:1.0.0 `;
    arg += ` --param bucket ${process.env.BUCKET} --param accessKeyId ${process.env.ACCESSKEYID}`;
    arg += ` --param secretAccessKey ${process.env.SECRETACCESSKEY} --param endpoint ${process.env.COS_ENDPOINT}`;
    arg += ` --param ibmAuthEndpoint ${process.env.COS_IBMAUTHENDPOINT} --param region ${process.env.REGION}`;
    arg += ` --param serviceInstanceId ${process.env.SERVICEINSTANCEID}`;
    console.log('deploying...')
    exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
      if(!err) {
        console.log(stdout)
        console.log(`done add/update ${package}/hzn-action`);
      } else {
        console.log('failed to add/update hzn-action', err);
      }
    });
  },
  getEnvVar: () => {
    let pEnv = process.env;
    pEnv.PACKAGE = package;
    pEnv.ACCESSKEYID = cosAccess[env]['access_key_id'];
    pEnv.SECRETACCESSKEY = cosAccess[env]['secret_access_key'];
    pEnv.APIKEYID = cosAccess[env]['apikey'];
    pEnv.SERVICEINSTANCEID = cosAccess[env]['resource_instance_id'];
    pEnv.BUCKET = cosAccess[env]['bucket'];
  },
  getEnvVar2: () => {
    const cosAccess = JSON.parse(process.env.COS_ACCESS);
    let pEnv = process.env;
    pEnv.PACKAGE = package;
    pEnv.ACCESSKEYID = cosAccess[env]['access_key_id'];
    pEnv.SECRETACCESSKEY = cosAccess[env]['secret_access_key'];
    pEnv.APIKEYID = cosAccess[env]['apikey'];
    pEnv.SERVICEINSTANCEID = cosAccess[env]['resource_instance_id'];
    pEnv.BUCKET = cosAccess[env]['bucket'];
  },
  createComposer: () => {
    console.log(process.cwd());
    build.generateComposerJson();
    exec(`compose ./dist/watson-services/src/watson-composer-${package}.js > ./dist/watson-services/src/watson-composer-${package}.json`, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
      if(!err) {
        console.log('done composing watson-composer...');
        exec(`deploy ${package}/watson-composer ./dist/watson-services/src/watson-composer-${package}.json -w`, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
          if(!err) {
            console.log(`done deploying ${package}/watson-composer...`);
          } else {
            console.log(err);
          }
        });
      } else {
        console.log('failed to add/update watson-composer', err);
      }  
    });  
  },
  generateComposerJson: () => {
    if(fs.existsSync('./dist/watson-services/src/watson-composer.js')) {
      const file = fs.readFileSync('./dist/watson-services/src/watson-composer.js').toString().split('\n');
      let output = [];
      let match;
      file.forEach((line, i) => {
        if(line.indexOf('${package}') > 0) {
          line = line.replace('${package}', package);
          console.log('package', line);
          output.push(line);
        } else {
          output.push(line);
        }
      });
      let text = output.join('\n');
      fs.writeFileSync(`./dist/watson-services/src/watson-composer-${package}.js`, text, function (err) {
        if (err) {
          console.log(err);
          process.exit(1);
        } else {
          console.log(`generated ./dist/watson-services/src/watson-composer-${package}.js`);
        } 
      });
    }
  }    
}

build[task]();