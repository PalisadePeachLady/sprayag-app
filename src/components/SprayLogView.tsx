import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Property, SprayLog } from '../types'

export default function SprayLogView() {
  const [logs, setLogs] = useState<SprayLog[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [filterProperty, setFilterProperty] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: props }, { data: logsData }] = await Promise.all([
      supabase.from('properties').select('*').order('name'),
      supabase.from('spray_logs')
        .select('*, property:properties(name, is_standard_billing), spray_log_chemicals(*, chemical:chemicals(product_name, price_unit))')
        .order('spray_date', { ascending: false })
        .limit(200),
    ])
    if (props) setProperties(props)
    if (logsData) setLogs(logsData)
    setLoading(false)
  }

  async function deleteLog(id: string) {
    if (!confirm('Delete this spray log?')) return
    await supabase.from('spray_logs').delete().eq('id', id)
    loadData()
  }

  async function saveEdit(id: string) {
    await supabase.from('spray_logs').update({ notes: editNotes }).eq('id', id)
    setEditingId(null)
    loadData()
  }

  const filtered = logs.filter(log => {
    if (filterProperty && log.property_id !== filterProperty) return false
    if (startDate && log.spray_date < startDate) return false
    if (endDate && log.spray_date > endDate) return false
    return true
  })

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: 'Oswald' }}>Spray Log</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
          className="bg-[#2a2a4a] border border-[#3a3a5a] rounded-lg px-3 py-2 text-white text-sm">
          <option value="">All Properties</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="bg-[#2a2a4a] border border-[#3a3a5a] rounded-lg px-3 py-2 text-white text-sm" />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="bg-[#2a2a4a] border border-[#3a3a5a] rounded-lg px-3 py-2 text-white text-sm" />
        {(filterProperty || startDate || endDate) && (
          <button onClick={() => { setFilterProperty(''); setStartDate(''); setEndDate('') }}
            className="text-sm text-gray-400 hover:text-white">Clear</button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#3a3a5a] text-left text-gray-400">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Property</th>
                <th className="pb-2 pr-4">Acres</th>
                <th className="pb-2 pr-4">Hours</th>
                <th className="pb-2 pr-4">Chemicals</th>
                <th className="pb-2 pr-4">Chem Cost</th>
                <th className="pb-2 pr-4">Notes</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const chemCost = log.spray_log_chemicals?.reduce((s, c) => s + (c.total_cost || 0), 0) || 0
                const propData = log.property as unknown as { name: string } | null
                return (
                  <tr key={log.id} className="border-b border-[#3a3a5a]/50 hover:bg-[#242442]">
                    <td className="py-2 pr-4">{log.spray_date}</td>
                    <td className="py-2 pr-4">{propData?.name || '—'}</td>
                    <td className="py-2 pr-4">{log.acres_sprayed}</td>
                    <td className="py-2 pr-4">{log.hours_to_spray || '—'}</td>
                    <td className="py-2 pr-4 max-w-[200px] truncate">
                      {log.spray_log_chemicals?.map(slc => {
                        const chem = slc.chemical as unknown as { product_name: string } | null
                        return chem?.product_name
                      }).filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="py-2 pr-4 text-green-400">${chemCost.toFixed(2)}</td>
                    <td className="py-2 pr-4 max-w-[150px]">
                      {editingId === log.id ? (
                        <div className="flex gap-1">
                          <input value={editNotes} onChange={e => setEditNotes(e.target.value)}
                            className="bg-[#2a2a4a] border border-[#3a3a5a] rounded px-2 py-1 text-white text-xs w-full" />
                          <button onClick={() => saveEdit(log.id)} className="text-green-400 text-xs">Save</button>
                        </div>
                      ) : (
                        <span className="text-gray-400 truncate block">{log.notes || '—'}</span>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingId(log.id); setEditNotes(log.notes || '') }}
                          className="text-blue-400 hover:text-blue-300 text-xs">Edit</button>
                        <button onClick={() => deleteLog(log.id)}
                          className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-gray-500 text-center py-4">No spray logs found</p>}
        </div>
      )}
    </div>
  )
}
