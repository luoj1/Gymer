import {sql, Login, Op} from './resolver';
import hmacSHA512 from 'crypto-js/hmac-sha512';
import {promisify} from 'util';
import redis from 'redis';
import {generateKey} from './tools.js';

import fs from 'fs';

const client = redis.createClient();
client.on('connect', function() {
    console.log('Connected to Redis');
});
client.on("error", function (err) {
    console.log("Error " + err);
});
const getAsync = promisify(client.hgetall).bind(client);

export async function initRedisSession(name,email,uid,session){
  var pkuid = await readpk('pks/pk-uid.txt');
  var pkkey = await readpk('pks/pk-key.txt');
  var pksession = await readpk('pks/pk-session.txt');
  console.log("puid"+pkuid);
  console.log("pkey"+pkkey);
  var res = await getAsync(hmacSHA512(uid,pkuid).toString());
  if(res == null){
    console.log('res is null');
    //create and append key and session
    var key = generateKey(32);
    client.hmset(hmacSHA512(uid,pkuid).toString(),"key",key,hmacSHA512(session,pksession).toString(),1);
    console.log('hash(uid)'+hmacSHA512(uid,pkuid));
    client.rpush(hmacSHA512(key,pkkey).toString(),name);
    client.rpush(hmacSHA512(key,pkkey).toString(),email);
    client.rpush(hmacSHA512(key,pkkey).toString(),'0');
    client.rpush(hmacSHA512(key,pkkey).toString(),'1');


    console.log('hash(key)'+hmacSHA512(key,pkkey));
    return new Promise((resolve,reject)=>{
      resolve(["initialize first for " + name,hmacSHA512(uid,pkuid).toString()]);
    });
  }else{
    //append hashed session
    client.hmset(hmacSHA512(uid,pkuid).toString(),hmacSHA512(session,pksession).toString(),1);
    return new Promise((resolve,reject)=>{
      resolve(["append session key for "+ name,hmacSHA512(uid,pkuid).toString()]);
    });
  }

}

async function readpk(f){
  var privateKey = await fspk(f);
  return new Promise((resolve,reject)=>{
    resolve(privateKey);
  });
}

function fspk(f){
  return  new Promise((resolve,reject)=>{
    fs.readFile(f,(err, data)=>{
      resolve(data.toString());
    });
  });
}
