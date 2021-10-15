"use strict";
exports.__esModule = true;
exports.handler = void 0;
// export const hello = (event, context, cb) => cb(null,
//   { message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!', event }
// );
var rxjs_1 = require("rxjs");
var messenger_1 = require("./messenger");
var handler = function (params, context, callback) {
    Object.assign(params, params.body);
    params.contentType = params.contentType ? params.contentType : 'application/json';
    var response = new messenger_1.Messenger(params);
    action.exec(params)
        .subscribe(function (data) {
        callback(null, response.send(data));
    });
};
exports.handler = handler;
var action = {
    exec: function (params) {
        try {
            var ct = null;
            params.body = params.body ? JSON.parse(params.body) : null;
            var method = params.body ? params.body.action : null;
            console.log('$$$params', method);
            return (action[method] || action["default"])(params);
        }
        catch (e) {
            return (0, rxjs_1.of)({ data: e });
        }
    },
    sayHi: function (params) {
        return new rxjs_1.Observable(function (observer) {
            observer.next("Hello!");
            observer.complete();
        });
    },
    "default": function (params) {
        return new rxjs_1.Observable(function (observer) {
            console.log('$$$params', params);
            observer.next("Method " + params.action + " not found.");
            observer.complete();
        });
    }
};
//# sourceMappingURL=ieam.js.map