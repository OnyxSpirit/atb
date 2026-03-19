import mysql from 'mysql';
import doteven from 'dotenv';

doteven.config();

const db = mysql.createConnection({
    host:'http://sql206.ezyro.com/',
    user:'ezyro_41219582',
    password:'JesusChrist_5',
    database:'ezyro_41219582_atb'
});
/*
host: process.env.VITE_HOST || 'cv1vlj.myd.infomaniak.com',
    user:process.env.VITE_USER || 'cv1vlj_atb_user',
    password:process.env.VITE_PASSWORD || 'JesusChrist_5',
    database:process.env.VITE_DATABASE || 'cv1vlj_atb'
*/
export default db;
