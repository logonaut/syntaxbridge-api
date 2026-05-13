import { Hono } from 'hono'
import { parseJsonBody } from '../utils/body.js'
import { ApiError } from '../utils/errors.js'
import { sendResource } from '../utils/response.js'
import { validateCompare } from '../utils/validation.js'

const compare = new Hono()

const SYSTEM_PROMPT = `You are a precise, terse programming reference assistant.
When given a programming concept in plain English, respond with ONLY a JSON object in this exact shape — no prose, no markdown fences, nothing else:
{"langA": "", "langB": ""}
Each code value must be a working, concise code snippet with brief inline comments. Use \\n for newlines within the code strings.`

compare.post('/', async (c) => {
  const payload = await parseJsonBody(c)
  const details = validateCompare(payload)

  if (details.length > 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Some fields are invalid.', details)
  }

  const { langA, langB, query } = payload

  if (langA === langB) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'langA and langB must be different.', [])
  }

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': c.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Concept: "${query}"\nLanguage A: ${langA}\nLanguage B: ${langB}`,
        },
      ],
    }),
  })

  if (!anthropicResponse.ok) {
    const errData = await anthropicResponse.json().catch(() => ({}))
    throw new ApiError(
      502,
      'UPSTREAM_ERROR',
      errData?.error?.message ?? 'Claude API request failed.',
    )
  }

  const anthropicData = await anthropicResponse.json()
  const raw = anthropicData.content?.[0]?.text?.trim() ?? ''
  const clean = raw
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim()

  let parsed
  try {
    parsed = JSON.parse(clean)
  } catch {
    throw new ApiError(502, 'UPSTREAM_ERROR', 'Claude returned an unexpected response format.')
  }

  return sendResource(c, {
    langA: parsed.langA ?? '',
    langB: parsed.langB ?? '',
  })
})

export default compare