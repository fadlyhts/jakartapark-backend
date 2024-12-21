import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

export class UserModel {
    static async findAll() {
        try {
            const [rows] = await pool.query('SELECT id, email, created_at FROM users');
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query('SELECT id, email, created_at FROM users WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async create({ name, email, password }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "user")',
            [name, email, hashedPassword]
        );
        return result.insertId;
    }

    static async createAdmin(userData) {
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const [result] = await pool.query(
                'INSERT INTO users (email, password, role) VALUES (?, ?, "admin")',
                [userData.email, hashedPassword]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async updateRole(userId, role) {
        try {
            await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    static async blacklistToken(token, expiresAt) {
        try {
            await pool.query(
                'INSERT INTO blacklisted_tokens (token, expires_at) VALUES (?, ?)',
                [token, expiresAt]
            );
            return true;
        } catch (error) {
            throw error;
        }
    }

    static async isTokenBlacklisted(token) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM blacklisted_tokens WHERE token = ? AND expires_at > NOW()',
                [token]
            );
            return rows.length > 0;
        } catch (error) {
            throw error;
        }
    }
}

export const createAdmin = async (adminData) => {
    const { email, password, name, role, created_by } = adminData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
        `INSERT INTO users (email, password, name, role, created_by, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [email, hashedPassword, name, role, created_by]
    );

    return result.insertId;
};