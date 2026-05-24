import { Router } from 'express';
import pool from '../middleware/db.js';
import { requireAuth } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

// POST /api/reviews - Add a review
router.post('/', requireAuth, async (req, res) => {
    const { rating, review_text } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    try {
        // Check if user already submitted a review
        const [existing] = await pool.execute('SELECT id FROM reviews WHERE user_id = ?', [req.user.id]);
        
        if (existing.length > 0) {
            // Update existing review
            await pool.execute(
                'UPDATE reviews SET rating = ?, review_text = ? WHERE user_id = ?',
                [rating, review_text || null, req.user.id]
            );
            return res.json({ message: 'Review updated successfully' });
        } else {
            // Insert new review
            const reviewId = crypto.randomUUID();
            await pool.execute(
                'INSERT INTO reviews (id, user_id, rating, review_text) VALUES (?, ?, ?, ?)',
                [reviewId, req.user.id, rating, review_text || null]
            );
            return res.status(201).json({ message: 'Review submitted successfully' });
        }
    } catch (err) {
        console.error('[REVIEW ERROR]', err.message);
        return res.status(500).json({ error: 'Failed to submit review' });
    }
});

// GET /api/reviews - Get recent reviews (optional, if we want to display them)
router.get('/', async (req, res) => {
    try {
        const [reviews] = await pool.execute(`
            SELECT r.rating, r.review_text, r.created_at, p.full_name, p.avatar_url 
            FROM reviews r
            JOIN profiles p ON r.user_id = p.id
            ORDER BY r.created_at DESC
            LIMIT 10
        `);
        return res.json({ reviews });
    } catch (err) {
        console.error('[GET REVIEWS ERROR]', err.message);
        return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

export default router;
