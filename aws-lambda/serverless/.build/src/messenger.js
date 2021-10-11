"use strict";
exports.__esModule = true;
exports.Messenger = exports.ResponseMessage = void 0;
var ResponseMessage = /** @class */ (function () {
    function ResponseMessage(body, headers, statusCode) {
        if (statusCode === void 0) { statusCode = 200; }
        this.body = body;
        this.headers = headers;
        this.statusCode = statusCode;
    }
    return ResponseMessage;
}());
exports.ResponseMessage = ResponseMessage;
var Messenger = /** @class */ (function () {
    function Messenger(params) {
        this.params = params;
    }
    Messenger.prototype.send = function (body, contentType) {
        if (contentType === void 0) { contentType = 'application/json'; }
        return new ResponseMessage(JSON.stringify(body), { 'Content-Type': contentType });
    };
    return Messenger;
}());
exports.Messenger = Messenger;
//# sourceMappingURL=messenger.js.map