
import {buildSchema} from 'graphql';
const typedef = `
  type Query {
    test(query: String):String
    login(email:String, pw:String):Sess
    TestSession(uid:String ,sid:String ):Sess
    setProfile(uid:String, sid:String, tele:String, description:String,stadium:[String]):Int
    getProfile(uid:String, sid:String):Profile
    setAccount(name: String, email: String, pw: String): Int
    getTarget(uid: String ,sid: String, lat: Float, lon:Float): locations
    updateLocation(uid: String ,sid: String, lat: Float, lon:Float): Int
    findPeople(uid: String,sid: String,cid: Int):Profile
    quitAppointment(uid: String,sid: String):Int
    getMyApp(uid: String,sid: String):String
    makeAppointment(uid:String, sid:String, stadium:String, start:String, end:String, content:String,cid:String):Int
  }
  type locations{
    lat: [Float]
    lon: [Float]
    cid: [Int]
  }
  type test{
    stuff: String
  }
  type Sess{
    uid: String
    sid: String
  }
  type Profile{
    name: String
    email: String
    stadium: [String]
    tele: String
    description:String
    app:String
  }
`;

export default typedef;
