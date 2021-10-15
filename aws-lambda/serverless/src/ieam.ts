// export const hello = (event, context, cb) => cb(null,
//   { message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!', event }
// );
import { Observable, of } from 'rxjs';
import { Messenger } from './messenger';
import { Params } from './params';

export const handler = (params: Params, context, callback) => {
  Object.assign(params, params.body);
  params.contentType = params.contentType ? params.contentType : 'application/json';
  const response = new Messenger(params);
  action.exec(params)
  .subscribe((data) => {
    callback(null, response.send(data));
  })
}

let action = {
  exec: (params: Params) => {
    try {
      const ct = null;
      params.body = params.body ? JSON.parse(params.body) : null;
      let method = params.body ? params.body.action : null;
      console.log('$$$params', method)
      return (action[method] || action.default)(params);  
    } catch(e) {
      return of({data: e});
    }
  },
  sayHi: (params: Params) => {
    return new Observable((observer) => {
      observer.next(`Hello!`);
      observer.complete();
    });
  },
  default: (params: Params) => {
    return new Observable((observer) => {
      console.log('$$$params', params)
      observer.next(`Method ${params.action} not found.`);
      observer.complete();
    });
  }
}