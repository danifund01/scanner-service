import { useState } from 'react'
import { processInvoiceImage } from '../services/visionService'
import { insertFactura } from '../services/facturaService'

export default function InvoiceForm({ onFacturaCreada }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  function handleFileChange(e) {
    const selected = e.target.files[0]
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setResult(null)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setStep('')
    setError(null)
    setResult(null)

    try {
      const extracted = await processInvoiceImage(file, setStep)

      setStep('Guardando en base de datos...')
      await insertFactura(extracted)

      setResult(extracted)
      onFacturaCreada(extracted)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setStep('')
    }
  }

  return (
    <section className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">
          Procesar factura
        </h2>
        <p className="text-zinc-500 text-sm mt-1">
          Sube una imagen de tu factura y extraeremos los datos automáticamente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Zona de carga */}
        <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-900 hover:border-emerald-600 hover:bg-zinc-800/50 transition-colors cursor-pointer">
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {file ? (
              <span className="text-emerald-400 text-sm font-medium">{file.name}</span>
            ) : (
              <>
                <span className="text-zinc-300 text-sm font-medium">Haz click para subir una imagen</span>
                <span className="text-zinc-600 text-xs">JPG, PNG o WEBP</span>
              </>
            )}
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Preview de imagen */}
        {preview && (
          <div className="flex justify-center">
            <img
              src={preview}
              alt="Vista previa"
              className="max-h-56 rounded-lg border border-zinc-700 object-contain"
            />
          </div>
        )}

        {/* Botón con indicador de paso activo */}
        <button
          type="submit"
          disabled={!file || loading}
          className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {step || 'Procesando...'}
            </span>
          ) : 'Procesar factura'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-5 flex items-start gap-3 bg-red-950/50 border border-red-800 rounded-lg px-4 py-3">
          <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-widest">
              Datos extraídos
            </h3>
          </div>
          <div className="flex flex-col gap-3">
            <ResultRow label="Proveedor" value={result.proveedor} />
            <ResultRow label="Monto total" value={result.monto} highlight />
            <ResultRow label="N° Factura" value={result.numero_factura} />
          </div>
        </div>
      )}
    </section>
  )
}

function ResultRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-zinc-800 last:border-0">
      <span className="text-zinc-500 text-sm">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-emerald-400' : 'text-zinc-100'}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}
