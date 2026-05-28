import { GoogleGenerativeAI } from '@google/generative-ai'

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
]

async function main() {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) {
    console.error('GEMINI_API_KEY missing')
    process.exit(1)
  }

  const genAI = new GoogleGenerativeAI(key)

  for (const id of MODELS) {
    try {
      const result = await genAI.getGenerativeModel({ model: id }).generateContent('Say OK')
      console.log(`${id} -> OK: ${result.response.text()?.trim()}`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.log(`${id} -> FAIL: ${msg.split('\n')[0].slice(0, 140)}`)
    }
  }
}

main()
