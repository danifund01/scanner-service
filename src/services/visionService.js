// ---------------------------------------------------------------------------
// CLAUDE API — comentado
// ---------------------------------------------------------------------------
// import Anthropic from '@anthropic-ai/sdk'
// ...
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GOOGLE CLOUD VISION — comentado, reemplazado por Gemini
// ---------------------------------------------------------------------------
//
// const VISION_ERROR_MESSAGES = {
//   400: 'La imagen no es válida o está corrupta.',
//   401: 'API key de Google Vision incorrecta. Verifica tu configuración.',
//   403: 'Sin permisos para usar Google Cloud Vision. Verifica que la API esté habilitada.',
//   429: 'Límite de solicitudes alcanzado. Espera unos segundos e intenta de nuevo.',
//   500: 'Error interno en Google Cloud Vision. Intenta de nuevo más tarde.',
// }
//
// async function getTextFromVision(base64) {
//   const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY
//   const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`
//   const body = {
//     requests: [{ image: { content: base64 }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }],
//   }
//   const response = await fetch(url, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(body),
//   })
//   if (!response.ok) {
//     const message = VISION_ERROR_MESSAGES[response.status]
//     if (message) throw new Error(message)
//     const err = await response.json().catch(() => ({}))
//     throw new Error(err.error?.message ?? 'Error al conectar con Google Cloud Vision.')
//   }
//   const data = await response.json()
//   const fullText = data.responses?.[0]?.fullTextAnnotation?.text
//   if (!fullText) throw new Error('No se detectó texto en la imagen.')
//   return fullText
// }
//
// function extractInvoiceFields(text) {
//   const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
//   const invoiceMatch = text.match(
//     /(?:factura\s*n[°º.]?\s*|invoice\s*(?:no\.?|#|number:?)\s*|folio:?\s*|n[°º]\s*)([A-Z0-9\-\/]+)/i
//   )
//   const numero_factura = invoiceMatch ? invoiceMatch[1].trim() : null
//   const montoMatch = text.match(
//     /(?:total\s*(?:a\s*pagar|general|facturado)?|monto\s*total|gran\s*total|amount\s*due)[^\d$€£S]*([S]\/\.?\s*|[$€£¥]|\bUSD\b|\bMXN\b|\bPEN\b|\bCLP\b)?\s*([\d.,]+)/i
//   )
//   const monto = montoMatch ? `${montoMatch[1] ?? ''}${montoMatch[2]}`.trim() : null
//   const proveedor = lines.find(
//     (line) =>
//       line.length > 3 &&
//       !/^(factura|invoice|fecha|date|ruc|rfc|cuit|nit|tel|fax|www|http)/i.test(line) &&
//       !/^\d/.test(line)
//   ) ?? null
//   return { proveedor, monto, numero_factura }
// }
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GEMINI — implementación activa
// Soporta imágenes (JPG, PNG, WEBP) y PDF de forma nativa.
// Devuelve JSON estructurado directamente, sin necesidad de regex.
// ---------------------------------------------------------------------------

import { GoogleGenerativeAI } from '@google/generative-ai'

// El model ID se configura en .env como VITE_GEMINI_MODEL.
// Verifica el nombre exacto en: https://ai.google.dev/gemini-api/docs/models
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL ?? 'gemini-2.5-pro-preview-03-25'

const PROMPT = `Analiza este documento de factura y extrae los siguientes datos.
Responde ÚNICAMENTE con un objeto JSON válido con estas claves exactas, sin texto adicional:
{
  "proveedor": "nombre del proveedor o empresa emisora",
  "monto": "monto total con su símbolo de moneda",
  "numero_factura": "número, folio o código de la factura"
}
Si algún dato no está visible en el documento, usa null en ese campo.`

const GEMINI_ERROR_MESSAGES = {
  400: 'El archivo no es válido o está corrupto.',
  401: 'API key de Gemini incorrecta. Verifica tu configuración.',
  403: 'Sin permisos para usar Gemini API. Asegúrate de tener la API habilitada en Google AI Studio.',
  429: 'Límite de solicitudes alcanzado. Espera unos segundos e intenta de nuevo.',
  500: 'Error interno en Gemini. Intenta de nuevo más tarde.',
}

// Convierte cualquier archivo (imagen o PDF) a base64
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('No se pudo leer el archivo. Intenta de nuevo.'))
    reader.readAsDataURL(file)
  })
}

async function analyzeWithGemini(base64, mimeType) {
  let genAI
  try {
    genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
  } catch {
    throw new Error('No se pudo inicializar Gemini. Verifica tu API key.')
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  })

  let result
  try {
    result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      PROMPT,
    ])
  } catch (err) {
    const status = err?.status ?? err?.httpStatus
    const friendlyMsg = status ? GEMINI_ERROR_MESSAGES[status] : null

    if (friendlyMsg) throw new Error(friendlyMsg)
    if (err?.message?.includes('fetch')) throw new Error('Sin conexión a internet. Verifica tu red e intenta de nuevo.')
    if (err?.message?.includes('API key')) throw new Error('API key de Gemini incorrecta. Verifica tu configuración.')

    throw new Error('Error al analizar el documento con Gemini. Intenta de nuevo.')
  }

  const text = result.response.text()
  if (!text) throw new Error('Gemini no devolvió una respuesta. Intenta de nuevo.')

  try {
    return JSON.parse(text)
  } catch {
    // Fallback: extraer JSON si viene con texto adicional
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No se pudieron extraer los datos de la factura. Intenta con una imagen más clara.')
    return JSON.parse(match[0])
  }
}

// ---------------------------------------------------------------------------
// Función principal exportada
// Acepta imágenes (image/jpeg, image/png, image/webp) y PDFs (application/pdf)
// ---------------------------------------------------------------------------
export async function processInvoiceImage(file, onStep) {
  onStep('Leyendo archivo...')
  const base64 = await toBase64(file)

  onStep('Analizando factura con Gemini...')
  return analyzeWithGemini(base64, file.type)
}
