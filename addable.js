import {sql, Login, Op} from './resolver';

export async function checkAddable(name,email){
    await sql.sync();
    let temp =  await getAll(name,email);
    console.log("global"+temp);
    return new Promise((resolve,reject)=>{
      resolve(temp);
    });
  }

 function getAll(name,email){
    return  new Promise((resolve,reject)=>{
      Login.findAll({
          where: {
            [Op.or]: [{'name': name}, {'email': email}]
          }
        }).then((reply)=>{
        console.log(reply.length);
        resolve(reply.length);
      })
    });
  }
