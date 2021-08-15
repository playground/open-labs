#! /usr/bin/env node
const path = require('path');
const cp = require('child_process'),
  exec = cp.exec;
const fs = require('fs');

if(fs.existsSync('./index.js')) {
  const file = fs.readFileSync('./index.js').toString().split('\n');
  let output = [];
  let match;
  file.forEach((line, i) => {
    if(line.indexOf('require("@common/') > 0) {
      output.push(line.replace('@common/', `./js/`));
    } else if(line.indexOf('exports.default') >= 0) {
      output.push(line.replace('exports.default', 'exports.main')); 
    } else {
      output.push(line);
    }
  });
  let text = output.join('\n');
  // console.log(text);
  fs.writeFile('./index.js', text, function (err) {
    if (err) {
      console.log(err);
      process.exit(1);
    }  
    console.log('cleanse index.js');
    output = [];
  });
}
