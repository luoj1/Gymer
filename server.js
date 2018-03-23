import express from 'express';
import { graphql, buildSchema } from 'graphql';
import typedef from  './schema.js';
import root from './resolver.js';
import bodyParser from 'body-parser';
import url from 'url';
var schema = buildSchema(typedef);
const app = express();

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); //


app.get('/test', (req,res)=>{
  //console.log();
  query(req.query.q,(p)=>{
    p.then((reply)=>{
  res.send(reply);
},
()=>{
  res.send('wrong');
});

})

})

app.listen(3000,()=>{
  console.log("connect to 3000");
})


function query(q,cb){
  graphql(schema, q , root).then((response) => {
  cb(new Promise((resolve,reject)=>{
    if (response != null){
    resolve(response);
  }else{
    reject();
  }
  })
)
});
}
