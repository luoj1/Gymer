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
//const existsAsync = promisify(client.exists).bind(client);

export async function getgid(hkey){
  let [app] = lrangeAsync(key.toString(),3,3);
  return new Promise((resolve,error)=>{
    resolve(app);
  });
}

export async function getAppointmentStatus(uid){
  let list = client.getAsync(uid);
  let res  = list['key'];
  let pkkey = await readpk('pks/pk-key.txt');
  let key = hmacSHA512(res,pkkey);
  let [app] = await lrangeAsync(key.toString(),3,3);
  return new Promise((resolve,error)=>{
    resolve(app);
  });
}

export async function getAppointmentStatusByHkey(hkey){

  let [app] = await lrangeAsync(hkey.toString(),3,3);
  if (app!= '1'&&app!= '0'){
    var check = await verifyStatus(app);
    app = check;
    if(app == '1'){
      client.lset(hkey.toString(),3,'1');
    }

  }
  return new Promise((resolve,error)=>{
    resolve(app);
  });
}
export async function gethkey(uid){
  let list = await getAsync(uid);
  let res  = list['key'];
  let pkkey = await readpk('pks/pk-key.txt');
  let key = hmacSHA512(res,pkkey).toString();
  return new Promise((resolve,error)=>{
    resolve(key);
  });
}

export async function appointmentSetup(uid,hkey,stadium, start, end, content){
  var master = await gethkey(uid);
  var gid = await createAppointment(start,end,content,stadium,master,hkey);
  return new Promise((resolve, error)=>{
    resolve(gid);
  });
}



//get
/*export async function makeAppointment(hkey,another){
  let status = await getAppointmentStatusByHkey(another);
  if(status == '0'){
    return '0';
  }
  if(status == '1'){
    let gid = generateKey(32);
    await createNewGroup(2,gid,purpose,start,end,stadium);

    client.expireat(gid,end);
    return gid;
  }else{
    if(time)
    let popu= await getAsync(gid);
    client.set(gid, popu+1);
    return gid;
  }


}*/

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
