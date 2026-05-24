// auth-routes.js  ─  Authentication routes
//
// FIXED: auth_users table has columns: id, email, password, provider, created_at
//        NOT full_name — that column does not exist → was causing INSERT to fail
//
// Routes:
//   POST /api/auth/register   → creates user in auth_users
//   POST /api/auth/login      → returns JWT token
//   POST /api/auth/logout     → client deletes token
//   GET  /api/auth/me         → returns current user info

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import pool from './db.js'
import { requireAuth } from './auth.js'
import { registerRules, loginRules, validate } from './validate.js'

const router = Router()

// ── REGISTER ──────────────────────────────────────────
router.post('/register', registerRules, validate, async (req, res) => {
    const { email, password } = req.body

    try {
        // 1. Check if email already exists
        const [existing] = await pool.execute(
            'SELECT id FROM auth_users WHERE email = ?',
            [email]
        )
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email is already registered' })
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // 3. Insert into auth_users — only the columns that actually exist in your table
        const userId = crypto.randomUUID()
        await pool.execute(
            'INSERT INTO auth_users (id, email, password, provider) VALUES (?, ?, ?, ?)',
            [userId, email, hashedPassword, 'local']
        )

        // 4. Auto-create matching profile row
        await pool.execute(
            'INSERT INTO profiles (id, email) VALUES (?, ?)',
            [userId, email]
        ).catch((err) => {
            console.error('Profile creation error:', err.message)
        })

        return res.status(201).json({
            message: 'Account created successfully',
            user: { id: userId, email },
        })

    } catch (err) {
        console.error('[REGISTER ERROR]', err.message)
        return res.status(500).json({ error: 'Registration failed: ' + err.message })
    }
})

// ── LOGIN ─────────────────────────────────────────────
router.post('/login', loginRules, validate, async (req, res) => {
    const { email, password } = req.body

    try {
        // 1. Find user — only select columns that exist
        const [rows] = await pool.execute(
            'SELECT id, email, password, provider FROM auth_users WHERE email = ?',
            [email]
        )
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        const user = rows[0]

        // 2. Compare password with bcrypt hash
        const match = await bcrypt.compare(password, user.password)
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        // 3. Sign JWT with user id and email
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        )

        return res.json({
            message: 'Logged in successfully',
            access_token: token,
            user: { id: user.id, email: user.email },
        })

    } catch (err) {
        console.error('[LOGIN ERROR]', err.message)
        return res.status(500).json({ error: 'Login failed: ' + err.message })
    }
})

// ── LOGOUT ────────────────────────────────────────────
router.post('/logout', requireAuth, (_req, res) => {
    // JWT is stateless — just tell the client to delete the token
    return res.json({ message: 'Logged out successfully' })
})

// ── GET CURRENT USER ──────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, email, provider, created_at FROM auth_users WHERE id = ?',
            [req.user.id]
        )
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' })
        return res.json({ user: rows[0] })
    } catch (err) {
        console.error('[ME ERROR]', err.message)
        return res.status(500).json({ error: 'Failed to fetch user' })
    }
})

export default router
