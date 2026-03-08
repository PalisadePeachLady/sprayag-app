import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Property, Chemical, SprayLog, ChemicalEntry } from '../types'

function getTodayMT(): string {
  const now = new Date()
  const mt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Denver' }))
  return mt.toISOString().split('T')[0]
}

export default function BrandonSpray() {
  const [properties, setProperties] = useState<Property[]>([])
  const [chemicals, setChemicals] = useState<Chemical[]>([])
  const [recentLogs, setRecentLogs] = useState<SprayLog[]>([])

  const [sprayDate, setSprayDate] = useState(getTodayMT())
  const [propertyId, setPropertyId] = useState('')
  const [acresSprayed, setAcresSprayed] = useState('')
  const [hoursToSpray, setHoursToSpray] = useState('')
  const [notes, setNotes] = useState('')
  const [chemicalEntries, setChemicalEntries] = useState<ChemicalEntry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [{ data: props }, { data: chems }, { data: logs }] = await Promise.all([
      supabase.from('properties').select('*').eq('active', true).order('name'),
      supabase.from('chemicals').select('*').eq('active', true).order('product_name'),
      supabase.from('spray_logs').select('*, property:properties(name), spray_log_chemicals(*, chemical:chemicals(product_name))').order('spray_date', { ascending: false }).limit(10),
    ])
    if (props) setProperties(props)
    if (chems) setChemicals(chems)
    if (logs) setRecentLogs(logs)
  }

  function handlePropertyChange(id: string) {
    setPropertyId(id)
    const prop = properties.find(p => p.id === id)
    if (prop?.acres_total) setAcresSprayed(String(prop.acres_total))
  }

  function addChemical() {
    setChemicalEntries([...chemicalEntries, { chemical_id: '', quantity_used: 0, unit: '', cost_per_unit: 0, total_cost: 0 }])
  }

  function updateChemicalEntry(index: number, field: keyof ChemicalEntry, value: string | number) {
    const updated = [...chemicalEntries]
    const entry = { ...updated[index] }

    if (field === 'chemical_id') {
      const chem = chemicals.find(c => c.id === value)
      entry.chemical_id = value as string
      entry.unit = chem?.price_unit || ''
      entry.cost_per_unit = chem?.price_per_unit || 0
      entry.total_cost = entry.quantity_used * entry.cost_per_unit
    } else if (field === 'quantity_used') {
      entry.quantity_used = Number(value)
      entry.total_cost = Number(value) * entry.cost_per_unit
    } else if (field === 'cost_per_unit') {
      entry.cost_per_unit = Number(value)
      entry.total_cost = entry.quantity_used * Number(value)
    } else {
      (entry as Record<string, unknown>)[field] = value
    }

    updated[index] = entry
    setChemicalEntries(updated)
  }

  function removeChemical(index: number) {
    setChemicalEntries(chemicalEntries.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!propertyId || !acresSprayed) {
      setMessage('Please fill in required fields')
      return
    }
    setSubmitting(true)
    setMessage('')

    const { data: log, error: logError } = await supabase
      .from('spray_logs')
      .insert({
        spray_date: sprayDate,
        property_id: propertyId,
        acres_sprayed: parseFloat(acresSprayed),
        hours_to_spray: hoursToSpray ? parseFloat(hoursToSpray) : null,
        notes: notes || null,
        created_by: 'brandon',
      })
      .select()
      .single()

    if (logError || !log) {
      setMessage('Error saving spray log: ' + (logError?.message || 'Unknown error'))
      setSubmitting(false)
      return
    }

    if (chemicalEntries.length > 0) {
      const chemRows = chemicalEntries
        .filter(e => e.chemical_id)
        .map(e => ({
          spray_log_id: log.id,
          chemical_id: e.chemical_id,
          quantity_used: e.quantity_used,
          unit: e.unit,
          cost_per_unit: e.cost_per_unit,
          total_cost: e.total_cost,
        }))

      if (chemRows.length > 0) {
        const { error: chemError } = await supabase.from('spray_log_chemicals').insert(chemRows)
        if (chemError) {
          setMessage('Log saved but error saving chemicals: ' + chemError.message)
          setSubmitting(false)
          return
        }
      }
    }

    setMessage('Spray log saved!')
    setPropertyId('')
    setAcresSprayed('')
    setHoursToSpray('')
    setNotes('')
    setChemicalEntries([])
    setSprayDate(getTodayMT())
    setSubmitting(false)
    loadData()
  }

  const totalChemCost = chemicalEntries.reduce((sum, e) => sum + (e.total_cost || 0), 0)

  return (
    <div className="min-h-screen bg-[#1a1a2e] pb-8">
      <header className="bg-[#242442] border-b border-[#3a3a5a] px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Oswald' }}>
            <span className="text-[#2E7D32]">Spray</span>Ag
          </h1>
          <a href="/manager" className="text-sm text-gray-400 hover:text-white">Manager</a>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 mt-6">
        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: 'Oswald' }}>Log Spray Application</h2>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('Error') || message.includes('error') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Date</label>
            <input type="date" value={sprayDate} onChange={e => setSprayDate(e.target.value)}
              className="w-full bg-[#2a2a4a] border border-[#3a3a5a] rounded-lg px-3 py-2 text-white" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Property *</label>
            <select value={propertyId} onChange={e => handlePropertyChange(e.target.value)}
              className="w-full bg-[#2a2a4a] border border-[#3a3a5a] rounded-lg px-3 py-2 text-white">
              <option value="">Select property...</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.acres_total} ac)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Acres Sprayed *</label>
              <input type="number" step="0.01" value={acresSprayed} onChange={e => setAcresSprayed(e.target.value)}
                className="w-full bg-[#2a2a4a] border border-[#3a3a5a] rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Hours</label>
              <input type="number" step="0.5" value={hoursToSpray} onChange={e => setHoursToSpray(e.target.value)}
                className="w-full bg-[#2a2a4a] border border-[#3a3a5a] rounded-lg px-3 py-2 text-white" />
            </div>
          </div>

          {/* Chemicals Section */}
          <div className="bg-[#242442] border border-[#3a3a5a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold" style={{ fontFamily: 'Oswald' }}>Chemicals</h3>
              <button type="button" onClick={addChemical}
                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-sm px-3 py-1 rounded-lg transition">
                + Add Chemical
              </button>
            </div>

            {chemicalEntries.map((entry, idx) => (
              <div key={idx} className="mb-3 p-3 bg-[#1a1a2e] rounded-lg border border-[#3a3a5a]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Chemical #{idx + 1}</span>
                  <button type="button" onClick={() => removeChemical(idx)} className="text-red-400 text-sm hover:text-red-300">Remove</button>
                </div>
                <select value={entry.chemical_id} onChange={e => updateChemicalEntry(idx, 'chemical_id', e.target.value)}
                  className="w-full bg-[#2a2a4a] border border-[#3a3a5a] rounded-lg px-3 py-2 text-white text-sm mb-2">
                  <option value="">Select chemical...</option>
                  {chemicals.map(c => (
                    <option key={c.id} value={c.id}>{c.product_name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400">Qty</label>
                    <input type="number" step="0.01" value={entry.quantity_used || ''} onChange={e => updateChemicalEntry(idx, 'quantity_used', e.target.value)}
                      className="w-full bg-[#2a2a4a] border border-[#3a3a5a] rounded px-2 py-1 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400">Unit Cost</label>
                    <input type="number" step="0.01" value={entry.cost_per_unit || ''} onChange={e => updateChemicalEntry(idx, 'cost_per_unit', e.target.value)}
                      className="w-full bg-[#2a2a4a] border border-[#3a3a5a] rounded px-2 py-1 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400">Total ({entry.unit})</label>
                    <div className="bg-[#2a2a4a] border border-[#3a3a5a] rounded px-2 py-1 text-green-400 text-sm">
                      ${entry.total_cost.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {chemicalEntries.length > 0 && (
              <div className="text-right text-green-400 font-semibold mt-2">
                Total Chemical Cost: ${totalChemCost.toFixed(2)}
              </div>
            )}

            {chemicalEntries.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">No chemicals added yet</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full bg-[#2a2a4a] border border-[#3a3a5a] rounded-lg px-3 py-2 text-white" />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition text-lg">
            {submitting ? 'Saving...' : 'Submit Spray Log'}
          </button>
        </form>

        {/* Recent Entries */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Oswald' }}>Recent Entries</h3>
          {recentLogs.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent entries</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map(log => (
                <div key={log.id} className="bg-[#242442] border border-[#3a3a5a] rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold text-white">{(log.property as unknown as Property)?.name || 'Unknown'}</span>
                      <span className="text-sm text-gray-400 ml-2">{log.spray_date}</span>
                    </div>
                    <span className="text-sm text-green-400">{log.acres_sprayed} ac</span>
                  </div>
                  {log.spray_log_chemicals && log.spray_log_chemicals.length > 0 && (
                    <div className="mt-1 text-sm text-gray-400">
                      {log.spray_log_chemicals.map((slc) =>
                        (slc.chemical as unknown as Chemical)?.product_name
                      ).filter(Boolean).join(', ')}
                      <span className="text-green-400 ml-2">
                        ${log.spray_log_chemicals.reduce((sum: number, slc) => sum + (slc.total_cost || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {log.notes && <p className="text-sm text-gray-500 mt-1">{log.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

