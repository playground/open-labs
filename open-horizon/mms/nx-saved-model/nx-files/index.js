let tfnode = require('@roboflow/tfjs-jetson');
const {unlinkSync, stat, renameSync, readdir, readdirSync, existsSync, readFileSync, copyFileSync, mkdirSync} = require('fs');
const jsonfile = require('jsonfile');
const { Observable } = require('rxjs');
const cp = require('child_process'),
exec = cp.exec;
const player = require('play-sound')();

const path = require('path');
const winston = require('winston');
const consoleTransport = new winston.transports.Console()
const myWinstonOptions = {
    transports: [consoleTransport]
}
const logger = new winston.createLogger(myWinstonOptions)

let model;
let labels;
let version;
const currentModelPath = './model';
const imagePath = './public/images';
const newModelPath = './model-new';
const oldModelPath = './model-old';
const staticPath = './public/js';
const mmsPath = '/mms-shared';
const localPath = './local-shared';
let sharedPath = '';
let timer;
const intervalMS = 10000;
let count = 0;
let previousImage;

const state = {
  server: null,
  sockets: [],
};
process.env.npm_config_cameraOn = false;

console.log('platform ', process.platform)

mp3s = {
  'snapshot': './public/media/audio-snap.mp3',
  'gotMail': './public/media/youve-got-mail-sound.mp3',
  'theForce': './public/media/may-the-force-be-with-you.mp3' 
};

