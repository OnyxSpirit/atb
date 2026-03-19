import mysql from 'mysql';
import dotenv from 'dotenv';
dotenv.config();

const db = mysql.createConnection({
    host: process.env.VITE_HOST,
    user:process.env.VITE_USER,
    password:process.env.VITE_PASSWORD,
    database:process.env.VITE_DATABASE'
    
});

export default db;
