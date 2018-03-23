import redis from 'redis';
import Sequelize from 'sequelize';
import hmacSHA512 from 'crypto-js/hmac-sha512';
import {checkAddable} from './addable.js';
import {initRedisSession} from './setUpRedis.js';
import {checkRedis,testSession} from './checkRedis.js';
import {verify} from './verification.js';
import {generateKey, validateEmail} from './tools.js';
import fs from 'fs';

var {mysqlun,mysqlpw} = JSON.parse(fs.readFileSync('pws/pw.json', 'utf8'));

export const sql = new Sequelize('gymer', mysqlun, mysqlpw, {
  host: 'localhost',
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export const Login = sql.define('login', {
  name: Sequelize.STRING,
  email: Sequelize.STRING,
  pw: Sequelize.STRING,
  uid:Sequelize.STRING
}, {
  timestamps: false
});
export const Op = Sequelize.Op;
const client = redis.createClient();


var privateKey = '?';
readpk('pks/pk.txt');

const root = {
  login: async ({email,pw}) => {
    let reply = await verify(email,pw);
    if (reply != 0){
      let session = generateKey(64).toString();
      //--redis operation--
      var status = await initRedisSession(reply.name,reply.email,reply.uid,session);
      //------------------
      console.log(status);
      console.log(session);
      return {uid:status[1],sid:session};
    }else{
      return {uid:'false',sid:'false'};
    }

  },
  TestSession: async ({uid,sid})=>{let x = await testSession(uid,sid); return x},
  setAccount: async ({name, email, pw})=>{
    if(name.length>255|| email.length>255 || !validateEmail(email)||pw.length<10){
      return 2;
    }
    var result = 2;
  var reply=await checkAddable(name,email);
  console.log("reply"+reply);
  if(reply==0){
    Login.build(
          {name: name, email: email, pw:hashpw(pw).toString(),uid: generateKey(32)},
        ).save().then(() => {

          });
    result = 1;
  }else{
    result = 0;
  }
  console.log(result);
  return result;
  }

};


function checktoken(sth){
  let sid = sth.sid;
  //let hmacDigest = Base64.stringify(hmacSHA512(sth.user+sth.purpose+sugar, privateKey));
  client.get(sid,(res,err)=>{
  return new Promise (function(resolve, reject){
    if (res.length > 0){
      resolve();
    }else{
      reject();
    }
  })
  });
}
export function hashpw(pw){
  return hmacSHA512(pw,privateKey);
}

async function readpk(f){
  privateKey = await fspk(f);
  console.log('privatekey:'+ privateKey);
}

function fspk(f){
  return  new Promise((resolve,reject)=>{
    fs.readFile(f,(err, data)=>{
      resolve(data.toString());
    });
  });
}



export default root;
