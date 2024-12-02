import { pool } from '../config/database.js';

export const getUserDamagedParks = async (req, res) => {
  try {
    const userId = req.user.id;

    const [reports] = await pool.query(
      `SELECT dp.*, p.name as park_name, u.name as reporter_name 
       FROM damaged_parks dp
       JOIN parks p ON dp.park_id = p.id 
       JOIN users u ON dp.reported_by = u.id
       WHERE dp.reported_by = ?
       ORDER BY dp.reported_at DESC`,
      [userId]
    );

    res.json({
      status: 'success',
      data: reports
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

export const getMyReports = async (req, res) => {
  try {
    const userId = req.user.id;

    const [reports] = await pool.query(
      `SELECT dp.id, dp.park_id, dp.damage_description, dp.status,
              DATE_FORMAT(dp.created_at, '%Y-%m-%d %H:%i:%s') as reported_date,
              p.name as park_name, p.location
       FROM damaged_parks dp
       JOIN parks p ON dp.park_id = p.id
       WHERE dp.reported_by = ?
       ORDER BY dp.created_at DESC`,
      [userId]
    );

    res.json({
      status: 'success',
      data: reports
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};