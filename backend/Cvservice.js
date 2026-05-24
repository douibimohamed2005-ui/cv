// cvService.js  ─  Reusable CV business logic
//
// PROBLEM in old code: used supabaseAdmin.from('cvs') throughout
// SOLUTION: all operations now use MySQL pool
//
// Used by cvs.js routes. Can also be imported by other routes if needed.

import pool from './db.js'

export async function getCVsByUser(userId) {
    const [rows] = await pool.execute(
        `SELECT id, user_id, title, personal, updated_at, created_at
     FROM cvs WHERE user_id = ? ORDER BY updated_at DESC`,
        [userId]
    )
    return rows
}

export async function getCVById(cvId, userId) {
    const [rows] = await pool.execute(
        'SELECT * FROM cvs WHERE id = ? AND user_id = ?',
        [cvId, userId]
    )
    return rows[0] || null
}

export async function createCV(userId, payload) {
    const { title, personal, experience = [], education = [], skills = [], summary = '' } = payload
    const [result] = await pool.execute(
        `INSERT INTO cvs (user_id, title, personal, experience, education, skills, summary)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, title,
            JSON.stringify(personal), JSON.stringify(experience),
            JSON.stringify(education), JSON.stringify(skills), summary]
    )
    const [rows] = await pool.execute('SELECT * FROM cvs WHERE id = ?', [result.insertId])
    return rows[0]
}

export async function updateCV(cvId, userId, updates) {
    const existing = await getCVById(cvId, userId)
    if (!existing) return null

    const fields = [], values = []
    if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title) }
    if (updates.personal !== undefined) { fields.push('personal = ?'); values.push(JSON.stringify(updates.personal)) }
    if (updates.experience !== undefined) { fields.push('experience = ?'); values.push(JSON.stringify(updates.experience)) }
    if (updates.education !== undefined) { fields.push('education = ?'); values.push(JSON.stringify(updates.education)) }
    if (updates.skills !== undefined) { fields.push('skills = ?'); values.push(JSON.stringify(updates.skills)) }
    if (updates.summary !== undefined) { fields.push('summary = ?'); values.push(updates.summary) }
    if (!fields.length) return existing

    values.push(cvId)
    await pool.execute(`UPDATE cvs SET ${fields.join(', ')} WHERE id = ?`, values)
    const [rows] = await pool.execute('SELECT * FROM cvs WHERE id = ?', [cvId])
    return rows[0]
}

export async function deleteCV(cvId, userId) {
    const existing = await getCVById(cvId, userId)
    if (!existing) return false
    await pool.execute('DELETE FROM cvs WHERE id = ?', [cvId])
    return true
}