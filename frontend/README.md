# AI Answer Grader – Frontend

Next.js 15 frontend. Backend runs separately on Render.

## Deploying to Vercel

### 1. Push this `frontend/` folder to GitHub

If your repo root is the `frontend/` folder, push it directly.  
If the repo has both `frontend/` and `backend/` folders, set the **Root Directory** in Vercel to `frontend`.

### 2. Set the Environment Variable in Vercel

In **Vercel → Project → Settings → Environment Variables**, add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://ai-answer-analyzer.onrender.com` |

> ⚠️ Do **not** rely on `.env.local` for production — Vercel ignores it. The variable must be set in the Vercel dashboard.

### 3. Deploy

Vercel auto-detects Next.js. No extra build settings needed — `vercel.json` handles it.

## Local Development

```bash
npm install
# create .env.local with:
# NEXT_PUBLIC_API_URL=https://ai-answer-analyzer.onrender.com
npm run dev
```
