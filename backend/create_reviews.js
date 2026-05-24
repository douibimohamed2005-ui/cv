import pool from './middleware/db.js';

async function createTable() {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS reviews (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                review_text TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
            )
        `);
        console.log("Reviews table created successfully.");
        
        // Let's insert a dummy review so that stats aren't completely empty initially
        const [users] = await pool.execute('SELECT id FROM auth_users LIMIT 1');
        if (users.length > 0) {
            const userId = users[0].id;
            await pool.execute(`
                INSERT IGNORE INTO reviews (id, user_id, rating, review_text) 
                VALUES ('dummy-uuid-1', ?, 5, 'Great app!')
            `, [userId]);
            console.log("Dummy review inserted.");
        }

    } catch (err) {
        console.error("Error creating reviews table:", err);
    } finally {
        process.exit(0);
    }
}

createTable();
