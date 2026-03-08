import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Property } from '../types'

export default function PropertiesView() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [acres, setAcres] = useState('')
  const [isStandard, setIsStandard] = useState(true)

  useEffect(() => { loadProperties() }, [])

  async function loadProperties() {
    setLoading(true)
    const { data } = await supabase.from('properties').select('*').order('name')
    if (data) setProperties(data)
    setLoading(false)
  }

  function startEdit(p: Property) {
    setEditId(p.id)
    setName(p.name)
    setAcres(p.acres_total?.toString() || '')
    setIsStandard(p.is_standard_billing)
    setShowForm(true)
  }

  async function handleSave() {
    const data = {
      name,
      acres_total: acres ? parseFloat(acres) : null,
      is_standard_billing: isStandard,
    }
    if (editId) {
      await supabase.from('properties').update(data).eq('id', editId)
    } else {
      await supabase.from('properties').insert(data)
    }
    setShowForm(false)
    setEditId(null)
    setName('')
    setAcres('')
    setIsStandard(true)
    loadProperties()
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('properties').update({ active: !active }).eq('id', id)
    loadProperties()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold" style={{ fontFamily: 'Oswald' }}>Properties</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setName(''); setAcres(''); setIsStandard(true) }}
          className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-sm px-4 py-2 rounded-lg transition">
          + Add Property
        </button>
      </div>

      {showForm && (
        <div className="bg-[#242442] border border-[#3a3a5a] rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Oswald' }}>
            {editId ? 'Edit Property' : 'Add Property'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-[#2a2a4a] border border-[#3a3a5a] rounded px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Total Acres</label>
              <input type="number" step="0.01" value={acres} onChange={e => setAcres(e.target.value)}
                className="w-full bg-[#2a2a4a] border border-[#3a3a5a] rounded px-3 py-2 text-white text-sm" />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={isStandard} onChange={e => setIsStandard(e.target.checked)}
                  className="rounded" />
                Standard Billing ($85/ac)
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave}
              className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-4 py-2 rounded-lg text-sm transition">Save</button>
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm transition">Cancel</button>
          </div>
        </div>
      )}

      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#3a3a5a] text-left text-gray-400">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Acres</th>
                <th className="pb-2 pr-4">Billing</th>
                <th className="pb-2 pr-4">Rate</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map(p => (
                <tr key={p.id} className={`border-b border-[#3a3a5a]/50 hover:bg-[#242442] ${!p.active ? 'opacity-50' : ''}`}>
                  <td className="py-2 pr-4 font-medium">{p.name}</td>
                  <td className="py-2 pr-4">{p.acres_total || '—'}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded ${p.is_standard_billing ? 'bg-blue-900/50 text-blue-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                      {p.is_standard_billing ? 'Standard' : 'Discount'}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-400">${p.is_standard_billing ? '85' : '30'}/ac</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs ${p.active ? 'text-green-400' : 'text-red-400'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(p)} className="text-blue-400 hover:text-blue-300 text-xs">Edit</button>
                      <button onClick={() => toggleActive(p.id, p.active)}
                        className={`text-xs ${p.active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}>
                        {p.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
