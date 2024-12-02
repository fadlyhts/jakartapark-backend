import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/userModel.js';
import { pool } from '../config/database.js';  // Add this import

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email already registered' });
    }

    // Make sure UserModel.create is called with parameters in the correct order
    // Assuming the database table columns are in order: name, email, password
    const userId = await UserModel.create({ name, email, password });
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      status: 'success',
      data: { token, userId, name }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email and password are required' 
      });
    }

    const user = await UserModel.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid credentials' 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { 
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      status: 'success',
      data: { 
        token,
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'No token provided' 
      });
    }

    // Get token expiration from JWT
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    // Add token to blacklist
    await UserModel.blacklistToken(token, expiresAt);

    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email already registered' 
      });
    }

    const adminData = {
      name,
      email,
      password,
      role: 'admin'
    };

    const adminId = await UserModel.createAdmin(adminData);
    
    res.status(201).json({
      status: 'success',
      message: 'Admin registered successfully',
      data: { 
        adminId,
        name,
        email,
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

export const registerFirstAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if any admin exists
    const [existingAdmin] = await pool.query(
      'SELECT * FROM users WHERE role = "admin"'
    );

    if (existingAdmin.length > 0) {
      return res.status(403).json({
        status: 'error',
        message: 'Admin already exists. Use register-admin endpoint for additional admins.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create first admin with name
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "admin")',
      [name, email, hashedPassword]
    );

    res.status(201).json({
      status: 'success',
      message: 'First admin registered successfully',
      data: {
        id: result.insertId,
        name,
        email,
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, name, email, role, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({
      status: 'success',
      data: users
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [user] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent deleting own account or other admins
    if (req.user.id === parseInt(id) || (user[0].role === 'admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot delete this user'
      });
    }

    // Delete user
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, currentPassword, newPassword } = req.body;

    // Get current user data
    const [user] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user[0].email) {
      const [existingUser] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      
      if (existingUser.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already in use'
        });
      }
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password is required to set new password'
        });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user[0].password);
      if (!isValidPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }
    }

    // Prepare update data
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (newPassword) {
      updates.push('password = ?');
      values.push(await bcrypt.hash(newPassword, 10));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No updates provided'
      });
    }

    // Add userId to values array
    values.push(userId);

    // Update user data
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        name: name || user[0].name,
        email: email || user[0].email
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};