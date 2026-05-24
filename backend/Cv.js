// cvs.js  ─  CV CRUD routes
//
// PROBLEMS in old code:
//   1. Used supabaseAdmin.from('cvs')... → needs Supabase
//   2. Imported from './config/supabase.js' → wrong path for flat structure
//   3. Supabase returns { data, error } → MySQL returns [rows], [fields]
//
// SOLUTIONS:
//   1. All DB calls now use mysql2 pool
//   2. JSON columns (personal, experience, education, skills) stored as JSON strings
//      MySQL returns them already parsed as objects — we stringify on INSERT/UPDATE
//   3. user_id is an INT (not UUID) matching our auth_users.id
//
// Routes:
//   GET    /api/cvs         list all CVs for logged-in user
//   POST   /api/cvs         create new CV
//   GET    /api/cvs/:id     get one CV
//   PUT    /api/cvs/:id     update CV
//   DELETE /api/cvs/:id     delete CV

import { Router } from 'express'
import pool from './db.js'
import { requireAuth } from './auth.js'
import { cvRules, validate } from './validate.js'

const router = Router()
router.use(requireAuth) // all CV routes require login

// ── LIST ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, user_id, title, personal, updated_at, created_at
       FROM cvs
       WHERE user_id = ?
       ORDER BY updated_at DESC`,
      [req.user.id]
    )
    return res.json({ cvs: rows })
  } catch (err) {
    console.error('[GET /cvs]', err.message)
    return res.status(500).json({ error: 'Failed to fetch CVs' })
  }
})

// ── CREATE ────────────────────────────────────────────
router.post('/', cvRules, validate, async (req, res) => {
  const { title, personal, experience = [], education = [], skills = [], summary = '' } = req.body

  try {
    const [result] = await pool.execute(
      `INSERT INTO cvs (user_id, title, personal, experience, education, skills, summary)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title,
        JSON.stringify(personal),
        JSON.stringify(experience),
        JSON.stringify(education),
        JSON.stringify(skills),
        summary,
      ]
    )

    // Fetch the newly created row to return it
    const [rows] = await pool.execute('SELECT * FROM cvs WHERE id = ?', [result.insertId])
    return res.status(201).json({ cv: rows[0] })
  } catch (err) {
    console.error('[POST /cvs]', err.message)
    return res.status(500).json({ error: 'Failed to create CV' })
  }
})

// ── GET ONE ───────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM cvs WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'CV not found' })
    return res.json({ cv: rows[0] })
  } catch (err) {
    console.error('[GET /cvs/:id]', err.message)
    return res.status(500).json({ error: 'Failed to fetch CV' })
  }
})

// ── UPDATE ────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    // Verify ownership first
    const [existing] = await pool.execute(
      'SELECT id FROM cvs WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    )
    if (existing.length === 0) return res.status(404).json({ error: 'CV not found' })

    // Build dynamic SET clause for only provided fields
    const fields = []
    const values = []

    if (req.body.title !== undefined)      { fields.push('title = ?');      values.push(req.body.title) }
    if (req.body.personal !== undefined)   { fields.push('personal = ?');   values.push(JSON.stringify(req.body.personal)) }
    if (req.body.experience !== undefined) { fields.push('experience = ?'); values.push(JSON.stringify(req.body.experience)) }
    if (req.body.education !== undefined)  { fields.push('education = ?');  values.push(JSON.stringify(req.body.education)) }
    if (req.body.skills !== undefined)     { fields.push('skills = ?');     values.push(JSON.stringify(req.body.skills)) }
    if (req.body.summary !== undefined)    { fields.push('summary = ?');    values.push(req.body.summary) }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    values.push(req.params.id) // for WHERE clause

    await pool.execute(
      `UPDATE cvs SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    const [updated] = await pool.execute('SELECT * FROM cvs WHERE id = ?', [req.params.id])
    return res.json({ cv: updated[0] })
  } catch (err) {
    console.error('[PUT /cvs/:id]', err.message)
    return res.status(500).json({ error: 'Failed to update CV' })
  }
})

// ── DELETE ────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [existing] = await pool.execute(
      'SELECT id FROM cvs WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    )
    if (existing.length === 0) return res.status(404).json({ error: 'CV not found' })

    await pool.execute('DELETE FROM cvs WHERE id = ?', [req.params.id])
    return res.json({ message: 'CV deleted successfully' })
  } catch (err) {
    console.error('[DELETE /cvs/:id]', err.message)
    return res.status(500).json({ error: 'Failed to delete CV' })
  }
})

export default router