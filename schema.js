
import {buildSchema} from 'graphql';
const typedef = `
  type Query {
    login(email:String, pw:String):Sess
    TestSession(uid:String ,sid:String ):Sess
    getProfile(info:String):test
    makeAGroup(info:String):test
    setAccount(name: String, email: String, pw: String): Int
  }
  type test{
    stuff: String
  }
  type Sess{
    uid: String
    sid: String
  }
`;

export default typedef;
