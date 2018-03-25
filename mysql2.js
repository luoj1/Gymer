var mysql = require('mysql2/promise');
import {promisify} from 'util';
import fs from 'fs';
import {generateKey} from './tools.js'
import {gethkey,getAppointmentStatus,getAppointmentStatusByHkey} from './Appointment.js';
const mysqlpw = main();
console.log('mysqlpw'+mysqlpw);
import redis from 'redis';
const client = redis.createClient();
client.on('connect', function() {
    console.log('Connected to Redis');
});
client.on("error", function (err) {
    console.log("Error " + err);
});
const lrangeAsync = promisify(client.lrange).bind(client);
const hgetAsync = promisify(client.hget).bind(client);

export async function verifyStatus(app){
  var connection = await mysql.createConnection({host:'localhost', user: 'root', database: 'gymer',password:mysqlpw});
  var [row, field] = await  connection.execute('select * from groups where gid=?',[app]);
  if(row[0].end<(new Date).getTime()||row[0].popu == 0){
    return '1';
  }else{
    return app;
  }
}

export async function createAppointment(start,end,content,stadium,master,hkey){
  var connection = await mysql.createConnection({host:'localhost', user: 'root', database: 'gymer',password:mysqlpw});
  var gid = generateKey(32);
  var [row, field] = await connection.execute('insert into groups (gid,content,stadium,start,end,popu) values (?,?,?,?,?,2)',[gid,content,stadium,start,end]);
  await connection.execute('create table ? (hkey varchar(255))',[gid]);
  await connection.execute('insert into ? (list) values (?)',[gid,master]);
  await connection.execute('insert into ? (list) values (?)',[gid,hkey]);
  client.lset(master.toString(),3,gid);
  client.lset(hkey.toString(),3,gid);
  return new Promise((resolve,error)=>{
    resolve(gid);
  })
}

export async function quitAppointment(gid){
  var connection = await mysql.createConnection({host:'localhost', user: 'root', database: 'gymer',password:mysqlpw});
  var [row, field] = await connection.execute('select * from ?',[gid]);
  await connection.execute('update table groups set popu=0 where gid=?',[gid]);
  await connection.execute('drop table ?',[gid]);
  client.lset(row[0].list.toString(),3,'1');
  client.lset(row[1].list.toString(),3,'1');
  return new Promise((resolve,error)=>{
    resolve(1);
  })
}

export async function AddOrUpdateProfile(email,tele, description){
  var connection = await mysql.createConnection({host:'localhost', user: 'root', database: 'gymer',password:mysqlpw});
  console.log("make mysql2");
  var [row, field] = await  connection.execute('select * from profiles where email = ?',[email]);
  console.log("row"+row);
  if (row.length == 0){
    await connection.execute('INSERT INTO profiles (email, tele, description) VALUES(?, ?, ?) ', [email,tele,description]);
  }else{
    await connection.execute('update profiles set tele =?, description=? where email =?', [tele,description,email]);
  }

  return 1;
}

export async function AddStadium(email,stadium ){
  var connection = await mysql.createConnection({host:'localhost', user: 'root', database: 'gymer',password:mysqlpw});

  await connection.execute('INSERT INTO stadia (email, stadium) VALUES(?, ?) ', [email,stadium]);
  return 1;
}
export async function removeAllStadium(email){
    var connection = await mysql.createConnection({host:'localhost', user: 'root', database: 'gymer',password:mysqlpw});
  var [row, field] = await  connection.execute('delete from stadia where email = ?',[email]);
  return 1;
}
export async function getAllProfile(email){
  var connection = await mysql.createConnection({host:'localhost', user: 'root', database: 'gymer',password:mysqlpw});
  var [rowl, fieldl] = await  connection.execute('select name from logins where email = ?',[email]);
  var [rowp, fieldp] = await  connection.execute('select description, tele from profiles where email = ?',[email]);
  var [rows, fields] = await  connection.execute('select stadium from stadia where email = ?',[email]);
  console.log(rowl[0].name);


  let out = {};
  out['name'] = rowl[0].name;
  if(rowp.length !=0){
    console.log(rowp[0].tele);
  out['tele'] = rowp[0].tele;
  out['description'] = rowp[0].description;
  }
  let sarray = [];
  for (let i = 0; i< rows.length;i++){
    console.log(rows[1].stadium);
  sarray.push(rows[i].stadium);
  }
  out['stadium'] = sarray;
  return new Promise((resolve,error)=>{
    resolve(out);
  });
}

export async function updateUserLocation(hkey,lat,lon){
  var connection = await mysql.createConnection({host:'localhost', user: 'root', database: 'gymer',password:mysqlpw});

  var [row, field] = await  connection.execute('select * from locations where email = ?',[hkey]);
  if (row.length == 0){
    await  connection.execute('insert into locations (email,lat,lon) values (?,?,?)',[hkey,lat,lon]);
  }else{
    await connection.execute('update locations set lat =?, lon=? where email =?',[lat,lon,hkey]);
  }
  return 1;
}

export async function findAround(lat,lon,uid){
  var connection = await mysql.createConnection({host:'localhost', user: 'root', database: 'gymer',password:mysqlpw});
  var latrange = [lat-0.01, lat+0.01];
  latrange = latrange.sort();
  var lonrange = [lon-0.01, lon+0.01];
  lonrange = lonrange.sort();
  var [row, field] = await connection.execute('select * from locations where lat<? and lat>? and lon<? and lon>? and lat !=? and lon !=? ',[latrange[1],latrange[0],lonrange[1],lonrange[0],lat,lon]);

  var chart = generateKey(32);
  var out = {lat: [], lon: [], cid: []};
  for (var i = 0; i < row.length; i++){
    var app = await getAppointmentStatus(row[i].email,uid);
    if(app == '1'){
    client.hmset(chart,i,row[i].email);
    console.log(i);
    out.lat.push(row[i].lat);
    out.lon.push(row[i].lon);
    out.cid.push(i);
  }
  }
  var hkey = await gethkey(uid);

  var [checkchart] = await lrangeAsync(hkey,2,2);
  console.log(checkchart);
  if(checkchart != '0'){
    client.del(checkchart);
  }
  client.lset(hkey,2,chart.toString());
  //out['chart']=chart;
  return new Promise((resolve,error)=>{
    resolve(out);
  });
}

export async function findCharacterByLocation(cid,uid){
  var hkey = await gethkey(uid);
  var [chart] = await lrangeAsync(hkey,2,2);
  if(chart != '0'){
   var character = await hgetAsync(chart,cid);
 }
 return new Promise((resolve,error)=>{
   resolve(character);
 });
}

function main() {
  // get the client
  let {mysqlun,mysqlpw} = JSON.parse(fs.readFileSync('pws/pw.json', 'utf8'));
  // create the connection

  // query database
  return mysqlpw;
}
