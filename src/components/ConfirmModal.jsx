export default function ConfirmModal({ factura, deletando, error, onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        onClick={!deletando ? onCancelar : undefined}
      />

      {/* Card */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        {/* Ícono de advertencia */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-950/60 border border-red-800 mx-auto mb-5">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        {/* Texto */}
        <h3 className="text-zinc-100 font-semibold text-center text-lg mb-1">
          ¿Eliminar factura?
        </h3>
        <p className="text-zinc-500 text-sm text-center mb-5">
          Esta acción no se puede deshacer. Se eliminará permanentemente el registro de la base de datos.
        </p>

        {/* Detalle de la factura a eliminar */}
        <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-3 mb-5 flex flex-col gap-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Proveedor</span>
            <span className="text-zinc-200 font-medium">{factura.proveedor ?? '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">N° Factura</span>
            <span className="text-zinc-200">{factura.numero_factura ?? '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Monto</span>
            <span className="text-emerald-400 font-semibold">{factura.monto ?? '—'}</span>
          </div>
        </div>

        {/* Error de eliminación */}
        {error && (
          <div className="flex items-start gap-2 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2.5 mb-4">
            <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            disabled={deletando}
            className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={deletando}
            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deletando ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Eliminando...
              </span>
            ) : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
