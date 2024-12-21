import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'jakartapark_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const initializeDatabase = async () => {
  try {
    // Create connection without database selected
    const initPool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Create database if not exists
    await initPool.query(`CREATE DATABASE IF NOT EXISTS jakartapark_db`);
    console.log('Database jakartapark_db created or already exists');
    
    // Use the created database
    await initPool.query(`USE jakartapark_db`);
    console.log('Using database jakartapark_db');
    
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
    
    // Create parks table if not exists
    const createParksTable = `
      CREATE TABLE IF NOT EXISTS parks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location TEXT NOT NULL,
        openhours VARCHAR(255),
        facilities TEXT,
        description TEXT,
        coordinates VARCHAR(255),
        images VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`;

    // Create damaged_parks table if not exists
    const createDamagedParksTable = `
      CREATE TABLE IF NOT EXISTS damaged_parks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        park_id INT,
        damage_description TEXT NOT NULL,
        reported_by INT NOT NULL,
        status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
        images VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (park_id) REFERENCES parks(id),
        FOREIGN KEY (reported_by) REFERENCES users(id)
      )`;

    // Create repaired_parks table if not exists
    const createRepairedParksTable = `
      CREATE TABLE IF NOT EXISTS repaired_parks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        damaged_park_id INT,
        repair_description TEXT NOT NULL,
        repaired_by INT,
        repair_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        images LONGBLOB,
        FOREIGN KEY (damaged_park_id) REFERENCES damaged_parks(id),
        FOREIGN KEY (repaired_by) REFERENCES users(id)
      )`;

    // Create reviews table if not exists
    const createReviewsTable = `
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        park_id INT,
        user_id INT,
        rating DECIMAL(2,1) CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (park_id) REFERENCES parks(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`;

    // Create blacklisted_tokens table if not exists
    const createBlacklistTable = `
      CREATE TABLE IF NOT EXISTS blacklisted_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token TEXT NOT NULL,
        blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX token_index (id, expires_at)
      )`;

    // Execute table creation queries
    await pool.execute(createUsersTable);
    await pool.execute(createParksTable);
    await pool.execute(createDamagedParksTable);
    await pool.execute(createRepairedParksTable);
    await pool.execute(createReviewsTable);
    await pool.execute(createBlacklistTable);
    
    console.log('All tables initialized successfully');

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};