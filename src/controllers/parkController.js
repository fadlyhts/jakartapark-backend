import { pool } from '../config/database.js';

export const getAllParks = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM parks WHERE status = "active"');
    res.json({
      status: 'success',
      data: rows,
      count: rows.length
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

export const getParkById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM parks WHERE id = ? AND status = "active"',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Park not found'
      });
    }

    res.json({
      status: 'success',
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

export const formatFacilities = (facilities) => {
  if (typeof facilities === 'string') {
    try {
      // If it's a JSON string, parse it
      facilities = JSON.parse(facilities);
    } catch (e) {
      // If parsing fails, treat it as a single facility
      facilities = [facilities];
    }
  }
  // Ensure facilities is an array
  facilities = Array.isArray(facilities) ? facilities : [facilities];
  return JSON.stringify(facilities);
};

export const createPark = async (req, res) => {
  try {
    const { name, location, openhours, facilities, description, coordinates } = req.body;
    
    // Format facilities properly
    const formattedFacilities = formatFacilities(facilities);
    
    let imageBuffer = null;
    if (req.files && req.files.images) {
      imageBuffer = req.files.images.data;
    }

    const [result] = await pool.query(
      `INSERT INTO parks (name, location, openhours, facilities, description, coordinates, images) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, location, openhours, formattedFacilities, description, coordinates, imageBuffer]
    );

    res.status(201).json({
      status: 'success',
      message: 'Park created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

export const updatePark = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    const [park] = await pool.query(
      'SELECT * FROM parks WHERE id = ?',
      [id]
    );

    if (park.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Park not found'
      });
    }

    const updates = [];
    const values = [];

    Object.keys(updateFields).forEach(key => {
      if (key === 'facilities') {
        updates.push(`${key} = ?`);
        values.push(formatFacilities(updateFields[key]));
      } else {
        updates.push(`${key} = ?`);
        values.push(updateFields[key]);
      }
    });

    if (req.files && req.files.images) {
      updates.push('images = ?');
      values.push(req.files.images.data);
    }

    values.push(id);

    await pool.query(
      `UPDATE parks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      status: 'success',
      message: 'Park updated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

export const deletePark = async (req, res) => {
  try {
    const { id } = req.params;

    const [park] = await pool.query(
      'SELECT * FROM parks WHERE id = ?',
      [id]
    );

    if (park.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Park not found'
      });
    }

    // Soft delete by updating status to inactive
    await pool.query(
      'UPDATE parks SET status = "inactive" WHERE id = ?',
      [id]
    );

    res.json({
      status: 'success',
      message: 'Park deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

export const searchParks = async (req, res) => {
  try {
    const { query, location, facilities } = req.query;
    let sqlQuery = 'SELECT * FROM parks WHERE status = "active"';
    const params = [];

    if (query) {
      sqlQuery += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${query}%`, `%${query}%`);
    }

    if (location) {
      sqlQuery += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }

    if (facilities) {
      // Handle the double-encoded JSON string format
      sqlQuery += ' AND facilities LIKE ?';
      // Use simple string matching since facilities is stored as escaped JSON string
      params.push(`%${facilities}%`);
    }

    console.log('Query:', sqlQuery);
    console.log('Params:', params);
    console.log('Facilities search term:', facilities);

    const [rows] = await pool.query(sqlQuery, params);

    console.log('Found rows:', rows);

    return res.status(200).json({
      status: 'success',
      data: rows,
      count: rows.length
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(200).json({
      status: 'success',
      data: [],
      count: 0,
      error: error.message
    });
  }
};

export const addReview = async (req, res) => {
  try {
    const { user_id, rating, comment } = req.body;
    const park_id = req.params.id;
    
    const [result] = await pool.query(
      'INSERT INTO reviews (park_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [park_id, user_id, rating, comment]
    );
    
    res.status(201).json({ status: 'success', message: 'Review added successfully', id: result.insertId });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { parkId, reviewId } = req.params;
    await pool.query('DELETE FROM reviews WHERE id = ? AND park_id = ?', [reviewId, parkId]);
    res.json({ status: 'success', message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};