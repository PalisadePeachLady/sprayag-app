import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Property, SprayInvoice } from '../types'
import InvoicePDF from './InvoicePDF'

interface PropertySummary {
  property: Property
  totalAcres: number
  serviceFee: number
  chemicalCost: number
  surcharge: number
  total: number
  sprayCount: number
}

export default function InvoiceSummary() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [summaries, setSummaries] = useState<PropertySummary[]>([])
  const [invoices, setInvoices] = useState<SprayInvoice[]>([])
  const [loading, setLoading] = useState(false)
  const [pdfData, setPdfData] = useState<PropertySummary | null>(null)
  const [pdfInvoiceNumber, setPdfInvoiceNumber] = useState('')

  useEffect(() => { loadInvoices() }, [])

  async function loadInvoices() {
    const { data } = await supabase.from('spray_invoices')
      .select('*, property:properties(name)')
      .order('created_at', { ascending: false }).limit(50)
    if (data) setInvoices(data)
  }

  const generateSummary = useCallback(async () => {
    if (!startDate || !endDate) return
    setLoading(true)

    const { data: logs } = await supabase.from('spray_logs')
      .select('*, property:properties(*), spray_log_chemicals(total_cost)')
      .gte('spray_date', startDate)
      .lte('spray_date', endDate)

    if (!logs) { setLoading(false); return }

    const byProperty: Record<string, { property: Property; totalAcres: number; chemicalCost: number; sprayCount: number }> = {}

    for (const log of logs) {
      const prop = log.property as unknown as Property
      if (!prop) continue
      if (!byProperty[prop.id]) {
        byProperty[prop.id] = { property: prop, totalAcres: 0, chemicalCost: 0, sprayCount: 0 }
      }
      byProperty[prop.id].totalAcres += log.acres_sprayed
      byProperty[prop.id].sprayCount += 1
      byProperty[prop.id].chemicalCost += (log.spray_log_chemicals || []).reduce(
        (s: number, c: { total_cost: number | null }) => s + (c.total_cost || 0), 0
      )
    }

    const results: PropertySummary[] = Object.values(byProperty).map(({ property, totalAcres, chemicalCost, sprayCount }) => {
      const rate = property.is_standard_billing ? 85 : 30
      const serviceFee = rate * totalAcres
      const surcharge = property.is_standard_billing ? chemicalCost * 0.10 : 0
      const total = serviceFee + chemicalCost + surcharge
      return { property, totalAcres, serviceFee, chemicalCost, surcharge, total, sprayCount }
    })

    results.sort((a, b) => a.property.name.localeCompare(b.property.name))
    setSummaries(results)
    setLoading(false)
  }, [startDate, endDate])

  async function generateInvoice(summary: PropertySummary) {
    const { data: lastInvoice } = await supabase.from('spray_invoices')
      .select('invoice_number')
      .like('invoice_number', `SA-${new Date().getFullYear()}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)

    let nextNum = 1
    if (lastInvoice && lastInvoice.length > 0 && lastInvoice[0].invoice_number) {
      const parts = lastInvoice[0].invoice_number.split('-')
      nextNum = parseInt(parts[2]) + 1
    }
    const invoiceNumber = `SA-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`

    const { error } = await supabase.from('spray_invoices').insert({
      property_id: summary.property.id,
      period_start: startDate,
      period_end: endDate,
      service_fee: summary.serviceFee,
      chemical_cost: summary.chemicalCost,
      chemical_surcharge: summary.surcharge,
      total_amount: summary.total,
      status: 'draft',
      invoice_number: invoiceNumber,
    })

    if (!error) {
      setPdfData(summary)
      setPdfInvoiceNumber(invoiceNumber)
      loadInvoices()
    }
  }

  async function updateInvoiceStatus(id: string, status: string) {
    await supabase.from('spray_invoices').update({ status }).eq('id', id)
    loadInvoices()
  }

  const grandTotal = summaries.reduce((s, r) => s + r.total, 0)

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: 'Oswald' }}>Invoice Summary</h2>

      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Period Start</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="bg-[#2a2a4a] border border-[#3a3a5a] rounded-lg px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Period End</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="bg-[#2a2a4a] border border-[#3a3a5a] rounded-lg px-3 py-2 text-white text-sm" />
        </div>
        <button onClick={generateSummary} disabled={!startDate || !endDate || loading}
          className="bg-[#2E7D32] hover:bg-[#1B5E20] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition">
          {loading ? 'Loading...' : 'Generate Summary'}
        </button>
      </div>

      {summaries.length > 0 && (
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#3a3a5a] text-left text-gray-400">
                <th className="pb-2 pr-4">Property</th>
                <th className="pb-2 pr-4">Rate</th>
                <th className="pb-2 pr-4">Sprays</th>
                <th className="pb-2 pr-4">Acres</th>
                <th className="pb-2 pr-4">Service Fee</th>
                <th className="pb-2 pr-4">Chem Cost</th>
                <th className="pb-2 pr-4">Surcharge</th>
                <th className="pb-2 pr-4">Total</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map(s => (
                <tr key={s.property.id} className="border-b border-[#3a3a5a]/50 hover:bg-[#242442]">
                  <td className="py-2 pr-4 font-medium">{s.property.name}</td>
                  <td className="py-2 pr-4 text-gray-400">${s.property.is_standard_billing ? '85' : '30'}/ac</td>
                  <td className="py-2 pr-4">{s.sprayCount}</td>
                  <td className="py-2 pr-4">{s.totalAcres.toFixed(2)}</td>
                  <td className="py-2 pr-4">${s.serviceFee.toFixed(2)}</td>
                  <td className="py-2 pr-4">${s.chemicalCost.toFixed(2)}</td>
                  <td className="py-2 pr-4">{s.surcharge > 0 ? `$${s.surcharge.toFixed(2)}` : '—'}</td>
                  <td className="py-2 pr-4 text-green-400 font-semibold">${s.total.toFixed(2)}</td>
                  <td className="py-2">
                    <button onClick={() => generateInvoice(s)}
                      className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs px-3 py-1 rounded transition">
                      Generate Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#3a3a5a]">
                <td colSpan={7} className="py-2 pr-4 text-right font-semibold">Grand Total:</td>
                <td className="py-2 pr-4 text-green-400 font-bold text-lg">${grandTotal.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {pdfData && (
        <InvoicePDF
          summary={pdfData}
          invoiceNumber={pdfInvoiceNumber}
          periodStart={startDate}
          periodEnd={endDate}
          onClose={() => setPdfData(null)}
        />
      )}

      {/* Invoice History */}
      <h3 className="text-lg font-semibold mb-3 mt-6" style={{ fontFamily: 'Oswald' }}>Invoice History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#3a3a5a] text-left text-gray-400">
              <th className="pb-2 pr-4">Invoice #</th>
              <th className="pb-2 pr-4">Property</th>
              <th className="pb-2 pr-4">Period</th>
              <th className="pb-2 pr-4">Total</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => {
              const prop = inv.property as unknown as { name: string } | null
              return (
                <tr key={inv.id} className="border-b border-[#3a3a5a]/50 hover:bg-[#242442]">
                  <td className="py-2 pr-4 font-mono">{inv.invoice_number}</td>
                  <td className="py-2 pr-4">{prop?.name || '—'}</td>
                  <td className="py-2 pr-4 text-gray-400">{inv.period_start} to {inv.period_end}</td>
                  <td className="py-2 pr-4 text-green-400">${(inv.total_amount || 0).toFixed(2)}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      inv.status === 'paid' ? 'bg-green-900/50 text-green-400' :
                      inv.status === 'sent' ? 'bg-blue-900/50 text-blue-400' :
                      'bg-gray-700 text-gray-300'
                    }`}>{inv.status}</span>
                  </td>
                  <td className="py-2">
                    <select value={inv.status} onChange={e => updateInvoiceStatus(inv.id, e.target.value)}
                      className="bg-[#2a2a4a] border border-[#3a3a5a] rounded px-2 py-1 text-white text-xs">
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {invoices.length === 0 && <p className="text-gray-500 text-center py-4">No invoices yet</p>}
      </div>
    </div>
  )
}
