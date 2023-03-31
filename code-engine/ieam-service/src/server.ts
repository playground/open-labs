import { HznParams, Params } from '@common/params';
import { Utils } from '@common/utils';
import cors from 'cors';
import express from 'express';
import { existsSync } from 'fs';
import jsonfile = require('jsonfile');
import ldap = require('ldapjs');
import ssha = require('node-ssha256');
import path = require('path');
import request = require('request');
import { Observable } from 'rxjs';

const cp = require('child_process'),
exec = cp.exec;

export const utils = new Utils();

export class Server {
  params: Params = <Params>{};
  app = express();
  apiUrl = `${process.env.SERVERLESS_ENDPOINT}`
  constructor(private port = 8080) {
    this.initialise()
  }

  getParams(params: HznParams) {
    return Object.assign(this.params, params)
  }
  setCorsHeaders(req: express.Request, res: express.Response) {
    res.header("Access-Control-Allow-Origin", "YOUR_URL"); // restrict it to the required domain
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    // Set custom headers for CORS
    res.header("Access-Control-Allow-Headers", "Content-type,Accept,X-Custom-Header");

  }
  streamData(req: express.Request, res: express.Response, parse = true) {
    let params = this.getParams(req.query as unknown as HznParams);
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
        const pEnv = ceAccess['dev'];
        Object.keys(pEnv).forEach((key) => {
          if(key != 'REGISTRY_ACCESS_SECRET') {
            process.env[key] = pEnv[key]
          }
        })  
      }
    }      
  }
  ldapSearch() {
    return new Observable((observer) => {
      const client = ldap.createClient({
        url: [process.env['LDAP_URL']]
      });
            
      client.on('connectError', (err) => {
        // handle connection error
        console.log(err)
        observer.error(err)
      })
      client.bind(process.env['LDAP_DN'], process.env['LDAP_SECRET'], (err) => {
        if(err) {
          console.log(err)
          observer.error(err)  
        } else {
          console.log('ldap bound')
          const opts = {
            filter: '(&(l=Seattle)(email=*@ibm.com))',
            scope: 'sub',
            attributes: ['dn', 'sn', 'cn']
          };
          const newDN = "ou=homelab,dc=localhost";
          const newUser = {
            cn: 'guy',
            sn: 'guy',
            uid: '123',
            mail: 'labeuser1@ibm.com',
            objectClass: 'inetOrgPerson',
            userPassword: ssha.create('s00prs3cr3+')
          }
          client.add(newDN, newUser, (err) => {
            if(err) {
              console.log(err)
              observer.error(err)      
            } else {
              observer.next('user added')
              observer.complete()
            }
          })
        }
      })
    })
  }
  ldapTest() {
    return new Observable((observer) => {
      const client = ldap.createClient({
        url: [process.env['LDAP_URL']]
      });
            
      client.on('connectError', (err) => {
        // handle connection error
        console.log(err)
        observer.error(err)
      })
      client.bind(process.env['LDAP_DN'], process.env['LDAP_SECRET'], (err) => {
        if(err) {
          console.log(err)
          observer.error(err)  
        } else {
          console.log('ldap bound')
          const newDN = "cn=guy3,ou=homelab,dc=localhost";
          const newUser = {
            cn: 'guy3',
            sn: 'guy3',
            uid: '123456',
            mail: 'labeuser3@ibm.com',
            objectClass: 'inetOrgPerson',
            userPassword: ssha.create('s00prs3cr3+')
          }
          client.add(newDN, newUser, (err) => {
            if(err) {
              console.log(err)
              observer.error(err)      
            } else {
              observer.next('user added')
              observer.complete()
            }
          })
        }
      })
    })  
  }
  registerUser(params: Params) {
    //cloudctl login -a https://cp-console.ieam-roks-stage-1-70ea81cdef68a2eb78ece6d890b7dad3-0000.us-south.containers.appdomain.cloud -u ljeff -p IEAMUserPassw0rd$ -n ibm-edge --skip-ssl-validation
    //cloudctl iam api-key-create "key name" -d "key description"
    return new Observable((observer) => {
      const client = ldap.createClient({
        url: ['ldap://openldap-ieam.ibm-edge.svc.cluster.local:389']
      });
      
      client.on('connectError', (err) => {
        // handle connection error
        console.log(err)
        observer.error(err)
      })
      //const password = Math.random().toString(36).slice(2)
      //let arg = `cloudctl login -a https://cp-console.ieam-8e873dd4c685acf6fd2f13f4cdfb05bb-0000.us-south.containers.appdomain.cloud/ -u ${params.email} -p ${password} -n ibm-edge-lab --skip-ssl-validation`
    })
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

  initialise() {
    this.localEnv();
    let app = this.app;
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
  
    app.get("/ldap_test", (req: express.Request, res: express.Response) => {
      this.ldapTest()
      .subscribe({
        next: (resp) => {
          res.json(resp)
        }, error: (err) => {
          res.json({error: err})
        }
      })
    });
  
    app.post('/register_user', (req: express.Request, res: express.Response, next) => {
      this.streamData(req, res)
      .subscribe({
        next: (params: Params) => {
          console.log(params)
          try {
            req.setEncoding('utf8');
            const b64 = this.encodeBase64(process.env['HUB_ADMIN'])
            console.log('here...')
            let headers: any = {
              'Authorization': `Basic ${b64}`,
              'Content-Type': 'application/json'
            };
            let url = `${process.env['HZN_EXCHANGE_URL']}/orgs/${process.env['HZN_ORG_ID']}/users/${params.email}`
            const body = {
              password: Math.random().toString(36).slice(2),
              admin: false,
              email: params.email
            }
            const options = {
              method: 'POST',
              url: url,
              headers: headers,
              body: JSON.stringify(body)
            }
            request(options, (error, response) => {
              if(error) {
                console.log('error: ', error)
              }
              res.send(response.body)
            })
          } catch(e) {
            console.log(e)
          }
        }, error: (err) => next(err)
      })
    })

    app.get("/get_weather_info", (req: express.Request, res: express.Response, next) => {
      utils.httpGet(`${this.apiUrl}/get_weather_info`)
      .subscribe({
        next: (data: any) => res.send(data),
        error: (err: any) => next(err)
      })  
      // @ts-ignore
      // let weather = new Weather(req.query.weatherApiKey, req.query.geoCode, req.query.language, req.query.units);
      // let fiveDaysWeatherInfo = weather.get5DaysForecast();
      // res.send({data: fiveDaysWeatherInfo});
    });
  
    app.get("/get_crop_list", (req: express.Request, res: express.Response, next) => {
      utils.httpGet(`${this.apiUrl}/get_crop_list`)
      .subscribe({
        next: (data: any) => res.send(data),
        error: (err: any) => next(err)
      })  
    });

    app.get("/unregister", (req: express.Request, res: express.Response, next) => {
      utils.shell(`oh deploy autoUnregister`)
      .subscribe({
        next: (data: any) => res.send(data),
        error: (err: any) => next(err)
      })  
    });

    app.get("/register_with_policy", (req: express.Request, res: express.Response, next) => {
      utils.shell(`oh deploy autoRegisterWithPolicy`)
      .subscribe({
        next: (data: any) => res.send(data),
        error: (err: any) => next(err)
      })  
    });

    app.get("/register_with_pattern", (req: express.Request, res: express.Response, next) => {
      utils.shell(`oh deploy autoRegisterWithPattern`)
      .subscribe({
        next: (data: any) => res.send(data),
        error: (err: any) => next(err)
      })  
    });

    app.post('/update_config', (req: express.Request, res: express.Response, next) => {
      this.streamData(req, res)
      .subscribe({
        next: (params: Params) => {
          console.log(params)
          res.send('test')
          //this.cosClient.mkdir(params)
          //.subscribe({
          //  next: (data: any) => res.send(data),
          //  error: (err: any) => next(err)
          //})
        }, error: (err) => next(err)
      })
    })

    app.listen(this.port, () => {
      console.log(`Started on ${this.port}`);
    });
  }
}
