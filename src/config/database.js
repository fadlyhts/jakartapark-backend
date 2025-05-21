import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// SSL configuration - More explicit configuration for mysql2
const sslOptions = {
  // Force use of TLS 
  ssl: {
    // You can add specific SSL options if needed
    rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED !== 'false'
  }
};

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jakartapark_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  queueLimit: 0,
  // Always enable SSL for this connection
  ...sslOptions
});

export const initializeDatabase = async () => {
  try {
    // Create connection without database selected, with SSL enabled
    const initPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
      queueLimit: 0,
      // Always enable SSL for this connection
      ...sslOptions
    });

    const dbName = process.env.DB_NAME || 'jakartapark_db';

    // Create database if not exists
    await initPool.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`Database ${dbName} created or already exists`);
    
    // Use the created database
    await initPool.query(`USE ${dbName}`);
    console.log(`Using database ${dbName}`);
    
    // Create users table if not exists
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    
    // Rest of your table creation code...
    // [...]

    // Execute table creation queries
    await pool.execute(createUsersTable);
    // Rest of your execute statements...
    
    console.log('All tables initialized successfully');

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
