import { and, desc, eq } from 'drizzle-orm'
import { nowIso } from './db.js'
import { comparisons } from './schema.js'

export async function listComparisons(db, userId) {
  return db
    .select()
    .from(comparisons)
    .where(eq(comparisons.userId, userId))
    .orderBy(desc(comparisons.createdAt))
}

export async function createComparison(db, userId, payload) {
  const [created] = await db
    .insert(comparisons)
    .values({
      userId,
      langA: payload.langA,
      langB: payload.langB,
      query: payload.query,
      codeA: payload.codeA,
      codeB: payload.codeB,
      createdAt: nowIso(),
    })
    .returning()
  return created
}

export async function deleteComparison(db, id, userId) {
  const deleted = await db
    .delete(comparisons)
    .where(and(eq(comparisons.id, id), eq(comparisons.userId, userId)))
    .returning({ id: comparisons.id })
  return deleted.length > 0
}