import mysql from 'mysql';
import doteven from 'dotenv';

doteven.config();

const db = mysql.createConnection({
    host:'cv1vlj.myd.infomaniak.com',
    user:'cv1vlj_atb_user',
    password:'JesusChrist_5',
    database:'cv1vlj_atb'
});
/*
host: process.env.VITE_HOST || 'cv1vlj.myd.infomaniak.com',
    user:process.env.VITE_USER || 'cv1vlj_atb_user',
    password:process.env.VITE_PASSWORD || 'JesusChrist_5',
    database:process.env.VITE_DATABASE || 'cv1vlj_atb'
*/
export default db;
