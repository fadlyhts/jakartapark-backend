// abian

import { pool } from '../config/database.js';

class Park {
    static async create(parkData) {
        const {
            name,
            location,
            openhours,
            facilities,
            description,
            coordinates
        } = parkData;

        const query = `
      INSERT INTO parks 
      (name, location, openhours, facilities, description, coordinates) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

        try {
            const [result] = await pool.query(query, [
                name,
                location,
                openhours,
                JSON.stringify(facilities),
                description,
                coordinates
            ]);
            return result;
        } catch (error) {
            console.error('Error creating park:', error);
            throw error;
        }
    }

    static async getAll() {
        const query = 'SELECT * FROM parks';
        const [parks] = await pool.query(query);
        return parks;
    }
}

export default Park;