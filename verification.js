import {sql, Login, Op,hashpw} from './resolver';

export async function verify (email,pw){
  await sql.sync();
  let temp =  await check(email,pw);
  console.log("verify"+temp);
  if(temp.length == 1 /*&& temp[0].uid.length == 32*/){
    temp = temp[0];
  }else{
    temp = 0;
  }
  return new Promise((resolve,reject)=>{
    resolve(temp);
  });
}

function check(email,pw){
  return  new Promise((resolve,reject)=>{
    Login.findAll({
        where: {
          [Op.and]: [{'email': email}, {'pw': hashpw(pw).toString()}]
        }
      }).then((reply)=>{
      console.log("verifycheck"+reply.length);
      resolve(reply);
    })
  });
}
