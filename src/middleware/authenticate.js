export async function authenticate(c, next) {
  await next()
}