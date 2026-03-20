import { useState, useEffect } from 'react'
import { fetchFacturas } from './services/facturaService'
import InvoiceForm from './components/InvoiceForm'
import FacturasList from './components/FacturasList'
import './App.css'

function App() {
  const [facturas, setFacturas] = useState([])
  const [loadingFacturas, setLoadingFacturas] = useState(true)
  const [errorFacturas, setErrorFacturas] = useState(null)

  useEffect(() => {
    fetchFacturas()
      .then(setFacturas)
      .catch((err) => setErrorFacturas(err.message))
      .finally(() => setLoadingFacturas(false))
  }, [])

  function handleFacturaCreada(nueva) {
    setFacturas((prev) => [{ ...nueva, created_at: new Date().toISOString() }, ...prev])
  }

  function handleEliminar(id) {
    setFacturas((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <>
      <header className="w-full px-6 py-4 bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <span className="font-semibold text-zinc-100 tracking-tight text-lg">Scanner Service</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10">
        <InvoiceForm onFacturaCreada={handleFacturaCreada} />
        <FacturasList facturas={facturas} loading={loadingFacturas} error={errorFacturas} onEliminar={handleEliminar} />
      </main>
    </>
  )
}

export default App
