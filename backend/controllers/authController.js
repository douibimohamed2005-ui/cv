import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../middleware/db.js'
import crypto from 'crypto'
import dotenv from 'dotenv'
import { OAuth2Client } from 'google-auth-library'
import { sendOTP } from '../utils/mailer.js'
dotenv.config()

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

function signToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )
}

// POST /api/auth/register
export async function register(req, res) {
    const { email, password } = req.body
    if (!email || !password)
        return res.status(422).json({ error: 'Email and password are required' })
    if (password.length < 6)
        return res.status(422).json({ error: 'Password must be at least 6 characters' })

    try {
        const [exists] = await pool.execute('SELECT id FROM auth_users WHERE email=?', [email])
        if (exists.length) return res.status(400).json({ error: 'Email already registered' })

        const hash = await bcrypt.hash(password, 10)
        const userId = crypto.randomUUID()
        await pool.execute(
            'INSERT INTO auth_users (id, email, password, provider) VALUES (?,?,?,?)',
            [userId, email, hash, 'local']
        )

        // Auto-create profile row linked to auth_users
        const defaultName = email.split('@')[0]
        await pool.execute(
            'INSERT INTO profiles (id, full_name, email, role) VALUES (?,?,?,?)',
            [userId, defaultName, email, 'user']
        ).catch((err) => { console.error('Profile creation error:', err.message) }) 

        return res.status(201).json({
            message: 'Account created',
            user: { id: userId, email },
        })
    } catch (err) {
        console.error('[REGISTER]', err.message)
        return res.status(500).json({ error: 'Registration failed: ' + err.message })
    }
}

// POST /api/auth/login
export async function login(req, res) {
    const { email, password } = req.body
    if (!email || !password)
        return res.status(422).json({ error: 'Email and password required' })

    try {
        const [rows] = await pool.execute(
            'SELECT id, email, password FROM auth_users WHERE email=?', [email]
        )
        if (!rows.length) return res.status(401).json({ error: 'Invalid email or password' })

        const user = rows[0]
        const match = await bcrypt.compare(password, user.password)
        if (!match) return res.status(401).json({ error: 'Invalid email or password' })

        const token = signToken(user)
        return res.json({
            message: 'Logged in',
            access_token: token,
            user: { id: user.id, email: user.email },
        })
    } catch (err) {
        console.error('[LOGIN]', err.message)
        return res.status(500).json({ error: 'Login failed' })
    }
}

// GET /api/auth/me
export async function me(req, res) {
    try {
        const [rows] = await pool.execute(
            'SELECT id, email, provider, created_at FROM auth_users WHERE id=?',
            [req.user.id]
        )
        if (!rows.length) return res.status(404).json({ error: 'User not found' })
        return res.json({ user: rows[0] })
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch user' })
    }
}

export function getConfig(req, res) {
    res.json({ GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '' })
}

export async function googleLogin(req, res) {
    const { token } = req.body
    if (!token) return res.status(400).json({ error: 'Token is required' })

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        })
        const payload = ticket.getPayload()
        const { email, name, picture } = payload

        const [rows] = await pool.execute('SELECT id, email FROM auth_users WHERE email=?', [email])
        let user
        
        if (rows.length > 0) {
            user = rows[0]
            await pool.execute('UPDATE auth_users SET provider=? WHERE id=?', ['google', user.id])
        } else {
            const userId = crypto.randomUUID()
            const dummyHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10)
            await pool.execute(
                'INSERT INTO auth_users (id, email, password, provider) VALUES (?,?,?,?)',
                [userId, email, dummyHash, 'google']
            )
            
            await pool.execute(
                'INSERT INTO profiles (id, full_name, email, role, avatar_url) VALUES (?,?,?,?,?)',
                [userId, name || email.split('@')[0], email, 'user', picture || null]
            ).catch((err) => { console.error('Profile creation error:', err.message) }) 
            
            user = { id: userId, email }
        }

        const access_token = signToken(user)
        return res.json({ message: 'Google login successful', access_token, user })
    } catch (err) {
        console.error('[GOOGLE LOGIN]', err.message)
        return res.status(401).json({ error: 'Invalid Google token' })
    }
}

export async function forgotPassword(req, res) {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    try {
        const [rows] = await pool.execute('SELECT id FROM auth_users WHERE email=?', [email])
        if (!rows.length) return res.status(404).json({ error: 'No account found with this email' })

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expires = new Date(Date.now() + 5 * 60 * 1000)

        await pool.execute(
            'UPDATE auth_users SET reset_otp=?, reset_otp_expires=? WHERE email=?',
            [otp, expires, email]
        )

        const sent = await sendOTP(email, otp)
        if (!sent) return res.status(500).json({ error: 'Failed to send verification email' })

        return res.json({ message: 'Verification code sent' })
    } catch (err) {
        console.error('[FORGOT PASSWORD]', err.message)
        return res.status(500).json({ error: 'Server error' })
    }
}

export async function verifyOTP(req, res) {
    const { email, otp } = req.body
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' })

    try {
        const [rows] = await pool.execute(
            'SELECT reset_otp, reset_otp_expires FROM auth_users WHERE email=?', [email]
        )
        if (!rows.length) return res.status(404).json({ error: 'User not found' })

        const user = rows[0]
        if (user.reset_otp !== otp) return res.status(400).json({ error: 'Invalid code' })
        if (new Date(user.reset_otp_expires) < new Date()) {
            return res.status(400).json({ error: 'Code has expired' })
        }

        return res.json({ message: 'OTP verified successfully' })
    } catch (err) {
        console.error('[VERIFY OTP]', err.message)
        return res.status(500).json({ error: 'Server error' })
    }
}

export async function resetPassword(req, res) {
    const { email, otp, password } = req.body
    if (!email || !otp || !password) return res.status(400).json({ error: 'Missing fields' })
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

    try {
        const [rows] = await pool.execute(
            'SELECT reset_otp, reset_otp_expires FROM auth_users WHERE email=?', [email]
        )
        if (!rows.length) return res.status(404).json({ error: 'User not found' })

        const user = rows[0]
        if (user.reset_otp !== otp) return res.status(400).json({ error: 'Invalid code' })
        if (new Date(user.reset_otp_expires) < new Date()) return res.status(400).json({ error: 'Code has expired' })

        const hash = await bcrypt.hash(password, 10)
        await pool.execute(
            'UPDATE auth_users SET password=?, reset_otp=NULL, reset_otp_expires=NULL WHERE email=?',
            [hash, email]
        )

        return res.json({ message: 'Password updated successfully' })
    } catch (err) {
        console.error('[RESET PASSWORD]', err.message)
        return res.status(500).json({ error: 'Server error' })
    }
}

export async function resendOTP(req, res) {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    try {
        const [rows] = await pool.execute('SELECT id FROM auth_users WHERE email=?', [email])
        if (!rows.length) return res.status(404).json({ error: 'No account found with this email' })

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expires = new Date(Date.now() + 5 * 60 * 1000)

        await pool.execute(
            'UPDATE auth_users SET reset_otp=?, reset_otp_expires=? WHERE email=?',
            [otp, expires, email]
        )

        const sent = await sendOTP(email, otp)
        if (!sent) return res.status(500).json({ error: 'Failed to resend verification email' })

        return res.json({ message: 'New verification code sent' })
    } catch (err) {
        console.error('[RESEND OTP]', err.message)
        return res.status(500).json({ error: 'Server error' })
    }
}