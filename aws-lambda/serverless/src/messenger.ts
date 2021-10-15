import { Params } from './params';

export class ResponseMessage {
  constructor (
    public body: string, 
    public headers: Object, 
    public statusCode: number = 200) {
  }
}

export class Messenger {

  constructor (private params: Params) {
  }

  send(body: any, contentType = 'application/json'): ResponseMessage {
    return new ResponseMessage(JSON.stringify(body), {'Content-Type': contentType});
  }
}