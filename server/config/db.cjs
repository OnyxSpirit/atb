
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
/* import doteven from 'dotenv';

doteven.config();
 */

const dbPath = path.resolve(__dirname,'atb.db')

const db = new sqlite3.Database(dbPath,sqlite3.OPEN_READWRITE,(err)=>{
    if(err) return console.error(err.message);
    else{console.log('Connected')}
})

module.exports =  db;