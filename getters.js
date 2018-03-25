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
const lrangeAsync = promisify(client.lrange).bind(client);

export async function getEmailRedis(uid){
  var res = await getAsync(uid);
  var pkkey = await readpk('pks/pk-key.txt');
  let key = hmacSHA512(res.key,pkkey);
  var email = await lrangeAsync(key.toString(),1,1);
  console.log(email);
  return new Promise((resolve,reject)=>{
    resolve(email);
  });
}
export async function getEmailRedisByHkey(hkey){

  var email = await lrangeAsync(hkey.toString(),1,1);
  console.log(email);
  return new Promise((resolve,reject)=>{
    resolve(email);
  });
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
