import { useState, useEffect } from 'react'
import SprayLogView from '../components/SprayLogView'
import InvoiceSummary from '../components/InvoiceSummary'
import ChemicalLibrary from '../components/ChemicalLibrary'
import PropertiesView from '../components/PropertiesView'

const MANAGER_PASSWORD = import.meta.env.VITE_MANAGER_PASSWORD || 'SprayAg2026!'

export default function ManagerDashboard() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('spray-log')

  useEffect(() => {
    if (sessionStorage.getItem('manager_auth') === 'true') {
      setAuthenticated(true)
    }
  }, [])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password.trim() === MANAGER_PASSWORD.trim()) {
      setAuthenticated(true)
      sessionStorage.setItem('manager_auth', 'true')
    } else {
      setError('Incorrect password')
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4">
        <div className="bg-[#242442] border border-[#3a3a5a] rounded-xl p-8 max-w-sm w-full">
          <h1 className="text-2xl font-bold text-center mb-6" style={{ fontFamily: 'Oswald' }}>
            <span className="text-[#2E7D32]">Spray</span>Ag <span className="text-gray-400 text-lg">Manager</span>
          </h1>
          <form onSubmit={handleLogin}>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Enter password"
              className="w-full bg-[#2a2a4a] border border-[#3a3a5a] rounded-lg px-4 py-3 text-white mb-4" />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button type="submit" className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold py-3 rounded-lg transition">
              Sign In
            </button>
          </form>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'spray-log', label: 'Spray Log' },
    { id: 'invoices', label: 'Invoice Summary' },
    { id: 'chemicals', label: 'Chemical Library' },
    { id: 'properties', label: 'Properties' },
  ]

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <header className="bg-[#242442] border-b border-[#3a3a5a] px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Oswald' }}>
            <span className="text-[#2E7D32]">Spray</span>Ag <span className="text-gray-400 text-lg">Manager</span>
          </h1>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-400 hover:text-white">Field App</a>
            <button onClick={() => { sessionStorage.removeItem('manager_auth'); setAuthenticated(false) }}
              className="text-sm text-red-400 hover:text-red-300">Sign Out</button>
          </div>
        </div>
      </header>

      <nav className="bg-[#242442] border-b border-[#3a3a5a] px-4">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#2E7D32] text-[#2E7D32]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'spray-log' && <SprayLogView />}
        {activeTab === 'invoices' && <InvoiceSummary />}
        {activeTab === 'chemicals' && <ChemicalLibrary />}
        {activeTab === 'properties' && <PropertiesView />}
      </main>
    </div>
  )
}
