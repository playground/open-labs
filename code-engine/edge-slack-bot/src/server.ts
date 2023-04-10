import { HznParams, LdapParams, Params } from '@common/params';
import { App, ExpressReceiver } from '@slack/bolt';
import cors from 'cors';
import express from 'express';
import { existsSync } from 'fs';
import jsonfile = require('jsonfile');
import path = require('path');
import { Observable } from 'rxjs';

const cp = require('child_process'),
exec = cp.exec;

export class Server {
  params: Params = <Params>{};
  app = express();
  slackApp;
  receiver;
  slackPort = process.env.SLACK_PORT || 3003;
  slackChannel = '#sowonderful';
  apiUrl = `${process.env.SERVERLESS_ENDPOINT}`
  constructor(private port = 8080) {
    this.initialise()
  }

  getParams(params: LdapParams) {
    return Object.assign(this.params, params)
  }
  setCorsHeaders(req: express.Request, res: express.Response) {
    res.header("Access-Control-Allow-Origin", "YOUR_URL"); // restrict it to the required domain
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    // Set custom headers for CORS
    res.header("Access-Control-Allow-Headers", "Content-type,Accept,X-Custom-Header");

  }
  streamData(req: express.Request, res: express.Response, parse = true) {
    let params = this.getParams(req.query as unknown as LdapParams);
    let body = ''
    return new Observable((observer) => {
      req.on('data', (data) => {
        body += data
      })
      .on('end', () => {
        try {
          // console.log(body)
          let data = JSON.parse(body);
          if(!parse) {
            params.body = data
          } else {
            Object.keys(data).forEach((key) => {
              params[key] = data[key];
            })
          }
          observer.next(params)
          observer.complete()
        } catch(e) {
          observer.error(e)
        }
      })
    })
  }
  encodeBase64(data) {
    return Buffer.from(data).toString('base64');
  }
  decodeBase64(data) {
    return Buffer.from(data, 'base64').toString('ascii');
  }
  localEnv() {
    if(existsSync('.env-local.json')) {
      let ceAccess = jsonfile.readFileSync(`.env-local.json`);
      if(ceAccess) {
        const pEnv = ceAccess['local'];
        Object.keys(pEnv).forEach((key) => {
          if(key != 'REGISTRY_ACCESS_SECRET') {
            process.env[key] = pEnv[key]
          }
        })  
      }
    }      
  }
  cloudctlLogin(user: string, password: string) {
    let arg = `./cloudctl login -a ${process.env}`
  }
  generateAPI() {
    let arg 
  }
  shell(arg: string, success='command executed successfully', error='command failed', prnStdout=true, options={maxBuffer: 1024 * 2000}) {
    return new Observable((observer) => {
      console.log(arg);
      if(!prnStdout) {
        options = Object.assign(options, {stdio: 'pipe', encoding: 'utf8'})
      }
      exec(arg, options, (err: any, stdout: any, stderr: any) => {
        if(!err) {
          if(prnStdout) {
            console.log(stdout);
          }
          console.log(success);
          observer.next(stdout);
          observer.complete();
        } else {
          console.log(`${error}: ${err}`);
          observer.error(err);
        }
      })  
    });
  }
  slack(param: HznParams) {
    return new Observable((observer) => {
      observer.next('')
      observer.complete()
    })  
  }
  async initSlack() {
    return new Promise(async (resolve, reject) => {
      this.receiver = new ExpressReceiver({
        signingSecret: process.env['SLACK_SIGNING_SECRET']
      });
      this.slackApp = new App({
        token: process.env['SLACK_BOT_TOKEN'],
        signingSecret: process.env['SLACK_SIGNING_SECRET'],
        receiver: this.receiver
        //customRoutes: [
        //  {
        //    path: '/staff',
        //    method: ['GET'],
        //    handler: (req, res) => {
        //      res.writeHead(200)
        //      res.end("testing")
        //    }
        //  //},
        //  //{
        //  //  path: '/slack/events',
        //  //  method: ['POST'],
        //  //  handler: (req, res) => {
        //  //    res.writeHead(200)
        //  //    res.end("testing")
        //  //  }
        //  }
        //],
        //installerOptions: {
        //  port: this.port
        //},
        //socketMode: true,
        //appToken: process.env['EDGE_BOT_TOKEN']
      });
  
      this.slackApp.command('/register', async({command, ack, say}) => {
        try {
          console.log('command call...')
          await ack();
          await say('Welcome Edge User!');
        } catch(e) {
          console.log('command call...')
          console.log(e);
          console.error(e);
        }
      });
      this.slackApp.command('/echo', async({command, ack, say}) => {
        try {
          console.log('command call...')
          await ack();
          await say('Welcome Edge User!');
        } catch(e) {
          console.log('command call...')
          console.log(e);
          console.error(e);
        }
      });
      this.slackApp.command('/ask', async({command, ack, say}) => {
        try {
          console.log('command call...')
          await ack();
          await say('Welcome Edge User!');
        } catch(e) {
          console.log('command call...')
          console.log(e);
          console.error(e);
        }
      });
      this.slackApp.message('hello', async ({ message, say }) => {
        // say() sends a message to the channel where the event was triggered
        await say(`Hey there <@${message.user}>!`);
      });
      
      await this.slackApp.start(this.slackPort)
      console.log(`Edge Slack Bot is running on port ${this.slackPort}`)

      resolve('')
    })
  }

