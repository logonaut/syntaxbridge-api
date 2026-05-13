import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/data/schema.js',
  out: './src/data/migrations',
  driver: 'd1-http',
})