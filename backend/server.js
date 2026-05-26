import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/authRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import cvRoutes from './routes/cvRoutes.js'
import statsRoutes from './routes/statsRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// ── CORS: allow Live Server (5500) + direct (3000) ──
const allowedOrigins = (process.env.CLIENT_URLS || 'http://localhost:5500')
  .split(',').map(s => s.trim())

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (Postman, curl) or matching origins
    if (!origin || allowedOrigins.includes(origin)) cb(null, true)
    else cb(new Error('CORS blocked: ' + origin))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false, crossOriginOpenerPolicy: false }))
app.use(morgan('dev'))
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Serve frontend static files ──
app.use(express.static(path.join(__dirname, '../docs')))



// ── Serve uploaded images publicly ──
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ── API Routes ──
app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/cv', cvRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/reviews', reviewRoutes)

// ── Health ──
app.get('/api/health', (_req, res) => res.json({
  status: 'ok', port: PORT,
  db: process.env.DB_NAME,
  cors: allowedOrigins,
}))

// ── Global error handler ──
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message)
  res.status(err.status || 500).json({ error: err.message })
})

app.listen(PORT, () => {
  console.log(`\n🚀  SmartCV API  →  http://localhost:${PORT}`)
  console.log(`    CORS allowed : ${allowedOrigins.join(', ')}`)
  console.log(`    Database     : ${process.env.DB_NAME}@${process.env.DB_HOST}\n`)
})
// Trigger nodemon restart
