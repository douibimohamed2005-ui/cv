// validate.js  ─  Input validation middleware
//
// FIXED: removed full_name from registerRules
//        auth_users table only has: id, email, password, provider, created_at

import { body, validationResult } from 'express-validator'

export function validate(req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
    }
    next()
}

// ── Auth validators ──
export const registerRules = [
    body('email')
        .isEmail().normalizeEmail()
        .withMessage('A valid email is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    // full_name REMOVED — column does not exist in auth_users table
]

export const loginRules = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
]

// ── CV validators ──
export const cvRules = [
    body('title').trim().notEmpty().withMessage('CV title is required'),
    body('personal').isObject().withMessage('personal must be an object'),
    body('personal.name').trim().notEmpty().withMessage('Name is required in personal info'),
]

// ── AI validator ──
export const aiRules = [
    body('cv').isObject().withMessage('cv data object is required'),
    body('cv.personal.name').trim().notEmpty().withMessage('CV must have a name for AI generation'),
]