import { useState, useRef } from 'react'
import { processInvoiceImage } from '../services/visionService'
import { insertFactura, uploadArchivo } from '../services/facturaService'

export default function InvoiceForm({ onFacturaCreada }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  function selectFile(selected) {
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setResult(null)
    setError(null)
  }

  function handleFileChange(e) {
    selectFile(e.target.files[0])
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setDragging(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (!dropped) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(dropped.type)) {
      setError('Formato no permitido. Usa JPG, PNG, WEBP o PDF.')
      return
    }
    selectFile(dropped)
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

      setStep('Subiendo archivo...')
      const archivo_url = await uploadArchivo(file)

      setStep('Guardando en base de datos...')
      await insertFactura({ ...extracted, archivo_url })

      setResult(extracted)
      onFacturaCreada({ ...extracted, archivo_url })
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
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl transition-colors cursor-pointer
            ${dragging
              ? 'border-emerald-500 bg-emerald-950/30'
              : 'border-zinc-700 bg-zinc-900 hover:border-emerald-600 hover:bg-zinc-800/50'
            }`}
        >
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <svg className={`w-8 h-8 ${dragging ? 'text-emerald-400' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {file ? (
              <span className="text-emerald-400 text-sm font-medium">{file.name}</span>
            ) : (
              <>
                <span className="text-zinc-300 text-sm font-medium">
                  {dragging ? 'Suelta la imagen aquí' : 'Arrastra o haz click para subir'}
                </span>
                <span className="text-zinc-600 text-xs">JPG, PNG, WEBP o PDF</span>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Preview: imagen o indicador de PDF */}
        {preview && (
          <div className="flex justify-center">
            {file?.type === 'application/pdf' ? (
              <div className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3">
                <svg className="w-8 h-8 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-zinc-200 text-sm font-medium">{file.name}</span>
                  <span className="text-zinc-500 text-xs">PDF listo para procesar</span>
                </div>
              </div>
            ) : (
              <img
                src={preview}
                alt="Vista previa"
                className="max-h-56 rounded-lg border border-zinc-700 object-contain"
              />
            )}
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
