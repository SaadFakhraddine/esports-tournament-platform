import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai'

/** Override with GEMINI_MODEL. Default matches typical AI Studio free-tier (2.5 Flash). */
const DEFAULT_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'

/** 2.5 models can spend most of a low cap on internal thinking; 1024 leaves room for visible text. */
const MAX_OUTPUT_TOKENS = 1024

const generationConfig: GenerationConfig = {
  maxOutputTokens: MAX_OUTPUT_TOKENS,
  temperature: 0.3,
  // Gemini 2.5: thinking tokens count toward maxOutputTokens unless disabled (API passthrough).
  ...({ thinkingConfig: { thinkingBudget: 0 } } as Record<string, unknown>),
}

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
    generationConfig,
  })

  const result = await model.generateContent(user)
  const text = extractResponseText(result.response)
  if (!text) {
    throw new Error('Empty response from Gemini')
  }

  return text
}

function extractResponseText(response: {
  text: () => string
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}): string {
  const fromHelper = response.text()?.trim()
  if (fromHelper && fromHelper.length >= 40) {
    return fromHelper
  }

  const parts = response.candidates?.[0]?.content?.parts ?? []
  const fromParts = parts
    .map((part) => part.text?.trim())
    .filter((t): t is string => Boolean(t))
    .join('\n')
    .trim()

  return fromParts || fromHelper || ''
}
