const { Observable } = require('rxjs');

class Mms {
  static getObject() {

  }
  static getESSObjectList() {
    const ESS_OBJECT_LIST_BASE = 'curl -sSL -u %s:%s --cacert %s --unix-socket %s https://localhost/api/v1/objects/%s';
  }
}