import { useState, useEffect, useRef } from 'react'
import { searchFacturas, deleteFactura } from '../services/facturaService'
import ConfirmModal from './ConfirmModal'

export default function FacturasList({ facturas, loading, error, onEliminar }) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState(null)

  const [facturaAEliminar, setFacturaAEliminar] = useState(null)
  const [deletando, setDeletando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState(null)

  // Referencia para cancelar búsquedas desactualizadas
  const searchId = useRef(0)

  // Dispara la búsqueda en Supabase con debounce de 400ms
  useEffect(() => {
    if (query.trim() === '') {
      setResultados([])
      setErrorBusqueda(null)
      return
    }

    const id = ++searchId.current
    setBuscando(true)
    setErrorBusqueda(null)

    const timer = setTimeout(async () => {
      try {
        const data = await searchFacturas(query.trim())
        if (id !== searchId.current) return // resultado desactualizado, ignorar
        setResultados(data)
      } catch (err) {
        if (id !== searchId.current) return
        setErrorBusqueda(err.message)
      } finally {
        if (id === searchId.current) setBuscando(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query])

  // Lista a mostrar: resultados de búsqueda o listado completo
  const listaVisible = query.trim() !== '' ? resultados : facturas
  const hayBusquedaActiva = query.trim() !== ''

  function abrirModal(factura) {
    setFacturaAEliminar(factura)
    setErrorEliminar(null)
  }

  function cerrarModal() {
    if (deletando) return
    setFacturaAEliminar(null)
    setErrorEliminar(null)
  }

  async function confirmarEliminar() {
    setDeletando(true)
    setErrorEliminar(null)
    try {
      await deleteFactura(facturaAEliminar.id)
      onEliminar(facturaAEliminar.id)
      // Si hay búsqueda activa, quitar también del listado de resultados
      if (hayBusquedaActiva) {
        setResultados((prev) => prev.filter((f) => f.id !== facturaAEliminar.id))
      }
      setFacturaAEliminar(null)
    } catch (err) {
      setErrorEliminar(err.message)
    } finally {
      setDeletando(false)
    }
  }

  // Estado de carga general (carga inicial o búsqueda en curso)
  const mostrarSkeleton = loading || buscando

  return (
    <section className="w-full mt-14">

      {/* Encabezado + buscador */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">
            Facturas procesadas
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Historial de facturas almacenadas en la base de datos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Input de búsqueda */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar proveedor..."
              className="w-56 pl-9 pr-8 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-600 transition-colors"
            />
            {/* Spinner dentro del input mientras busca */}
            {buscando && (
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {/* Botón limpiar búsqueda */}
            {query && !buscando && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Badge de conteo */}
          {!loading && !error && !buscando && (
            <span className="text-xs font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full whitespace-nowrap">
              {listaVisible.length} {hayBusquedaActiva ? 'resultados' : 'registros'}
            </span>
          )}
        </div>
      </div>

      {/* Error de carga inicial */}
      {!loading && error && (
        <div className="flex items-start gap-3 bg-red-950/50 border border-red-800 rounded-lg px-4 py-3 mb-4">
          <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Error de búsqueda */}
      {!buscando && errorBusqueda && (
        <div className="flex items-start gap-3 bg-red-950/50 border border-red-800 rounded-lg px-4 py-3 mb-4">
          <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-red-400 text-sm">{errorBusqueda}</p>
        </div>
      )}

      {/* Skeleton: carga inicial o búsqueda en curso */}
      {mostrarSkeleton && (
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 grid grid-cols-4 gap-4 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded col-span-1" />
              <div className="h-4 bg-zinc-800 rounded col-span-1" />
              <div className="h-4 bg-zinc-800 rounded col-span-1 ml-auto w-2/3" />
              <div className="h-4 bg-zinc-800 rounded col-span-1 ml-auto w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {!mostrarSkeleton && !error && !errorBusqueda && listaVisible.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800 rounded-xl">
          <svg className="w-8 h-8 text-zinc-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {hayBusquedaActiva ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            )}
          </svg>
          <p className="text-zinc-500 text-sm">
            {hayBusquedaActiva
              ? `No se encontraron facturas para "${query}".`
              : 'No hay facturas registradas aún.'}
          </p>
          {hayBusquedaActiva && (
            <button onClick={() => setQuery('')} className="mt-3 text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}

      {/* Listado */}
      {!mostrarSkeleton && !error && !errorBusqueda && listaVisible.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_80px] px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-widest">
            <span>Proveedor</span>
            <span>N° Factura</span>
            <span className="text-right">Monto</span>
            <span className="text-right">Fecha</span>
            <span className="text-center">Acciones</span>
          </div>
          {listaVisible.map((factura, index) => (
            <div
              key={factura.id ?? index}
              className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_80px] items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3.5 transition-colors group"
            >
              <span className="text-zinc-100 font-medium text-sm truncate">
                {factura.proveedor ?? '—'}
              </span>
              <span className="text-zinc-400 text-sm">
                {factura.numero_factura ?? '—'}
              </span>
              <span className="text-emerald-400 font-semibold text-sm sm:text-right">
                {factura.monto ?? '—'}
              </span>
              <span className="text-zinc-600 text-xs sm:text-right">
                {new Date(factura.created_at).toLocaleDateString('es', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <div className="flex items-center justify-center gap-1">
                {/* Ver archivo */}
                {factura.archivo_url && (
                  <a
                    href={factura.archivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors"
                    title="Ver archivo original"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                )}
                {/* Eliminar */}
                <button
                  onClick={() => abrirModal(factura)}
                  className="p-1.5 rounded-lg text-zinc-600 cursor-pointer hover:text-red-400 hover:bg-red-950/40 transition-colors"
                  title="Eliminar factura"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación */}
      {facturaAEliminar && (
        <ConfirmModal
          factura={facturaAEliminar}
          deletando={deletando}
          error={errorEliminar}
          onConfirmar={confirmarEliminar}
          onCancelar={cerrarModal}
        />
      )}
    </section>
  )
}