let ieam = {
  soundEffect: (mp3) => {
    console.log(mp3)
    player.play(mp3, (err) => {
      if (err) console.log(`Could not play sound: ${err}`);  
    });  
  },
  capture: () => {
    ieam.soundEffect(mp3s.snapshot);
    let arg = `ffmpeg -ss 0.5 -f avfoundation -r 30.000030 -i "0" -t 1 -vframes 1 ./public/images/image.png -y`;
    if(process.platform !== 'darwin') {
      // arg = `ffmpeg -i /dev/video0 -vframes 1 -vf "eq=contrast=1.5:brightness=0.5" ./public/images/image.png -y`;
      arg = `fswebcam -r 640x480 --no-banner -S 25 public/images/image.jpg`;
    }
    exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
      if(!err) {
        console.log('photo captured...');
      } else {
        console.log(err);
      }
    });
  },
  sleep: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  checkImage: async () => {
    if(process.env.npm_config_cameraOn == 'true' && ieam.doCapture) {
      console.log('pause ', Boolean(process.env.npm_config_cameraOn), process.env.npm_config_cameraOn)
      ieam.capture();
    }
    let imageFile = `${imagePath}/image.png`;
    if(!existsSync(imageFile)) {
      imageFile = `${imagePath}/image.jpg`;
    }
    if(existsSync(imageFile)) {
      try {
        console.log(imageFile)
        const image = readFileSync(imageFile);
        const decodedImage = tfnode.node.decodeImage(new Uint8Array(image), 3);
        const inputTensor = decodedImage.expandDims(0);
        await ieam.inference(inputTensor, imageFile);
        ieam.doCapture = true;
      } catch(e) {
        console.log(e);
        unlinkSync(imageFile);
      }
    }  
  },  
  inference: async (inputTensor, imageFile) => {
    const startTime = tfnode.util.now();
    let outputTensor = await model.predict({input_tensor: inputTensor});
    const scores = await outputTensor['detection_scores'].arraySync();
    const boxes = await outputTensor['detection_boxes'].arraySync();
    const classes = await outputTensor['detection_classes'].arraySync();
    const num = await outputTensor['num_detections'].arraySync();
    const endTime = tfnode.util.now();
    outputTensor['detection_scores'].dispose();
    outputTensor['detection_boxes'].dispose();
    outputTensor['detection_classes'].dispose();
    outputTensor['num_detections'].dispose();
    
    let predictions = [];
    const elapsedTime = endTime - startTime;
    for (let i = 0; i < scores[0].length; i++) {
      if (scores[0][i] > 0.6) {
        predictions.push({
          detectedBox: boxes[0][i].map((el)=>el.toFixed(3)),
          detectedClass: labels[classes[0][i]],
          detectedScore: scores[0][i].toFixed(3)
        });
      }
    }
    console.log('predictions:', predictions.length, predictions[0]);
    console.log('time took: ', elapsedTime);
    console.log('build json...');
    jsonfile.writeFile(`${staticPath}/image.json`, {bbox: predictions, elapsedTime: elapsedTime, version: version}, {spaces: 2});
    ieam.renameFile(imageFile, `${imagePath}/image-old.png`);
    ieam.soundEffect(mp3s.theForce);  
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
            ieam.traverse(file, (err, res) => {
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
  checkMMS: () => {
    let list;
    if(existsSync(mmsPath)) {
      list = readdirSync(mmsPath);
      list = list.filter(item => /(\.zip)$/.test(item));
      sharedPath = mmsPath;  
    } else if(existsSync(localPath)) {
      list = readdirSync(localPath);
      list = list.filter(item => /(\.zip)$/.test(item));
      sharedPath = localPath;
    }
    return list;
  },
  unzipMMS: (files) => {
    return new Observable((observer) => {
      let arg = '';
      console.log('list', files);
      files.forEach((file) => {
        if(file === 'model.zip') {
          arg = `unzip -o ${sharedPath}/${file} -d ${newModelPath}`;
        } else if(file === 'image.zip') {
          arg = `unzip -o ${sharedPath}/${file} -d ${imagePath}`;
        } else {
          observer.next();
          observer.complete();
        }
        exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
          if(existsSync(`${sharedPath}/${file}`)) {
            unlinkSync(`${sharedPath}/${file}`);
          }
          if(!err) {
            observer.next();
            observer.complete();
          } else {
            console.log(err);
            observer.next();
            observer.complete();
          }
        });
      })
    });    
  },  
  moveFiles: (srcDir, destDir) => {
    return new Observable((observer) => {
      let arg = `cp -r ${srcDir}/* ${destDir}`;
      if(srcDir === newModelPath) {
        arg += ` && rm -rf ${srcDir}/*`;
      }
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
        if(!err) {
          observer.next();
          observer.complete();
        } else {
          console.log(err);
          observer.next();
          observer.complete();
        }
      });
    });    
  },
  removeFiles: (srcDir) => {
    return new Observable((observer) => {
      let arg = `rm -rf ${srcDir}/*`;
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
        if(!err) {
          observer.next();
          observer.complete();
        } else {
          console.log(err);
          observer.next();
          observer.complete();
        }
      });
    });    
  },
  renameFile: (from, to) => {
    if(existsSync(from)) {
      renameSync(from, to);
    }    
  },
  loadModel: async (modelPath) => {
    try {
      let newVersion = jsonfile.readFileSync(`${modelPath}/assets/version.json`);
      if(version && version.version === newVersion.version) {
        ieam.removeFiles(modelPath)
        .subscribe(() => {
          ieam.resetTimer();
        });
      }
      else if(modelPath === newModelPath || modelPath === localPath) {
        console.log('iam new')
        ieam.moveFiles(currentModelPath, oldModelPath)
        .subscribe({
          next: (v) => ieam.moveFiles(newModelPath, currentModelPath)
            .subscribe({
              next: (v) => {
                
                  console.log('new model is available, restarting server...');
                  ieam.soundEffect(mp3s.gotMail);  
                  process.exit(0);
                
              },   
              error: (e) => {
                console.log('reset timer');
                ieam.resetTimer(); 
              }
            }),  
          error: (e) => {
            console.log('reset timer');
            ieam.resetTimer(); 
          }
        })
      } else if(modelPath !== newModelPath){
        count++;
        const startTime = tfnode.util.now();
        model = await tfnode.node.loadSavedModel(modelPath);
        const endTime = tfnode.util.now();

        console.log(`loading time:  ${modelPath}, ${endTime-startTime}`);
        labels = jsonfile.readFileSync(`${modelPath}/assets/labels.json`);
        version = jsonfile.readFileSync(`${modelPath}/assets/version.json`);
        console.log('version: ', version)
      }
    } catch(e) {
      console.log(e);
      if(modelPath === newModelPath) {
        ieam.removeFiles(modelPath)
        .subscribe(() => {
          console.log('modelpath', modelPath)
          ieam.loadModel(currentModelPath);
        })
      } else if(modelPath === currentModelPath) {
        ieam.loadModel(oldModelPath);
      } else {
        console.log('PANIC! no good model to load');
      }
      ieam.resetTimer();
    }
  },
  resetTimer: () => {
    clearInterval(timer);
    timer = null;
    ieam.setInterval(intervalMS);  
  },
  checkNewModel: async () => {
      let files = readdirSync(newModelPath);
      list = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
      // console.log(files, list)
      if(list.length > 0) {
        clearInterval(timer);
        await ieam.loadModel(newModelPath);
        // ieam.setInterval(intervalMS);
      }
  },
  setInterval: (ms) => {
    timer = setInterval(async () => {
      let mmsFiles = ieam.checkMMS(); 
      if(mmsFiles && mmsFiles.length > 0) {
        clearInterval(timer);
        ieam.unzipMMS(mmsFiles)
        .subscribe(async () => {
          await ieam.checkNewModel();
          ieam.setInterval(intervalMS);
        }) 
      } else {
        await ieam.checkNewModel();
        ieam.checkImage();
      }
    }, ms);
  },
  initialInference: () => {
    if(!existsSync(currentModelPath)) {
      mkdirSync(currentModelPath);
    }
    if(!existsSync(newModelPath)) {
      mkdirSync(newModelPath);
    }
    if(!existsSync(oldModelPath)) {
      mkdirSync(oldModelPath);
    }
    let oldImage = `${imagePath}/image-old.png`;
    if(!existsSync(oldImage)) {
      copyFileSync(`${imagePath}/backup.png`, oldImage)
    }
    ieam.renameFile(oldImage, `${imagePath}/image.png`);  
  },
  start: () => {
    count = 0;
    state.server = require('./server')().listen(3000, () => {
      console.log('Started on 3000');
    });
    state.server.on('connection', (socket) => {
      // console.log('Add socket', state.sockets.length + 1);
      state.sockets.push(socket);
    });
  },
  restart: () => {
    // clean the cache
    Object.keys(require.cache).forEach((id) => {
      if(id.indexOf('/tfjs-node/') > 0) {
        // console.log('Reloading', id);
        delete require.cache[id];
      }  
    });

    state.sockets.forEach((socket, index) => {
      // console.log('Destroying socket', index + 1);
      if (socket.destroyed === false) {
        socket.destroy();
      }
    });
  
    state.sockets = [];
  
    state.server.close(() => {
      console.log('Server is closed');
      console.log('\n----------------- restarting -------------');
      ieam.start();
      tfnode = require('@tensorflow/tfjs-node');
      delete(model);
      delete(labels);
      delete(version);
      ieam.loadModel(currentModelPath)
      ieam.initialInference();  
      ieam.setInterval(intervalMS);
    });
  }      
}

ieam.start();
ieam.loadModel(currentModelPath)
ieam.initialInference();  
ieam.setInterval(intervalMS);