  directMessage(msg: string, channel: string) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const result = await this.slackApp.client.chat.postMessage({
            token: process.env['SLACK_BOT_TOKEN'],
            channel: '#sowonderful',
            blocks: [{
              type: 'section', 
              text: {
                type: 'mrkdwn',
                text: msg
              }
            }]
          });
          resolve(result)  
        } catch(e) {
          reject(e);
        }
      })();                
    })
  }
  async initialise() {
    this.localEnv();
    await this.initSlack();
    console.log('here......')
    let app = this.app;
    app.use('/', this.receiver.router)
    app.use(cors({
      origin: '*'
    }));  
    app.use('/static', express.static('public'));

    app.use('/', express.static('dist/auto-dock-dashboard'))
  
    app.get('/', (req: express.Request, res: express.Response, next: any) => { //here just add next parameter
      res.sendFile(
        path.resolve(__dirname, "index.html")
      )
      // next();
    })
  
    app.get("/staff", (req: express.Request, res: express.Response) => {
      res.json(["Jeff", "Joe", "Mikio", "Rob", "Sanjeev", "Susan"]);
    });
  
    app.get("/think_staff", (req: express.Request, res: express.Response) => {
      res.json(["Charisse", "Jeff", "Michael", "Michelle", "Sanjeev", "Susan"]);
    });
  
    app.get("/message", (req: express.Request, res: express.Response) => {
      let params = this.getParams(req.query as unknown as LdapParams);
      console.log(req.query)
      const channel = params.channel || this.slackChannel;
      this.directMessage('hey dude', channel).then((result) => {
        res.json({result: 'message sent'});
      })
    });
    app.post("/register", (req: express.Request, res: express.Response) => {
      try {
        req.setEncoding('utf8');
        this.streamData(req, res)
        .subscribe({
          next: (params: LdapParams) => {
            console.log(params.fname, params.lname)
            const msg = `Register\n>${params.fname} ${params.lname}\n>ibmid: ${params.ibmid}\n>email: ${params.email}\n>company: ${params.company}`
            const channel = params.channel || this.slackChannel;
            this.directMessage(msg, channel).then((result) => {
              res.send({result: result});
            }).catch((e) => {
              res.send({error: e})
            })
          }, error: (err) => {
            res.send({error: err})
          }  
        })
      } catch(e) {
        res.send({error: e})        
      }
    });
    //app.post('/slack/events', (req: express.Request, res: express.Response) => {
    //  console.log('SLACK EVENTS')
    //  this.streamData(req, res)
    //  .subscribe({
    //    next: (params: HznParams) => {
    //      console.log(params)
    //      res.send(params);
    //    }
    //  })  
    //})
    //app.post("/slack", (req: express.Request, res: express.Response) => {
    //  try {
    //    req.setEncoding('utf8');
    //    this.streamData(req, res)
    //    .subscribe({
    //      next: (params: LdapParams) => {
    //        console.log(params.fname, params.lname)
    //        this.slack(params)
    //        .subscribe({
    //          next: (resp) => {
    //            res.json(resp)
    //          }, error: (err) => {
    //            res.send({error: err})
    //          }
    //        })  
    //      }, error: (err) => {
    //        res.send({error: err})
    //      }  
    //    })
    //  } catch(e) {
    //    res.send({error: e})        
    //  }
    //});
  
    app.listen(this.port, () => {
      console.log(`Started on ${this.port}`);
    });
  }
}
