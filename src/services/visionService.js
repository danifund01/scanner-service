// ---------------------------------------------------------------------------
// CLAUDE API — comentado, reemplazado por Google Cloud Vision
// ---------------------------------------------------------------------------
// import Anthropic from '@anthropic-ai/sdk'
// ...
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GOOGLE CLOUD VISION — implementación activa
// ---------------------------------------------------------------------------

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('No se pudo leer el archivo. Intenta con otra imagen.'))
    reader.readAsDataURL(file)
  })
}

const VISION_ERROR_MESSAGES = {
  400: 'La imagen no es válida o está corrupta.',
  401: 'API key de Google Vision incorrecta. Verifica tu configuración.',
  403: 'Sin permisos para usar Google Cloud Vision. Verifica que la API esté habilitada.',
  429: 'Límite de solicitudes alcanzado. Espera unos segundos e intenta de nuevo.',
  500: 'Error interno en Google Cloud Vision. Intenta de nuevo más tarde.',
}

async function getTextFromVision(base64) {
  const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          },
        ],
      }),
    })
  } catch {
    throw new Error('Sin conexión a internet. Verifica tu red e intenta de nuevo.')
  }

  if (!response.ok) {
    const message = VISION_ERROR_MESSAGES[response.status]
    if (message) throw new Error(message)
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message ?? 'Error al conectar con Google Cloud Vision.')
  }

  const data = await response.json()
  const fullText = data.responses?.[0]?.fullTextAnnotation?.text

  if (!fullText) throw new Error('No se detectó texto en la imagen. Asegúrate de que la imagen sea legible y muestre una factura.')

  return fullText
}

function extractInvoiceFields(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  // Número de factura — busca patrones como: Factura #001, N° 0001, Invoice No. 123, Folio: ABC-001
  const invoiceMatch = text.match(
    /(?:factura\s*n[°º.]?\s*|invoice\s*(?:no\.?|#|number:?)\s*|folio:?\s*|n[°º]\s*)([A-Z0-9\-\/]+)/i
  )
  const numero_factura = invoiceMatch ? invoiceMatch[1].trim() : null

  // Monto total — busca patrones como: Total: $1,200.00 | TOTAL USD 500 | Monto Total: S/. 300
  const montoMatch = text.match(
    /(?:total\s*(?:a\s*pagar|general|facturado)?|monto\s*total|gran\s*total|amount\s*due)[^\d$€£S]*([S]\/\.?\s*|[$€£¥]|\bUSD\b|\bMXN\b|\bPEN\b|\bCLP\b)?\s*([\d.,]+)/i
  )
  const monto = montoMatch ? `${montoMatch[1] ?? ''}${montoMatch[2]}`.trim() : null

  // Proveedor — generalmente la primera línea de texto significativa es el nombre de la empresa emisora
  const proveedor = lines.find(
    (line) =>
      line.length > 3 &&
      !/^(factura|invoice|fecha|date|ruc|rfc|cuit|nit|tel|fax|www|http)/i.test(line) &&
      !/^\d/.test(line)
  ) ?? null

  return { proveedor, monto, numero_factura }
}

export async function processInvoiceImage(file, onStep) {
  onStep('Leyendo imagen...')
  const base64 = await toBase64(file)

  onStep('Analizando factura con OCR...')
  const rawText = await getTextFromVision(base64)

  onStep('Extrayendo datos...')
  return extractInvoiceFields(rawText)
}
