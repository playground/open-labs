import { Observable, of, forkJoin } from 'rxjs';
import { existsSync, accessSync, chmod, constants, renameSync, copyFileSync, unlinkSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { Params } from '@common/params/params';
import * as http from 'http';
import * as os from 'os';
import * as cryptoJS from 'crypto-js';
import * as ethers from 'ethers';
const ifs: any = os.networkInterfaces();
import * as jsonfile from 'jsonfile';

export const util = {
  passPhrase: 'iEAM&openHoriZon',
  sessionToken: 'geTSesSiontOkEnfOrvAliDation',
  encrypt: (text: string) => {
    return cryptoJS.enc.Base64.stringify(cryptoJS.enc.Utf8.parse(text));
  },
  decrypt: (data: string) => {
    return cryptoJS.enc.Base64.parse(data).toString(cryptoJS.enc.Utf8);
  },
  encryptAES: (text: string = util.sessionToken + Date.now()) => {
    const ciphertext = cryptoJS.AES.encrypt(text, util.passPhrase).toString()
    return ciphertext;
  },
  decryptAES: (cipherText: string) => {
    const decrypted = cryptoJS.AES.decrypt(cipherText, util.passPhrase)
    let originalText = ''
    if(decrypted) {
      originalText = decrypted.toString(cryptoJS.enc.Utf8);
    }
    return originalText;
  },
  validateSession: (sessionId: string) => {
    const seed = util.decryptAES(sessionId, util.passPhrase)
    return Date.now() - parseInt(seed.substring(util.sessionToken.length)) < 300000;
  },
  signature: (params: Params) => {
    return new Observable((observer) => {
      const claimedAddr = params.addr
      let error = "", realAddr = ""
      try {
        const seed = util.decryptAES(params.sessionId, util.passPhrase)
        // console.log('sessionId: ', queryString.sessionId)
        // console.log('seed', seed, util.sessionToken, seed.indexOf(util.sessionToken))
        if(seed.indexOf(util.sessionToken) == 0) {
          const expectedMsg = `My session ID: ${params.sessionId}`
          const hash = ethers.utils.id(`\x19Ethereum Signed Message:\n${expectedMsg.length}${expectedMsg}`)
          realAddr = ethers.utils.recoverAddress(hash, params.sig)
        } else {
          error = `Invalid sessionId: ${params.sessionId}`
        }
      } catch (err) {
        error = err.reason
      }

      if (error)  {
        observer.error({msg: error})
      } else {
        if (realAddr.toLowerCase() === claimedAddr.toLowerCase()) {
          observer.next({msg: `Legitimate, welcome ${realAddr}`, valid: true})
          observer.complete()
        } else {
          observer.error({msg: `Fraud!!! You are not ${claimedAddr}, you are ${realAddr}!`})
        }
      }
    });
  },
  checkLeapYear: (year: number) => {
    //three conditions to find out the leap year
    if ((0 == year % 4) && (0 != year % 100) || (0 == year % 400)) {
      console.log(year + ' is a leap year');
      return true;
    } else {
      console.log(year + ' is not a leap year');
      return false;
    }
  },
  timeDifference: (date1: Date, date2: Date) => {
    let difference = date1.getTime() - date2.getTime();
    let daysDifference = Math.floor(difference/1000/60/60/24);

    difference -= daysDifference*1000*60*60*24
    let hoursDifference = Math.floor(difference/1000/60/60);

    difference -= hoursDifference*1000*60*60
    let minutesDifference = Math.floor(difference/1000/60);

    difference -= minutesDifference*1000*60
    let secondsDifference = Math.floor(difference/1000);

    // NOTE for debugging
    // console.log('difference = ' +
    //   daysDifference + ' day/s ' +
    //   hoursDifference + ' hour/s ' +
    //   minutesDifference + ' minute/s ' +
    //   secondsDifference + ' second/s ');
    return {days: daysDifference, hours: hoursDifference, minutes: minutesDifference, seconds: secondsDifference}
  },
  shallowEqual: (obj1: any, obj2: any) => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
      return false;
    }
    let diff = false
    keys1.some((key) => {
      diff = obj1[key] !== obj2[key]
      return diff
    })
    return !diff;
  },
  getIpAddress: () => {
    return Object.keys(ifs)
    .map(x => [x, ifs[x].filter(x => x.family === 'IPv4')[0]])
    .filter(x => x[1])
    .map(x => x[1].address);
  }
}
