#! /usr/bin/env node
const cp = require('child_process'),
  exec = cp.exec;
const fs = require('fs');
const { Observable } = require('rxjs');
const dotenv = require('dotenv');
const cosAccess = require('../../.env-local.json');

if(fs.existsSync('../.env-local')) {
  const localEnv = dotenv.parse(fs.readFileSync('../.env-local'));
  for(var i in localEnv) {
    process.env[i] = localEnv[i];
  }
}

const env = process.env.npm_config_env || 'prod';
const package = process.env.npm_config_package || 'ieam-admin';
const name = process.env.npm_config_name;
const task = process.env.npm_config_task;
const update = process.env.npm_config_create ? 'create' : 'update';
const version = process.env.npm_config_image_version;

console.log(task)
if(!task) {
  console.log(`specify --task taskname...`)
  process.exit(0)
}
if(!name) {
  console.log(`name is required:  specify --name appname...`)
  process.exit(0)
}
if(!version) {
  console.log(`version is required:  specify --image-version x.x.x`)
  process.exit(0)
}
let imageName = `${process.env.REGISTRY}${name}-${env}:${version}`;
let appName = `${name}-${env}`;
console.log(appName, imageName)

let build = {
  doall: () => {
    let arg = 'npm run build && npm run bundle'
    build.shell(arg)
    .subscribe(() => {
      arg = `docker build --no-cache -t ${imageName} .  `
      build.shell(arg,`done building ${imageName} image`, `failed to build ${imageName} image`)
      .subscribe(() => {
        let arg = `docker push ${imageName}`
        build.shell(arg,`done pushing ${imageName} image`, `failed to push ${imageName} image`)
        .subscribe(() => {
          build.deploy()
        })
      })
    })
  },
  build: () => {
    let arg = `docker build --no-cache -t ${imageName} .  `
    build.shell(arg,`done building ${imageName} image`, `failed to build ${imageName} image`)
    .subscribe(() => {
      process.exit(0)
    })
  },
  push: () => {
    let arg = `docker push ${imageName}`
    build.shell(arg,`done pushing ${imageName} image`, `failed to push ${imageName} image`)
    .subscribe(() => {
      process.exit(0)
    })
  },
  deploy: () => {
    build.getEnvVar();
    let pEnv = process.env;
    let arg = `ibmcloud ce app ${update} -n ${appName} --image ${imageName}`
    arg += ` --env bucket=${pEnv.BUCKET} --env accessKeyId=${pEnv.ACCESSKEYID}`;
    arg += ` --env secretAccessKey=${pEnv.SECRETACCESSKEY} --env endpoint=${pEnv.COS_ENDPOINT}`;
    arg += ` --env ibmAuthEndpoint=${pEnv.COS_IBMAUTHENDPOINT} --env region=${pEnv.REGION}`;
    arg += ` --env serviceInstanceId=${pEnv.SERVICEINSTANCEID}`;
    console.log('deploying...')
    build.shell(arg,`done add/update ${appName}`, `failed to add/update ${appName}`, false)
    .subscribe({
      complete: () => process.exit(0),
      error: (err) => {
        console.log('specify --create if this is a new service.')
        process.exit(0)
      }
    })
  },
  getEnvVar: () => {
    let pEnv = process.env;
    pEnv.PACKAGE = package;
    pEnv.ACCESSKEYID = cosAccess[env]['access_key_id'];
    pEnv.SECRETACCESSKEY = cosAccess[env]['secret_access_key'];
    pEnv.APIKEYID = cosAccess[env]['apikey'];
    pEnv.SERVICEINSTANCEID = cosAccess[env]['resource_instance_id'];
    pEnv.BUCKET = cosAccess[env]['bucket'];
    pEnv.COS_IBMAUTHENDPOINT = cosAccess[env]['ibmAuthEndpoint'];
    pEnv.COS_ENDPOINT = cosAccess[env]['endpoint'];
    pEnv.REGION = cosAccess[env]['region'];
  },
  shell: (arg, success='command executed successfully', error='command failed', prnStdout=true, options={maxBuffer: 1024 * 2000}) => {
    return new Observable((observer) => {
      console.log(arg);
      let child = exec(arg, options, (err, stdout, stderr) => {
        if(!err) {
          // console.log(stdout);
          console.log(success);
          observer.next(prnStdout ? stdout : '');
          observer.complete();
        } else {
          console.log(`${error}: ${err}`);
          observer.error(err);
        }
      });
      child.stdout.pipe(process.stdout);
      child.on('data', (data) => {
        console.log(data)
      })  
    });
  }
} 

build[task]();