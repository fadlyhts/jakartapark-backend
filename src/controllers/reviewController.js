import { pool } from '../config/database.js';

export const getParkReviews = async (req, res) => {
  try {
    const { parkId } = req.params;
    
    const [reviews] = await pool.query(
      `SELECT reviews.*, users.name as user_name 
       FROM reviews 
       LEFT JOIN users ON reviews.user_id = users.id 
       WHERE park_id = ?`,
      [parkId]
    );

    res.json({
      status: 'success',
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

export const getReviewById = async (req, res) => {
  try {
    const { parkId, reviewId } = req.params;
    
    const [reviews] = await pool.query(
      `SELECT reviews.*, users.name as user_name 
       FROM reviews 
       LEFT JOIN users ON reviews.user_id = users.id 
       WHERE reviews.id = ? AND park_id = ?`,
      [reviewId, parkId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    res.json({
      status: 'success',
      data: reviews[0]
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

export const addReview = async (req, res) => {
  try {
    const { parkId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const [result] = await pool.query(
      'INSERT INTO reviews (park_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [parkId, userId, rating, comment]
    );

    res.status(201).json({
      status: 'success',
      message: 'Review added successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { parkId, reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Check if review exists and belongs to user
    const [review] = await pool.query(
      'SELECT * FROM reviews WHERE id = ? AND park_id = ? AND user_id = ?',
      [reviewId, parkId, userId]
    );

    if (review.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found or unauthorized'
      });
    }

    await pool.query(
      'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
      [rating, comment, reviewId]
    );

    res.json({
      status: 'success',
      message: 'Review updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { parkId, reviewId } = req.params;
    const userId = req.user.id;

    // Check if review exists and belongs to user or user is admin
    const [review] = await pool.query(
      'SELECT * FROM reviews WHERE id = ? AND park_id = ? AND (user_id = ? OR ? IN (SELECT id FROM users WHERE role = "admin"))',
      [reviewId, parkId, userId, userId]
    );

    if (review.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found or unauthorized'
      });
    }

    await pool.query('DELETE FROM reviews WHERE id = ?', [reviewId]);

    res.json({
      status: 'success',
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};