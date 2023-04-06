import { HznParams } from './hzn-params';

export interface LdapParams extends HznParams {
  ibmid: string;
  org: string;
  baseDN: string;
  fname: string;
  lname: string;
  company: string;
}