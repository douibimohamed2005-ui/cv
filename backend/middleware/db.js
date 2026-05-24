import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'user_cv',
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
})

pool.getConnection()
    .then(c => { console.log('✓ MySQL connected:', process.env.DB_NAME); c.release() })
    .catch(e => console.error('✗ MySQL error:', e.message))

export default pool