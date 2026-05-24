// export.js  ─  PDF Export route
//
// PROBLEM in old code: used supabaseAdmin to fetch CV before generating PDF
// SOLUTION: use MySQL pool to fetch the CV, then generate PDF with Puppeteer
//
// Route:
//   POST /api/export/pdf/:cvId

import { Router } from 'express'
import pool from './db.js'
import { requireAuth } from './auth.js'

const router = Router()
router.use(requireAuth)

router.post('/pdf/:cvId', async (req, res) => {
    try {
        // Fetch CV from MySQL — check ownership
        const [rows] = await pool.execute(
            'SELECT * FROM cvs WHERE id = ? AND user_id = ?',
            [req.params.cvId, req.user.id]
        )
        if (rows.length === 0) {
            return res.status(404).json({ error: 'CV not found' })
        }
        const cv = rows[0]

        // Try to load Puppeteer (optional dependency)
        let puppeteer
        try {
            puppeteer = await import('puppeteer')
        } catch {
            return res.status(501).json({
                error: 'PDF export requires Puppeteer. Run: npm install puppeteer',
            })
        }

        const html = buildCVHtml(cv)
        const browser = await puppeteer.default.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
        const page = await browser.newPage()
        await page.setContent(html, { waitUntil: 'networkidle0' })

        const pdf = await page.pdf({
            format: 'A4',
            margin: { top: '20mm', right: '18mm', bottom: '20mm', left: '18mm' },
            printBackground: true,
        })
        await browser.close()

        const filename = `${(cv.title || 'cv').replace(/\s+/g, '_')}.pdf`
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.setHeader('Content-Length', pdf.length)
        return res.end(pdf)

    } catch (err) {
        console.error('[EXPORT /pdf]', err.message)
        return res.status(500).json({ error: 'PDF generation failed: ' + err.message })
    }
})

function buildCVHtml(cv) {
    // MySQL JSON columns are auto-parsed to objects by mysql2
    const p = cv.personal || {}
    const exp = cv.experience || []
    const edu = cv.education || []
    const sk = cv.skills || []
    const contacts = [p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean)

    return `<!DOCTYPE html><html><head>
<meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Lora',serif;font-size:12px;color:#1a1a1a;line-height:1.6}
.name{font-family:'Plus Jakarta Sans',sans-serif;font-size:26px;font-weight:700;margin-bottom:4px}
.contacts{font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;color:#555;display:flex;flex-wrap:wrap;gap:4px 16px;margin-bottom:2px}
hr{border:none;border-top:2px solid #1a1a1a;margin:12px 0 14px}
.st{font-family:'Plus Jakarta Sans',sans-serif;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px}
.sum{font-size:12px;color:#333;margin-bottom:16px}
.ei{margin-bottom:12px}
.eh{display:flex;justify-content:space-between}
.ep{font-weight:600;font-size:13px}
.ed{font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;color:#888}
.ec{font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;color:#555}
.desc{font-size:12px;color:#444;margin-top:3px}
.er{display:flex;justify-content:space-between;margin-bottom:8px}
.sk{display:flex;flex-wrap:wrap;gap:6px}
.s{background:#f3f4f6;padding:3px 10px;border-radius:100px;font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;font-weight:600;color:#555}
section{margin-bottom:16px}
</style></head><body>
<div class="name">${p.name || ''}</div>
<div class="contacts">${contacts.map(c => `<span>${c}</span>`).join('')}</div>
<hr/>
${cv.summary ? `<section><div class="st">Summary</div><div class="sum">${cv.summary}</div></section>` : ''}
${exp.length ? `<section><div class="st">Experience</div>${exp.map(e => `
<div class="ei">
  <div class="eh"><div class="ep">${e.position || ''}</div><div class="ed">${e.startDate || ''} – ${e.current ? 'Present' : e.endDate || ''}</div></div>
  <div class="ec">${e.company || ''}</div>
  ${e.description ? `<div class="desc">${e.description}</div>` : ''}
</div>`).join('')}</section>` : ''}
${edu.length ? `<section><div class="st">Education</div>${edu.map(e => `
<div class="er">
  <div><div class="ep">${e.degree || ''} ${e.field ? 'in ' + e.field : ''}</div><div class="ec">${e.institution || ''} ${e.gpa ? '· GPA: ' + e.gpa : ''}</div></div>
  <div class="ed">${e.startDate || ''} ${e.endDate ? '– ' + e.endDate : ''}</div>
</div>`).join('')}</section>` : ''}
${sk.length ? `<section><div class="st">Skills</div><div class="sk">${sk.map(s => `<span class="s">${s}</span>`).join('')}</div></section>` : ''}
</body></html>`
}

export default router