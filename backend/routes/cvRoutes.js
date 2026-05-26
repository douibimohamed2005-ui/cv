import { Router } from 'express'
import { createCV, getUserCVs, getCVById, updateCV, deleteCV } from '../controllers/cvController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.post('/create', requireAuth, createCV)
router.get('/user/:userId', requireAuth, getUserCVs)
router.get('/:id', requireAuth, getCVById)
router.put('/:id', requireAuth, updateCV)
router.delete('/:id', requireAuth, deleteCV)
export default router