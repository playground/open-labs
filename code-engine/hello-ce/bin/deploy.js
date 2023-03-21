#! /usr/bin/env node
const cp = require('child_process'),
  exec = cp.exec;
const fs = require('fs');
const { Observable } = require('rxjs');
var dotenv = require('dotenv');

if(fs.existsSync('../.env-local')) {
  const localEnv = dotenv.parse(fs.readFileSync('../.env-local'));
  for(var i in localEnv) {
    process.env[i] = localEnv[i];
  }
}

const name = process.env.npm_config_name;
const task = process.env.npm_config_task;
let image = process.env.npm_config_image;

if(!task) {
  console.log(`specify --task taskname...`)
  process.exit(0)
}
if(task == 'deploy' && !name) {
  console.log(`name is required:  specify --name appname...`)
  process.exit(0)
}
if((task == 'deploy' || task == 'push' || task == 'build') && !image) {
  console.log(`image name is required:  specify --image imagename...`)
  process.exit(0)
}
console.log(image, image.match(/([^/]+$)/)[0])
image = image.match(/([^/]+$)/)[0];

let build = {
  build: () => {
    let imageName = `${process.env.REGISTRY}${image}`
    let arg = `docker build --no-cache -t ${imageName} .  `
    build.shell(arg,`done building ${imageName} image`, `failed to build ${imageName} image`)
    .subscribe(() => {
      process.exit(0)
    })
  },
  push: () => {
    let imageName = `${process.env.REGISTRY}${image}`
    let arg = `docker push ${process.env.REGISTRY}${image}`
    build.shell(arg,`done pushing ${imageName} image`, `failed to push ${imageName} image`)
    .subscribe(() => {
      process.exit(0)
    })
  },
  deploy: () => {
    let arg = `ibmcloud ce app update -n ${name} --image ${process.env.REGISTRY}${image}`
    console.log('deploying...')
    build.shell(arg,`done add/update ${name}`, `failed to add/update ${name}`)
    .subscribe(() => {
      process.exit(0)
    })
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