import { GoogleGenerativeAI } from '@google/generative-ai'

const DEFAULT_MODEL = 'gemini-2.0-flash'

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim())
}

export async function generateGeminiText(system: string, user: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction: system,
    generationConfig: {
      maxOutputTokens: 200,
      temperature: 0.3,
    },
  })

  const result = await model.generateContent(user)
  const text = result.response.text()?.trim()
  if (!text) {
    throw new Error('Empty response from Gemini')
  }

  return text
}
