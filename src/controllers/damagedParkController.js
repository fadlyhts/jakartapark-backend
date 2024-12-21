import { pool } from '../config/database.js';

export const getAllDamagedParks = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT dp.*, u.email as reporter_email 
      FROM damaged_parks dp 
      LEFT JOIN users u ON dp.reported_by = u.id
      ORDER BY dp.created_at DESC`
    );
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getDamagedParkById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM damaged_parks WHERE id = ?', [req.params.id]);
    
    // Always return 200 with empty array if not found
    if (rows.length === 0) {
      return res.status(200).json({ 
        status: 'success', 
        data: [],
        message: 'Damaged park report not found' 
      });
    }

    return res.status(200).json({ 
      status: 'success', 
      data: [rows[0]]  // Wrap single item in array
    });
  } catch (error) {
    return res.status(200).json({ 
      status: 'success', 
      data: [],
      error: error.message 
    });
  }
};

export const reportDamagedPark = async (req, res) => {
  try {
    const { park_id, damage_description } = req.body;
    
    // Enhanced authentication check
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'User authentication required' 
      });
    }

    // Validate required fields
    if (!park_id || !damage_description) {
      return res.status(400).json({
        status: 'error',
        message: 'Park ID and damage description are required'
      });
    }

    // Verify park exists before reporting damage
    const [parkExists] = await pool.query('SELECT id FROM parks WHERE id = ?', [park_id]);
    if (parkExists.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Park not found'
      });
    }

    let imageBuffer = null;
    if (req.files && req.files.images) {
      const imageFile = Array.isArray(req.files.images) 
        ? req.files.images[0] 
        : req.files.images;
      imageBuffer = imageFile.data;
    }

    const [result] = await pool.query(
      'INSERT INTO damaged_parks (park_id, damage_description, reported_by, images, status) VALUES (?, ?, ?, ?, ?)',
      [park_id, damage_description, req.user.id, imageBuffer, 'pending']
    );

    const [newReport] = await pool.query(
      `SELECT dp.*, u.email as reporter_email 
       FROM damaged_parks dp 
       LEFT JOIN users u ON dp.reported_by = u.id 
       WHERE dp.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ 
      status: 'success', 
      message: 'Damage reported successfully', 
      data: newReport[0]
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
    const { status } = req.body;
    await pool.query('UPDATE damaged_parks SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ status: 'success', message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteDamagedPark = async (req, res) => {
  try {
    await pool.query('DELETE FROM damaged_parks WHERE id = ?', [req.params.id]);
    res.json({ status: 'success', message: 'Damage report deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const searchDamagedParks = async (req, res) => {
  try {
    const { status, park_id } = req.query;
    let query = 'SELECT * FROM damaged_parks WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (park_id) {
      query += ' AND park_id = ?';
      params.push(park_id);
    }

    const [rows] = await pool.query(query, params);
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getMyDamagedParks = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT * FROM damaged_parks WHERE reported_by = ?',
      [userId]
    );
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateDamagedPark = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // First check if damaged park exists
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

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be one of: pending, in_progress, completed'
      });
    }

    // Update the status
    await pool.query(
      'UPDATE damaged_parks SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({
      status: 'success',
      message: 'Damaged park status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};