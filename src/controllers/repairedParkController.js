import { pool } from '../config/database.js';

export const getAllRepairedParks = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM repaired_parks');
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getRepairedParkById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM repaired_parks WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Repaired park record not found' });
    res.json({ status: 'success', data: rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const addRepairedPark = async (req, res) => {
  try {
    const { damaged_park_id, repair_description, repaired_by, images } = req.body;
    const [result] = await pool.query(
      'INSERT INTO repaired_parks (damaged_park_id, repair_description, repaired_by, images) VALUES (?, ?, ?, ?)',
      [damaged_park_id, repair_description, repaired_by, JSON.stringify(images)]
    );
    
    // Update the status of the damaged park to completed
    await pool.query('UPDATE damaged_parks SET status = "completed" WHERE id = ?', [damaged_park_id]);
    
    res.status(201).json({ status: 'success', message: 'Repair record added successfully', id: result.insertId });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteRepairedPark = async (req, res) => {
  try {
    await pool.query('DELETE FROM repaired_parks WHERE id = ?', [req.params.id]);
    res.json({ status: 'success', message: 'Repair record deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const addRepairRecord = async (req, res) => {
  try {
    const { damaged_park_id, repair_description } = req.body;
    const repaired_by = req.user.id;

    // Check if damaged park exists and status is not 'completed'
    const [damagedPark] = await pool.query(
      'SELECT * FROM damaged_parks WHERE id = ? AND status != "completed"',
      [damaged_park_id]
    );

    if (damagedPark.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Damaged park report not found or already completed'
      });
    }

    // Handle image upload
    let imageBuffer = null;
    if (req.files && req.files.images) {
      imageBuffer = req.files.images.data;
    }

    // Insert repair record
    const [result] = await pool.query(
      `INSERT INTO repaired_parks 
       (damaged_park_id, repair_description, repaired_by, images) 
       VALUES (?, ?, ?, ?)`,
      [damaged_park_id, repair_description, repaired_by, imageBuffer]
    );

    // Update damaged park status to completed
    await pool.query(
      'UPDATE damaged_parks SET status = "completed" WHERE id = ?',
      [damaged_park_id]
    );

    res.status(201).json({
      status: 'success',
      message: 'Repair record added successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error in addRepairRecord:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getAllRepairs = async (req, res) => {
  try {
    const [repairs] = await pool.query(`
      SELECT r.*, d.damage_description, u.email as repaired_by_email
      FROM repaired_parks r
      JOIN damaged_parks d ON r.damaged_park_id = d.id
      JOIN users u ON r.repaired_by = u.id
      ORDER BY r.repair_date DESC
    `);

    res.json({
      status: 'success',
      data: repairs
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const updateRepair = async (req, res) => {
  try {
    const { id } = req.params;
    const { repair_description } = req.body;

    const [repair] = await pool.query(
      'SELECT * FROM repaired_parks WHERE id = ?',
      [id]
    );

    if (repair.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Repair record not found'
      });
    }

    await pool.query(
      'UPDATE repaired_parks SET repair_description = ? WHERE id = ?',
      [repair_description, id]
    );

    res.json({
      status: 'success',
      message: 'Repair record updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const deleteRepair = async (req, res) => {
  try {
    const { id } = req.params;

    const [repair] = await pool.query(
      'SELECT * FROM repaired_parks WHERE id = ?',
      [id]
    );

    if (repair.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Repair record not found'
      });
    }

    await pool.query('DELETE FROM repaired_parks WHERE id = ?', [id]);

    res.json({
      status: 'success',
      message: 'Repair record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};