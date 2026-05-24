import { Router } from 'express';
import pool from '../middleware/db.js';

const router = Router();

// GET /api/stats
router.get('/', async (req, res) => {
    try {
        const [users] = await pool.execute('SELECT COUNT(*) as count FROM auth_users');
        const [cvs] = await pool.execute('SELECT COUNT(*) as count FROM cvs');
        const [reviews] = await pool.execute('SELECT COUNT(*) as count, AVG(rating) as average FROM reviews');
        
        // Base values in case table is empty or just initialized
        let userCount = users[0].count || 0;
        let cvCount = cvs[0].count || 0;
        let reviewCount = reviews[0].count || 0;
        let avgRating = reviews[0].average || 0;

        // Ensure we don't return NaN or null
        avgRating = Number(avgRating).toFixed(1);
        
        return res.json({
            users: userCount,
            cvs: cvCount,
            reviews: reviewCount,
            rating: avgRating
        });
    } catch (err) {
        console.error('[STATS ERROR]', err.message);
        return res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

export default router;
