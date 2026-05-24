// controllers/profileController.js
// profiles table: id, user_id, full_name, avatar_url, bio, phone, address, role, email, created_at, updated_at

import pool from '../middleware/db.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// GET /api/profile/:userId
export async function getProfile(req, res) {
    const userId = req.params.userId
    if (req.user.id !== userId)
        return res.status(403).json({ error: 'Access denied' })

    try {
        const [rows] = await pool.execute(
            'SELECT id, full_name, avatar_url, bio, phone, address, role, email, created_at FROM profiles WHERE id=?',
            [userId]
        )

        if (!rows.length) {
            // Profile missing — create one automatically
            const [userRows] = await pool.execute('SELECT email FROM auth_users WHERE id=?', [userId])
            const email = userRows[0]?.email || ''
            const defaultName = email.split('@')[0] || 'User'
            await pool.execute(
                'INSERT INTO profiles (id, full_name, email, role) VALUES (?,?,?,?)',
                [userId, defaultName, email, 'user']
            )
            const [newRows] = await pool.execute('SELECT * FROM profiles WHERE id=?', [userId])
            return res.json({ profile: newRows[0] })
        }

        return res.json({ profile: rows[0] })
    } catch (err) {
        console.error('[GET PROFILE]', err.message)
        return res.status(500).json({ error: 'Failed to fetch profile: ' + err.message })
    }
}

// PUT /api/profile/:userId
export async function updateProfile(req, res) {
    const userId = req.params.userId
    if (req.user.id !== userId)
        return res.status(403).json({ error: 'Access denied' })

    const { full_name, bio, phone, address, role } = req.body

    try {
        const fields = [], values = []
        if (full_name !== undefined) { fields.push('full_name=?'); values.push(full_name) }
        if (bio !== undefined) { fields.push('bio=?'); values.push(bio) }
        if (phone !== undefined) { fields.push('phone=?'); values.push(phone) }
        if (address !== undefined) { fields.push('address=?'); values.push(address) }
        if (role !== undefined) { fields.push('role=?'); values.push(role) }

        if (!fields.length) return res.status(400).json({ error: 'No fields to update' })

        values.push(userId)
        await pool.execute(`UPDATE profiles SET ${fields.join(',')} WHERE id=?`, values)

        const [rows] = await pool.execute('SELECT * FROM profiles WHERE id=?', [userId])
        return res.json({ message: 'Profile updated', profile: rows[0] })
    } catch (err) {
        console.error('[UPDATE PROFILE]', err.message)
        return res.status(500).json({ error: 'Failed to update profile: ' + err.message })
    }
}

// POST /api/profile/upload-image
export async function uploadProfileImage(req, res) {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' })
    const userId = req.user.id

    try {
        // Delete old avatar file if exists
        const [rows] = await pool.execute('SELECT avatar_url FROM profiles WHERE id=?', [userId])
        if (rows[0]?.avatar_url) {
            const oldPath = path.join(__dirname, '../uploads', path.basename(rows[0].avatar_url))
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
        }

        const avatarUrl = `/uploads/${req.file.filename}`
        await pool.execute('UPDATE profiles SET avatar_url=? WHERE id=?', [avatarUrl, userId])

        return res.json({ message: 'Image uploaded', avatar_url: avatarUrl })
    } catch (err) {
        console.error('[UPLOAD IMAGE]', err.message)
        return res.status(500).json({ error: 'Image upload failed: ' + err.message })
    }
}