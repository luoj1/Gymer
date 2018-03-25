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
