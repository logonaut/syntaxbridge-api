import { z } from 'zod'
import { ApiError } from './errors.js'

const idParamSchema = z
  .string()
  .regex(/^\d+$/, { error: 'ID must be a positive integer.' })
  .transform((value) => Number(value))
  .refine((value) => Number.isSafeInteger(value) && value > 0, {
    error: 'ID must be a positive integer.',
  })

export function parseIdParam(rawValue, fieldName = 'id') {
  const result = idParamSchema.safeParse(rawValue)

  if (!result.success) {
    throw new ApiError(400, 'BAD_REQUEST', 'Malformed request.', [
      {
        field: fieldName,
        issue:
          result.error.issues[0]?.message || 'ID must be a positive integer.',
      },
    ])
  }

  return result.data
}

function mapZodIssuesToDetails(issues) {
  const details = []

  for (const issue of issues) {
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) {
        details.push({ field: key, issue: 'Field is not allowed.' })
      }
      continue
    }

    if (issue.code === 'invalid_type' && issue.path.length === 0) {
      details.push({
        field: 'body',
        issue: 'Request body must be a JSON object.',
      })
      continue
    }

    const field = issue.path.length > 0 ? issue.path.join('.') : 'body'
    details.push({ field, issue: issue.message })
  }

  return details
}

function validateWithSchema(payload, schema) {
  const result = schema.safeParse(payload)

  if (result.success) {
    return []
  }

  return mapZodIssuesToDetails(result.error.issues)
}

const registerSchema = z.strictObject({
  email: z.email({ error: 'Email must be a valid email address.' }),
  password: z
    .string({ error: 'Password is required.' })
    .min(8, { error: 'Password must be at least 8 characters.' }),
})

const loginSchema = z.strictObject({
  email: z.email({ error: 'Email must be a valid email address.' }),
  password: z.string({ error: 'Password is required.' }).min(1, {
    error: 'Password is required.',
  }),
})

const refreshSchema = z.strictObject({
  refresh_token: z
    .string({ error: 'Refresh token is required.' })
    .min(1, { error: 'Refresh token is required.' }),
})

const logoutSchema = z.strictObject({
  refresh_token: z
    .string({ error: 'Refresh token is required.' })
    .min(1, { error: 'Refresh token is required.' }),
})

export function validateRegister(payload) {
  return validateWithSchema(payload, registerSchema)
}

export function validateLogin(payload) {
  return validateWithSchema(payload, loginSchema)
}

export function validateRefresh(payload) {
  return validateWithSchema(payload, refreshSchema)
}

export function validateLogout(payload) {
  return validateWithSchema(payload, logoutSchema)
}

const SUPPORTED_LANGUAGES = ['Python', 'JavaScript', 'Java', 'C#', 'C++', 'SQL']

const compareSchema = z.strictObject({
  langA: z
    .string({ error: 'langA is required.' })
    .refine((v) => SUPPORTED_LANGUAGES.includes(v), {
      error: `langA must be one of: ${SUPPORTED_LANGUAGES.join(', ')}.`,
    }),
  langB: z
    .string({ error: 'langB is required.' })
    .refine((v) => SUPPORTED_LANGUAGES.includes(v), {
      error: `langB must be one of: ${SUPPORTED_LANGUAGES.join(', ')}.`,
    }),
  query: z
    .string({ error: 'query is required.' })
    .trim()
    .min(1, { error: 'query is required.' })
    .max(500, { error: 'query must be 500 characters or fewer.' }),
})

export function validateCompare(payload) {
  return validateWithSchema(payload, compareSchema)
}

const saveComparisonSchema = z.strictObject({
  langA: z.string({ error: 'langA is required.' }).min(1),
  langB: z.string({ error: 'langB is required.' }).min(1),
  query: z.string({ error: 'query is required.' }).min(1).max(500),
  codeA: z.string({ error: 'codeA is required.' }).min(1),
  codeB: z.string({ error: 'codeB is required.' }).min(1),
})

export function validateSaveComparison(payload) {
  return validateWithSchema(payload, saveComparisonSchema)
}