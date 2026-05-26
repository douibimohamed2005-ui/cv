import { Router } from 'express'
import { register, login, me, googleLogin, getConfig, forgotPassword, verifyOTP, resetPassword, resendOTP } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import { registerRules, loginRules, validate } from '../validate.js'

const router = Router()
router.post('/register', registerRules, validate, register)
router.post('/login', loginRules, validate, login)
router.post('/logout', requireAuth, (_req, res) => {
    return res.json({ message: 'Logged out successfully' })
})
router.get('/me', requireAuth, me)
router.get('/config', getConfig)
router.post('/google', googleLogin)

router.post('/forgot-password', forgotPassword)
router.post('/verify-otp', verifyOTP)
router.post('/reset-password', resetPassword)
router.post('/resend-otp', resendOTP)

export default router