"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messenger = exports.ResponseMessage = void 0;
class ResponseMessage {
    constructor(data, headers, statusCode = 200) {
        this.data = data;
        this.headers = headers;
        this.statusCode = statusCode;
    }
}
exports.ResponseMessage = ResponseMessage;
class Messenger {
    constructor(params) {
        this.params = params;
    }
    send(body, statusCode = 200, headers = { 'Content-Type': 'application/json' }) {
        return new ResponseMessage(body, headers, statusCode);
    }
    error(msg, status) {
        return new ResponseMessage(msg, { 'Content-Type': 'application/json' }, status);
    }
}
exports.Messenger = Messenger;
//# sourceMappingURL=messenger.js.map