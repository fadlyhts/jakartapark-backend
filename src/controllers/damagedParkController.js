import { pool } from '../config/database.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/damages');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Log the upload directory path
console.log('Upload directory:', UPLOAD_DIR);

// Create upload directory if it doesn't exist
try {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  console.log('Upload directory ready');
} catch (err) {
  if (err.code !== 'EEXIST') {
    console.error('Error creating upload directory:', err);
  } else {
    console.log('Upload directory already exists');
  }
}

export const getAllDamagedParks = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT dp.*, u.email as reporter_email, p.name as park_name
      FROM damaged_parks dp 
      LEFT JOIN users u ON dp.reported_by = u.id
      LEFT JOIN parks p ON dp.park_id = p.id
      ORDER BY dp.created_at DESC`
    );

    const transformedRows = rows.map(row => {
      const transformed = { ...row };
      if (row.images) {
        const imageName = Buffer.isBuffer(row.images) ? row.images.toString() : row.images;
        transformed.imageUrl = `${BASE_URL}/public/uploads/damages/${imageName}`;
        delete transformed.images;
      }
      return transformed;
    });

    res.json({ status: 'success', data: transformedRows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getDamagedParkById = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT dp.*, u.email as reporter_email, p.name as park_name
      FROM damaged_parks dp 
      LEFT JOIN users u ON dp.reported_by = u.id
      LEFT JOIN parks p ON dp.park_id = p.id
      WHERE dp.id = ?`, 
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Damaged park report not found' 
      });
    }

    // Transform image path to URL
    const transformedRow = { ...rows[0] };
    if (transformedRow.images) {
      const imageName = Buffer.isBuffer(transformedRow.images) ? transformedRow.images.toString() : transformedRow.images;
      transformedRow.imageUrl = `${BASE_URL}/public/uploads/damages/${imageName}`;
    } else {
      transformedRow.imageUrl = null;
    }
    delete transformedRow.images;

    return res.status(200).json({ 
      status: 'success', 
      data: transformedRow
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

export const reportDamagedPark = async (req, res) => {
  try {
    const { park_id, damage_description } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'User authentication required' 
      });
    }

    if (!park_id || !damage_description) {
      return res.status(400).json({
        status: 'error',
        message: 'Park ID and damage description are required'
      });
    }

    const [parkExists] = await pool.query('SELECT id FROM parks WHERE id = ?', [park_id]);
    if (parkExists.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Park not found'
      });
    }

    let imageName = null;
    if (req.files && req.files.images) {
      const image = req.files.images;
      imageName = `${Date.now()}-${image.name}`;
      const uploadPath = path.join(UPLOAD_DIR, imageName);
      console.log('Saving image to:', uploadPath);
      try {
        await image.mv(uploadPath);
        console.log('Image saved successfully');
        // Verify file exists
        const stats = await fs.stat(uploadPath);
        console.log('File size:', stats.size);
      } catch (err) {
        console.error('Error saving image:', err);
        throw err;
      }
    }

    const [result] = await pool.query(
      'INSERT INTO damaged_parks (park_id, damage_description, reported_by, images, status) VALUES (?, ?, ?, ?, ?)',
      [park_id, damage_description, req.user.id, imageName, 'pending']
    );

    // Fetch the created report with user info
    const [createdReport] = await pool.query(
      `SELECT dp.*, u.email as reporter_email 
       FROM damaged_parks dp
       LEFT JOIN users u ON dp.reported_by = u.id
       WHERE dp.id = ?`,
      [result.insertId]
    );

    const responseData = {
      ...createdReport[0],
      imageUrl: imageName ? `${BASE_URL}/public/uploads/damages/${imageName}` : null
    };
    delete responseData.images; // Remove the images field from response

    res.status(201).json({
      status: 'success',
      message: 'Damage reported successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error in reportDamagedPark:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Internal server error'
    });
  }
};

export const updateDamagedParkStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('Updating status:', { id, status });

    const [park] = await pool.query(
      'SELECT * FROM damaged_parks WHERE id = ?',
      [id]
    );

    if (park.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Damaged park report not found'
      });
    }

    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be one of: pending, in_progress, completed'
      });
    }

    const [result] = await pool.query(
      'UPDATE damaged_parks SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Failed to update status');
    }

    res.json({
      status: 'success',
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update status'
    });
  }
};

export const deleteDamagedPark = async (req, res) => {
  try {
    // Get the image filename before deleting the record
    const [park] = await pool.query('SELECT images FROM damaged_parks WHERE id = ?', [req.params.id]);
    
    if (park.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Damage report not found'
      });
    }

    if (park[0].images) {
      // Delete the image file
      try {
        const imageName = Buffer.isBuffer(park[0].images) ? park[0].images.toString() : park[0].images;
        const imagePath = path.join(UPLOAD_DIR, imageName);
        console.log('Deleting image:', imagePath);
        await fs.unlink(imagePath);
        console.log('Image deleted successfully');
      } catch (err) {
        console.error('Error deleting image file:', err);
      }
    }

    await pool.query('DELETE FROM damaged_parks WHERE id = ?', [req.params.id]);
    res.json({ status: 'success', message: 'Damage report deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const searchDamagedParks = async (req, res) => {
  try {
    const { status, park_id } = req.query;
    let query = `
      SELECT dp.*, u.email as reporter_email, p.name as park_name
      FROM damaged_parks dp 
      LEFT JOIN users u ON dp.reported_by = u.id
      LEFT JOIN parks p ON dp.park_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND dp.status = ?';
      params.push(status);
    }
    if (park_id) {
      query += ' AND dp.park_id = ?';
      params.push(park_id);
    }

    const [rows] = await pool.query(query, params);

    // Transform image paths to URLs
    const transformedRows = rows.map(row => {
      const transformed = { ...row };
      if (row.images) {
        const imageName = Buffer.isBuffer(row.images) ? row.images.toString() : row.images;
        transformed.imageUrl = `${BASE_URL}/public/uploads/damages/${imageName}`;
        delete transformed.images;
      }
      return transformed;
    });

    res.json({ status: 'success', data: transformedRows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getMyDamagedParks = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT dp.*, u.email as reporter_email, p.name as park_name
       FROM damaged_parks dp 
       LEFT JOIN users u ON dp.reported_by = u.id
       LEFT JOIN parks p ON dp.park_id = p.id
       WHERE dp.reported_by = ?`,
      [userId]
    );

    // Transform image paths to URLs
    const transformedRows = rows.map(row => {
      const transformed = { ...row };
      if (row.images) {
        transformed.imageUrl = `${BASE_URL}/public/uploads/damages/${row.images}`;
        delete transformed.images;
      }
      return transformed;
    });

    res.json({ status: 'success', data: transformedRows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
