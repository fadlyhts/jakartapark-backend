import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// SSL configuration
const sslConfig = process.env.DB_USE_SSL === 'true' ? {
  ssl: {
    rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED === 'true',
    // If you have CA certificate, uncomment these lines
    // ca: process.env.DB_CA_CERT ? Buffer.from(process.env.DB_CA_CERT, 'base64').toString('ascii') : undefined,
  }
} : {};

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jakartapark_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  queueLimit: 0,
  ...sslConfig
});

export const initializeDatabase = async () => {
  try {
    // Create connection without database selected, with SSL if needed
    const initPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
      queueLimit: 0,
      ...sslConfig
    });

    const dbName = process.env.DB_NAME || 'jakartapark_db';

    // Create database if not exists
    await initPool.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`Database ${dbName} created or already exists`);
    
    // Use the created database
    await initPool.query(`USE ${dbName}`);
    console.log(`Using database ${dbName}`);
    
    // Rest of your code for creating tables...
    // ... (unchanged)

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
