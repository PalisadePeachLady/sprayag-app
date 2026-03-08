import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Chemical } from '../types'

const emptyChemical = {
  product_name: '', chemical_name: '', price_per_unit: '',
  price_unit: '', crop_type: '', target_pest: '', rates_per_acre: '',
  gallons_per_acre: '', psi_rpm: '', time_of_year: '', pre_harvest_interval: '',
}

export default function ChemicalLibrary() {
  const [chemicals, setChemicals] = useState<Chemical[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyChemical)
  const [search, setSearch] = useState('')

  useEffect(() => { loadChemicals() }, [])

  async function loadChemicals() {
    setLoading(true)
    const { data } = await supabase.from('chemicals').select('*').order('product_name')
    if (data) setChemicals(data)
    setLoading(false)
  }

  function startEdit(chem: Chemical) {
    setEditId(chem.id)
    setForm({
      product_name: chem.product_name,
      chemical_name: chem.chemical_name || '',
      price_per_unit: chem.price_per_unit?.toString() || '',
      price_unit: chem.price_unit || '',
      crop_type: chem.crop_type || '',
      target_pest: chem.target_pest || '',
      rates_per_acre: chem.rates_per_acre || '',
      gallons_per_acre: chem.gallons_per_acre?.toString() || '',
      psi_rpm: chem.psi_rpm || '',
      time_of_year: chem.time_of_year || '',
      pre_harvest_interval: chem.pre_harvest_interval || '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    const data = {
      product_name: form.product_name,
      chemical_name: form.chemical_name || null,
      price_per_unit: form.price_per_unit ? parseFloat(form.price_per_unit) : null,
      price_unit: form.price_unit || null,
      crop_type: form.crop_type || null,
      target_pest: form.target_pest || null,
      rates_per_acre: form.rates_per_acre || null,
      gallons_per_acre: form.gallons_per_acre ? parseFloat(form.gallons_per_acre) : null,
      psi_rpm: form.psi_rpm || null,
      time_of_year: form.time_of_year || null,
      pre_harvest_interval: form.pre_harvest_interval || null,
    }

    if (editId) {
      await supabase.from('chemicals').update(data).eq('id', editId)
    } else {
      await supabase.from('chemicals').insert(data)
    }
    setShowForm(false)
    setEditId(null)
    setForm(emptyChemical)
    loadChemicals()
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('chemicals').update({ active: !active }).eq('id', id)
    loadChemicals()
  }

  const filtered = chemicals.filter(c =>
    c.product_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.chemical_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.crop_type || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <h2 className="text-xl font-semibold" style={{ fontFamily: 'Oswald' }}>Chemical Library</h2>
        <div className="flex gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="bg-[#2a2a4a] border border-[#3a3a5a] rounded-lg px-3 py-2 text-white text-sm" />
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyChemical) }}
            className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-sm px-4 py-2 rounded-lg transition">
            + Add Chemical
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-[#242442] border border-[#3a3a5a] rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Oswald' }}>
            {editId ? 'Edit Chemical' : 'Add Chemical'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(emptyChemical).map(([key]) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{key.replace(/_/g, ' ')}</label>
                <input value={form[key as keyof typeof form]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-[#2a2a4a] border border-[#3a3a5a] rounded px-3 py-2 text-white text-sm" />
              </div>
            ))}
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
                <th className="pb-2 pr-3">Product</th>
                <th className="pb-2 pr-3">Chemical</th>
                <th className="pb-2 pr-3">Price</th>
                <th className="pb-2 pr-3">Unit</th>
                <th className="pb-2 pr-3">Crop</th>
                <th className="pb-2 pr-3">Target</th>
                <th className="pb-2 pr-3">Rate/Acre</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className={`border-b border-[#3a3a5a]/50 hover:bg-[#242442] ${!c.active ? 'opacity-50' : ''}`}>
                  <td className="py-2 pr-3 font-medium">{c.product_name}</td>
                  <td className="py-2 pr-3 text-gray-400">{c.chemical_name || '—'}</td>
                  <td className="py-2 pr-3 text-green-400">{c.price_per_unit ? `$${c.price_per_unit}` : '—'}</td>
                  <td className="py-2 pr-3">{c.price_unit || '—'}</td>
                  <td className="py-2 pr-3 text-gray-400 max-w-[100px] truncate">{c.crop_type || '—'}</td>
                  <td className="py-2 pr-3 text-gray-400 max-w-[120px] truncate">{c.target_pest || '—'}</td>
                  <td className="py-2 pr-3 text-gray-400">{c.rates_per_acre || '—'}</td>
                  <td className="py-2 pr-3">
                    <span className={`text-xs ${c.active ? 'text-green-400' : 'text-red-400'}`}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(c)} className="text-blue-400 hover:text-blue-300 text-xs">Edit</button>
                      <button onClick={() => toggleActive(c.id, c.active)}
                        className={`text-xs ${c.active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}>
                        {c.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-gray-500 text-xs mt-2">{filtered.length} chemicals</p>
        </div>
      )}
    </div>
  )
}
