export function sendError(c, status, code, message, details = []) {
  return c.json({ error: { code, message, details } }, status)
}

export function sendResource(c, data, status = 200) {
  return c.json({ data }, status)
}

export function sendCollection(c, data) {
  return c.json({ data, meta: { count: data.length } })
}