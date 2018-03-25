import redis from 'redis';
import Sequelize from 'sequelize';
import hmacSHA512 from 'crypto-js/hmac-sha512';
import {checkAddable} from './addable.js';
import {initRedisSession} from './setUpRedis.js';
import {checkRedis,testSession} from './checkRedis.js';
import {verify} from './verification.js';
import {generateKey, validateEmail} from './tools.js';
import {getEmailRedis,getEmailRedisByHkey} from './getters.js';
import {gethkey} from './Appointment.js';
import {AddOrUpdateProfile,AddStadium,removeAllStadium,getAllProfile,
          findAround,updateUserLocation,findCharacterByLocation} from './mysql2.js';
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
export const Profile = sql.define('profile', {
  email: Sequelize.STRING,
  tele: Sequelize.STRING,
  description:Sequelize.STRING
}, {
  timestamps: false
});
export const Stadium = sql.define('stadium', {
  email: Sequelize.STRING,
  stadium: Sequelize.STRING,
  lon: Sequelize.INTEGER,
  lat: Sequelize.INTEGER
}, {
  timestamps: false
});

export const Location = sql.define('location', {
  key: Sequelize.STRING,
  lon: Sequelize.FLOAT,
  lat: Sequelize.FLOAT
}, {
  timestamps: false
});

export const Op = Sequelize.Op;
const client = redis.createClient();


var privateKey = '?';
readpk('pks/pk.txt');

const root = {
  test: ({query}) => {
    console.log("receive" + query);
    return query;
  },
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
  TestSession: async ({uid,sid})=>{let x = await testSession(uid,sid,0); return x},
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
},

setProfile: async ({uid, sid, tele, description,stadium})=>{
  var status = await checkRedis(uid,sid,0);
  if(status == 'false'){
    console.log("setProfile"+"false");
    return 0;
  }else{
    if (tele == null || description == null || stadium == null){
      return 0;
    }
    var email = await getEmailRedis(uid);
  await AddOrUpdateProfile(email[0], tele, description);
  console.log("remove");
  await removeAllStadium(email[0]);
  for(var i = 0;i<stadium.length;i++){
  console.log("add");
  await AddStadium(email[0], stadium[i]);
}
  }

return 1;
},
getProfile: async ({uid, sid})=>{
  var status = await checkRedis(uid,sid,0);
  if(status == 'false'){
    console.log("setProfile"+"false");
    return null;
  }else{
    var [email] = await getEmailRedis(uid);
    let out = await getAllProfile(email);
    out['email']=email;
    return out;
  }
},
makeAppointment: async ({uid, sid, stadium, start, end, content,cid})=>{
  var status = await checkRedis(uid,sid,0);
  if(status == 'false'){
    console.log("setProfile"+"false");
    return 0;
  }
  var hkey = await findCharacterByLocation(cid, uid);
  let lastcheck = await getAppointmentStatusByHkey(hkey);
  if(lastcheck == '1'){
  await appointmentSetup(uid,hkey,stadium, start, end, content);
  return 1;
}
return 0;
},
/*joinAppointment: async ({uid, sid, statdium, content})=>{
  var status = await checkRedis(uid,sid,0);
  if(status == 'false'){
    console.log("setProfile"+"false");
    return null;
  }

  return null;
},*/
getMyApp: async ({uid,sid})=>{
  var status = await checkRedis(uid,sid,0);
  if(status == 'false'){
    console.log("setProfile"+"false");
    return 0;
  }
  var hkey = await gethkey(uid);
  let check = await getAppointmentStatusByHkey(hkey);
  return check;
},
quitAppointment: async ({uid,sid})=>{
  var status = await checkRedis(uid,sid,0);
  if(status == 'false'){
    console.log("setProfile"+"false");
    return 0;
  }
  var hkey = await gethkey(uid);
  let gid = await getgid(hkey);
  await quitAppointment(gid);
  return 1;
},
getTarget: async ({uid, sid, lat, lon}) => {
  var status = await checkRedis(uid,sid,0);
  if(status == 'false'){
    console.log("setProfile"+"false");
    return 0;
  }
  var dest = await findAround(lat, lon,uid);
  return dest;
},
updateLocation: async ({uid,sid,lat,lon})=>{
  var status = await checkRedis(uid,sid,0);
  if(status == 'false'){
    console.log("setProfile"+"false");
    return 0;
  }
  let key = await gethkey(uid);
  await updateUserLocation(key,lat,lon);
  return 1;
},
findPeople: async ({uid,sid, cid})=>{
  var status = await checkRedis(uid,sid,0);
  if(status == 'false'){
    console.log("setProfile"+"false");
    return 0;
  }
  var hkey = await findCharacterByLocation(cid, uid);
  if (hkey != null){
    var [email] = await getEmailRedisByHkey(hkey);
    var app = await getAppointmentStatusByHkey(hkey);
    var profile = await getAllProfile(email);
    profile['app'] = app;
    return profile;
  }else{
    return 0;
  }

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
