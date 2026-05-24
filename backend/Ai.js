// ai.js  ─  AI generation routes
//
// PROBLEM in old code: imported from './config/supabase.js' (wrong path)
// SOLUTION: no DB needed here — AI routes only call OpenAI API.
//           Auth still works via JWT middleware.
//
// Routes:
//   POST /api/ai/summary       – generate professional summary
//   POST /api/ai/improve       – improve existing text
//   POST /api/ai/skills        – suggest skills for a role
//   POST /api/ai/cover-letter  – generate cover letter

import { Router } from 'express'
import OpenAI from 'openai'
import { body } from 'express-validator'
import { requireAuth } from './auth.js'
import { aiRules, validate } from './validate.js'

const router = Router()
router.use(requireAuth)

// Lazy-init OpenAI so server starts even without API key configured
let openai = null
function getOpenAI() {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set in your .env file')
        }
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    }
    return openai
}

async function chat(system, user, maxTokens = 300) {
    const client = getOpenAI()
    const res = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
    })
    return res.choices[0].message.content.trim()
}

// ── GENERATE SUMMARY ──────────────────────────────────
router.post('/summary', aiRules, validate, async (req, res) => {
    const { cv } = req.body
    const { name, location } = cv.personal || {}
    const exps = (cv.experience || [])
        .map(e => `${e.position} at ${e.company} (${e.startDate}–${e.current ? 'Present' : e.endDate})`)
        .join('\n')
    const skills = (cv.skills || []).join(', ')
    const edu = (cv.education || [])
        .map(e => `${e.degree} in ${e.field} from ${e.institution}`)
        .join(', ')

    try {
        const summary = await chat(
            `You are a professional CV writer. Write a concise 2-3 sentence professional summary.
Use active voice. No "I" statements. No buzzwords. Return only the summary text, nothing else.`,
            `Name: ${name}\nLocation: ${location || 'N/A'}\nEducation: ${edu || 'N/A'}
Experience:\n${exps || 'None listed'}\nSkills: ${skills || 'N/A'}`
        )
        return res.json({ summary })
    } catch (err) {
        console.error('[AI /summary]', err.message)
        return res.status(502).json({ error: err.message.includes('OPENAI_API_KEY') ? err.message : 'AI service error' })
    }
})

// ── IMPROVE TEXT ──────────────────────────────────────
router.post('/improve', [
    body('text').trim().notEmpty().withMessage('text is required'),
    body('type').isIn(['summary', 'description', 'bullet']).withMessage('type must be: summary | description | bullet'),
    validate,
], async (req, res) => {
    const { text, type } = req.body
    const instructions = {
        summary: 'Improve this professional summary. Keep 2-3 sentences. Stronger verbs, no filler.',
        description: 'Improve this job description. Use strong action verbs. Concise and impactful.',
        bullet: 'Rewrite as a strong achievement bullet. Start with action verb. Include metrics if possible.',
    }
    try {
        const improved = await chat(
            'You are a professional CV editor. Return only the improved text, nothing else.',
            `${instructions[type]}\n\nOriginal:\n${text}`
        )
        return res.json({ improved })
    } catch (err) {
        console.error('[AI /improve]', err.message)
        return res.status(502).json({ error: 'AI service error' })
    }
})

// ── SUGGEST SKILLS ────────────────────────────────────
router.post('/skills', [
    body('role').trim().notEmpty().withMessage('role is required'),
    validate,
], async (req, res) => {
    const { role, existing_skills = [] } = req.body
    try {
        const raw = await chat(
            'You are a career advisor. Return ONLY a JSON array of strings. No explanation, no markdown.',
            `Suggest 10 relevant skills for a "${role}". Avoid: ${existing_skills.join(', ') || 'none'}.
Return format: ["Skill 1","Skill 2",...]`
        )
        const clean = raw.replace(/```json|```/g, '').trim()
        const skills = JSON.parse(clean)
        return res.json({ skills: Array.isArray(skills) ? skills : [] })
    } catch (err) {
        console.error('[AI /skills]', err.message)
        return res.status(502).json({ error: 'AI service error' })
    }
})

// ── COVER LETTER ──────────────────────────────────────
router.post('/cover-letter', [
    body('cv').isObject().withMessage('cv is required'),
    body('job_title').trim().notEmpty().withMessage('job_title is required'),
    body('company').trim().notEmpty().withMessage('company is required'),
    validate,
], async (req, res) => {
    const { cv, job_title, company, job_description = '' } = req.body
    const { name } = cv.personal || {}
    const exps = (cv.experience || []).map(e => `${e.position} at ${e.company}`).join(', ')
    const skills = (cv.skills || []).slice(0, 6).join(', ')

    try {
        const letter = await chat(
            'You are a professional cover letter writer. Confident, warm, professional tone. 3 short paragraphs.',
            `Applicant: ${name}\nApplying for: ${job_title} at ${company}
Experience: ${exps || 'N/A'}\nSkills: ${skills || 'N/A'}
${job_description ? '\nJob description:\n' + job_description.slice(0, 500) : ''}`,
            500
        )
        return res.json({ cover_letter: letter })
    } catch (err) {
        console.error('[AI /cover-letter]', err.message)
        return res.status(502).json({ error: 'AI service error' })
    }
})

export default router