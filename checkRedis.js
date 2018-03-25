import {promisify} from 'util';
import hmacSHA512 from 'crypto-js/hmac-sha512';
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

export async function testSession(uid,sid,change){
  var status = await checkRedis(uid,sid,change);
  console.log("status"+status);
  if (status == 'false'){
    return new Promise((resolve,reject)=>{
      resolve({uid:'false', sid:'false'});
    });
  } else{
    return new Promise((resolve,reject)=>{
      resolve({uid: uid, sid: status});
    });
  }
}

export async function checkRedis(uid,sid,change){
  var res = await getAsync(uid);
  var pksession = await readpk('pks/pk-session.txt');
  if(res == null){
    console.log('null uid');
    return 'false';
  }else{
  if(res[hmacSHA512(sid,pksession).toString()]==1){
    if(change == 1){
    let session = generateKey(64).toString();
    client.hdel(uid,hmacSHA512(sid,pksession).toString());
    client.hmset(uid,hmacSHA512(session,pksession).toString(),1);
    return session;
  }
    return sid;
  }else{
    return 'false';
  }
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
