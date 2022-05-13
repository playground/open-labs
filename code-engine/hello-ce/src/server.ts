import * as http from 'http';
import { Observable, of, from } from 'rxjs';
import { Params } from '@common/params/params';

declare const process: any;
http.createServer(function (request: any, response: { writeHead: (arg0: number, arg1: { 'Content-Type': string; }) => void; end: (arg0: any) => void; }) {
   const target = process.env.TARGET ? process.env.TARGET : 'World' ;
   const msg = process.env.MSG ? process.env.MSG : 'Hello ' + target + '\n';
  //  const params = action.params(request);
   let result: any;
   return new Promise((resolve, reject) => {
    action.exec(request)
    .subscribe((data: any) => {
      result = data;
      console.log('$data', result);
    }, (err: any) => {
      console.log(err);
      response.writeHead(400, {'Content-Type': 'application/json'});
      resolve(response.end(`something went wrong...${err}\n`));
    }, () => {
      response.writeHead(200, {'Content-Type': 'application/json'});
      resolve(response.end(JSON.stringify(result + ' : ' + request.url + ' : ' + request.method + ' : ' + request.body) + '\n'));
    });
  });

  //  response.writeHead(200, {'Content-Type': 'application/json'});
  //  response.end(JSON.stringify(request.url + ' : ' + request.method + ' : ' + request.body) + '\n');
}).listen(8080);

let action: any = {
  params: (req: any) => {
    let q=req.url.split('?'),result: any={};
    if(q.length>=2){
      q[1].split('&').forEach((item: string)=>{
        try {
          result[item.split('=')[0]]=item.split('=')[1];
        } catch (e) {
          result[item.split('=')[0]]='';
        }
      })
    }
    return result;
  },
  exec: (request: any): any => {
    if(request.method == 'GET') {
      let params = action.params(request);
      return (action[params.action] || action.default)(params)
    } else {
      return (action['list'] || action.default)(request.body)
    }
  },
  hello: (params: Params) => {
    return of('hello')
  },
  list: (params: Params) => {
    return of('listing')
  },
  error: (msg: string) => {
    return new Observable((observer) => {
      observer.next(msg);
      observer.complete();
    });
  },
  default: (params: Params) => {
    return new Observable((observer) => {
      observer.next(`Method ${params.method} not found.`);
      observer.complete();
    });
  }
}

console.log('Server running at http://0.0.0.0:8080/');