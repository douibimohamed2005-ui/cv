// controllers/cvController.js
// cvs table: id, user_id, title, template, data (JSON), created_at, updated_at

import pool from '../middleware/db.js'

// ── helpers ───────────────────────────────────────────
function calcCompletion(data) {
    if (!data) return 0
    const checks = [
        !!(data.personal?.name),
        !!(data.personal?.email),
        !!(data.personal?.phone),
        !!(data.summary),
        !!(data.experience?.length),
        !!(data.education?.length),
        !!(data.skills?.length),
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

// POST /api/cv/create
export async function createCV(req, res) {
    const { title = 'Untitled CV', template = 'professional', data = {} } = req.body
    const userId = req.user.id

    try {
        const [result] = await pool.execute(
            'INSERT INTO cvs (user_id, title, template, data) VALUES (?,?,?,?)',
            [userId, title, template, JSON.stringify(data)]
        )
        const [rows] = await pool.execute('SELECT * FROM cvs WHERE id=?', [result.insertId])
        const cv = rows[0]
        cv.data = typeof cv.data === 'string' ? JSON.parse(cv.data) : cv.data
        cv.completion = calcCompletion(cv.data)
        return res.status(201).json({ message: 'CV created', cv })
    } catch (err) {
        console.error('[CREATE CV]', err.message)
        return res.status(500).json({ error: 'Failed to create CV: ' + err.message })
    }
}

// GET /api/cv/user/:userId  — list all CVs for a user
export async function getUserCVs(req, res) {
    const userId = req.params.userId
    if (req.user.id !== userId)
        return res.status(403).json({ error: 'Access denied' })

    try {
        const [rows] = await pool.execute(
            'SELECT id, user_id, title, template, data, created_at, updated_at FROM cvs WHERE user_id=? ORDER BY updated_at DESC',
            [userId]
        )
        const cvs = rows.map(cv => {
            const d = typeof cv.data === 'string' ? JSON.parse(cv.data) : (cv.data || {})
            return { ...cv, data: d, completion: calcCompletion(d) }
        })
        return res.json({ cvs })
    } catch (err) {
        console.error('[GET USER CVS]', err.message)
        return res.status(500).json({ error: 'Failed to fetch CVs: ' + err.message })
    }
}

// GET /api/cv/:id  — get one CV
export async function getCVById(req, res) {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM cvs WHERE id=? AND user_id=?',
            [req.params.id, req.user.id]
        )
        if (!rows.length) return res.status(404).json({ error: 'CV not found' })
        const cv = rows[0]
        cv.data = typeof cv.data === 'string' ? JSON.parse(cv.data) : (cv.data || {})
        cv.completion = calcCompletion(cv.data)
        return res.json({ cv })
    } catch (err) {
        console.error('[GET CV]', err.message)
        return res.status(500).json({ error: 'Failed to fetch CV' })
    }
}

// PUT /api/cv/:id  — update CV
export async function updateCV(req, res) {
    try {
        const [exists] = await pool.execute(
            'SELECT id FROM cvs WHERE id=? AND user_id=?',
            [req.params.id, req.user.id]
        )
        if (!exists.length) return res.status(404).json({ error: 'CV not found' })

        const fields = [], values = []
        if (req.body.title !== undefined) { fields.push('title=?'); values.push(req.body.title) }
        if (req.body.template !== undefined) { fields.push('template=?'); values.push(req.body.template) }
        if (req.body.data !== undefined) { fields.push('data=?'); values.push(JSON.stringify(req.body.data)) }
        if (!fields.length) return res.status(400).json({ error: 'Nothing to update' })

        values.push(req.params.id)
        await pool.execute(`UPDATE cvs SET ${fields.join(',')} WHERE id=?`, values)

        const [rows] = await pool.execute('SELECT * FROM cvs WHERE id=?', [req.params.id])
        const cv = rows[0]
        cv.data = typeof cv.data === 'string' ? JSON.parse(cv.data) : (cv.data || {})
        cv.completion = calcCompletion(cv.data)
        return res.json({ message: 'CV updated', cv })
    } catch (err) {
        console.error('[UPDATE CV]', err.message)
        return res.status(500).json({ error: 'Failed to update CV' })
    }
}

// DELETE /api/cv/:id
export async function deleteCV(req, res) {
    try {
        const [exists] = await pool.execute(
            'SELECT id FROM cvs WHERE id=? AND user_id=?',
            [req.params.id, req.user.id]
        )
        if (!exists.length) return res.status(404).json({ error: 'CV not found' })

        await pool.execute('DELETE FROM cvs WHERE id=?', [req.params.id])
        return res.json({ message: 'CV deleted' })
    } catch (err) {
        console.error('[DELETE CV]', err.message)
        return res.status(500).json({ error: 'Failed to delete CV' })
    }
}