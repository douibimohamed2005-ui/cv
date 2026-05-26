import { Router } from 'express'
import { getProfile, updateProfile, uploadProfileImage } from '../controllers/profileController.js'
import { requireAuth } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = Router()
router.get('/:userId', requireAuth, getProfile)
router.put('/:userId', requireAuth, updateProfile)
router.post('/upload-image', requireAuth, upload.single('avatar'), uploadProfileImage)
export default router