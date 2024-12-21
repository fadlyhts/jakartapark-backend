import { pool } from '../config/database.js';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = 'public/uploads/parks';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Create the upload directory if it doesn't exist
import { mkdir } from 'fs/promises';
try {
  await mkdir(UPLOAD_DIR, { recursive: true });
} catch (err) {
  console.log('Upload directory already exists or could not be created');
}

export const getAllParks = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM parks WHERE status = "active"');
    const parks = rows.map(park => {
      const transformed = { ...park };
      if (park.images) {
        // Return the URL instead of buffer
        transformed.imageUrl = `${BASE_URL}/public/uploads/parks/${park.images}`;
        // Remove the buffer data from response
        delete transformed.images;
      }
      return transformed;
    });

    res.json({
      status: 'success',
      data: parks,
      count: parks.length
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

    // Transform the image data
    const park = { ...rows[0] };
    if (park.images) {
      park.imageUrl = `${BASE_URL}/public/uploads/parks/${park.images}`;
      delete park.images;
    }

    res.json({
      status: 'success',
      data: park
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
    const formattedFacilities = formatFacilities(facilities);
    
    let imageName = null;
    if (req.files && req.files.images) {
      const image = req.files.images;
      imageName = `${Date.now()}-${image.name}`;
      const uploadPath = path.join(UPLOAD_DIR, imageName);
      await image.mv(uploadPath);
    }

    const [result] = await pool.query(
      `INSERT INTO parks (name, location, openhours, facilities, description, coordinates, images) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, location, openhours, formattedFacilities, description, coordinates, imageName]
    );

    res.status(201).json({
      status: 'success',
      message: 'Park created successfully',
      data: { 
        id: result.insertId,
        imageUrl: imageName ? `${BASE_URL}/public/uploads/parks/${imageName}` : null
      }
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
    const updateFields = { ...req.body };
    delete updateFields.images; // Remove images from updateFields to handle separately

    const [park] = await pool.query('SELECT images FROM parks WHERE id = ?', [id]);
    if (park.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Park not found'
      });
    }

    // Handle image update
    let imageName = park[0].images;
    if (req.files && req.files.images) {
      // Delete old image if exists
      if (imageName) {
        try {
          await fs.unlink(path.join(UPLOAD_DIR, imageName));
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }
      
      // Save new image
      const image = req.files.images;
      imageName = `${Date.now()}-${image.name}`;
      const uploadPath = path.join(UPLOAD_DIR, imageName);
      await image.mv(uploadPath);
    }

    // Prepare update query
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

    // Add image update if there's a new image
    if (imageName !== park[0].images) {
      updates.push('images = ?');
      values.push(imageName);
    }

    // Add id as last parameter
    values.push(id);

    if (updates.length > 0) {
      await pool.query(
        `UPDATE parks SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    res.json({
      status: 'success',
      message: 'Park updated successfully',
      data: {
        imageUrl: imageName ? `${BASE_URL}/public/uploads/parks/${imageName}` : null
      }
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

    // Transform the results to include image URLs
    const parks = rows.map(park => {
      const transformed = { ...park };
      if (park.images) {
        transformed.imageUrl = `${BASE_URL}/public/uploads/parks/${park.images}`;
        delete transformed.images;
      }
      return transformed;
    });

    return res.status(200).json({
      status: 'success',
      data: parks,
      count: parks.length
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