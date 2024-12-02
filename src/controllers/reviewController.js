import { pool } from '../config/database.js';

export const getParkReviews = async (req, res) => {
  try {
    const { parkId } = req.params;
    
    // First check if park exists
    const [parkExists] = await pool.query(
      'SELECT id FROM parks WHERE id = ? AND status = "active"', 
      [parkId]
    );

    // Always return 200 status code with data array
    if (parkExists.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: [],
        message: 'Park not found or inactive'
      });
    }

    const [reviews] = await pool.query(
      `SELECT r.*, u.email as user_email 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.park_id = ?
       ORDER BY r.created_at DESC`,
      [parkId]
    );

    return res.status(200).json({
      status: 'success',
      data: reviews || [],
      count: reviews.length
    });
  } catch (error) {
    return res.status(200).json({
      status: 'success',
      data: [],
      error: error.message
    });
  }
};

export const addReview = async (req, res) => {
  try {
    const { parkId } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    const [result] = await pool.query(
      `INSERT INTO reviews (park_id, user_id, rating, comment) 
       VALUES (?, ?, ?, ?)`,
      [parkId, userId, rating, comment]
    );

    res.status(201).json({
      status: 'success',
      message: 'Review added successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { parkId, reviewId } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    // Admins can update any review, users can only update their own
    const query = req.user.role === 'admin' 
      ? 'SELECT * FROM reviews WHERE id = ? AND park_id = ?'
      : 'SELECT * FROM reviews WHERE id = ? AND park_id = ? AND user_id = ?';
    
    const params = req.user.role === 'admin' 
      ? [reviewId, parkId]
      : [reviewId, parkId, userId];

    const [review] = await pool.query(query, params);

    if (review.length === 0) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Not authorized to update this review' 
      });
    }

    await pool.query(
      'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
      [rating, comment, reviewId]
    );

    res.json({ status: 'success', message: 'Review updated successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getReviewById = async (req, res) => {
  try {
    const { parkId, reviewId } = req.params;

    // First verify park exists
    const [parkExists] = await pool.query(
      'SELECT id FROM parks WHERE id = ? AND status = "active"', 
      [parkId]
    );

    if (parkExists.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: [],
        message: 'Park not found or inactive'
      });
    }

    const [rows] = await pool.query(
      'SELECT * FROM reviews WHERE id = ? AND park_id = ?',
      [reviewId, parkId]
    );

    if (rows.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: [],
        message: 'Review not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: [rows[0]]
    });
  } catch (error) {
    return res.status(200).json({
      status: 'success',
      data: [],
      error: error.message
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { parkId, reviewId } = req.params;
    const userId = req.user.id;

    const [review] = await pool.query(
      'SELECT * FROM reviews WHERE id = ? AND park_id = ? AND (user_id = ? OR ? IN (SELECT id FROM users WHERE role = "admin"))',
      [reviewId, parkId, userId, userId]
    );

    if (review.length === 0) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Not authorized to delete this review' 
      });
    }

    await pool.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
    res.json({ status: 'success', message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const [reviews] = await pool.query(
      `SELECT r.*, u.email as user_email, p.name as park_name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       JOIN parks p ON r.park_id = p.id 
       ORDER BY r.created_at DESC`
    );

    res.status(200).json({ 
      status: 'success', 
      data: reviews,
      count: reviews.length 
    });
  } catch (error) {
    res.status(200).json({ 
      status: 'success', 
      data: [],
      error: error.message 
    });
  }
};

export const moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, moderationNote } = req.body;

    await pool.query(
      `UPDATE reviews 
       SET moderation_status = ?, 
           moderation_note = ?,
           moderated_by = ?,
           moderated_at = NOW() 
       WHERE id = ?`,
      [status, moderationNote, req.user.id, reviewId]
    );

    res.json({ 
      status: 'success', 
      message: 'Review moderated successfully' 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};