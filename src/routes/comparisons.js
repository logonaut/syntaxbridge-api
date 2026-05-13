import { Hono } from 'hono'
import { getDb } from '../data/db.js'
import {
  listComparisons,
  createComparison,
  deleteComparison,
} from '../data/comparisons.repository.js'
import { parseJsonBody } from '../utils/body.js'
import { ApiError } from '../utils/errors.js'
import { sendCollection, sendResource } from '../utils/response.js'
import { parseIdParam, validateSaveComparison } from '../utils/validation.js'

const comparisons = new Hono()

comparisons.get('/', async (c) => {
  const userId = c.get('user').sub
  const db = getDb(c.env.DB)
  const data = await listComparisons(db, userId)
  return sendCollection(c, data)
})

comparisons.post('/', async (c) => {
  const userId = c.get('user').sub
  const payload = await parseJsonBody(c)
  const details = validateSaveComparison(payload)

  if (details.length > 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Some fields are invalid.', details)
  }

  const db = getDb(c.env.DB)
  const comparison = await createComparison(db, userId, payload)
  c.header('Location', `/api/comparisons/${comparison.id}`)
  return sendResource(c, comparison, 201)
})

comparisons.delete('/:id', async (c) => {
  const userId = c.get('user').sub
  const id = parseIdParam(c.req.param('id'))
  const db = getDb(c.env.DB)
  const deleted = await deleteComparison(db, id, userId)

  if (!deleted) {
    throw new ApiError(404, 'NOT_FOUND', 'Comparison not found.')
  }

  return c.body(null, 204)
})

export default comparisons