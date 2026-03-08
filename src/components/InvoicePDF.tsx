import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'
import type { Property } from '../types'

interface PropertySummary {
  property: Property
  totalAcres: number
  serviceFee: number
  chemicalCost: number
  surcharge: number
  total: number
  sprayCount: number
}

interface InvoicePDFProps {
  summary: PropertySummary
  invoiceNumber: string
  periodStart: string
  periodEnd: string
  onClose: () => void
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottom: 2, borderBottomColor: '#2E7D32', paddingBottom: 15 },
  title: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#2E7D32' },
  titleAg: { color: '#1a1a1a' },
  invoiceInfo: { textAlign: 'right' },
  invoiceNumber: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#2E7D32', borderBottom: 1, borderBottomColor: '#ddd', paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottom: 1, borderBottomColor: '#eee' },
  label: { color: '#555' },
  value: { fontFamily: 'Helvetica-Bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTop: 2, borderTopColor: '#2E7D32', marginTop: 10 },
  totalLabel: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  totalValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#2E7D32' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#999', borderTop: 1, borderTopColor: '#eee', paddingTop: 10 },
})

function InvoiceDocument({ summary, invoiceNumber, periodStart, periodEnd }: Omit<InvoicePDFProps, 'onClose'>) {
  const { property, totalAcres, serviceFee, chemicalCost, surcharge, total, sprayCount } = summary
  const rate = property.is_standard_billing ? 85 : 30

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Spray<Text style={styles.titleAg}>Ag</Text></Text>
            <Text style={{ fontSize: 9, color: '#666', marginTop: 4 }}>Professional Spray Services</Text>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceNumber}>Invoice {invoiceNumber}</Text>
            <Text style={{ color: '#666' }}>Date: {new Date().toLocaleDateString()}</Text>
            <Text style={{ color: '#666' }}>Period: {periodStart} to {periodEnd}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold' }}>{property.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Number of Applications</Text>
            <Text style={styles.value}>{sprayCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Acres Sprayed</Text>
            <Text style={styles.value}>{totalAcres.toFixed(2)} acres</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Service Rate</Text>
            <Text style={styles.value}>${rate}.00 per acre</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Service Fee ({totalAcres.toFixed(2)} ac x ${rate})</Text>
            <Text style={styles.value}>${serviceFee.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chemical Costs</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Chemical Cost</Text>
            <Text style={styles.value}>${chemicalCost.toFixed(2)}</Text>
          </View>
          {surcharge > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Chemical Surcharge (10%)</Text>
              <Text style={styles.value}>${surcharge.toFixed(2)}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Service Fee</Text>
            <Text style={styles.value}>${serviceFee.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Chemical Cost</Text>
            <Text style={styles.value}>${chemicalCost.toFixed(2)}</Text>
          </View>
          {surcharge > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Chemical Surcharge</Text>
              <Text style={styles.value}>${surcharge.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>SprayAg - Professional Spray Services</Text>
        </View>
      </Page>
    </Document>
  )
}

export default function InvoicePDF(props: InvoicePDFProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#242442] border border-[#3a3a5a] rounded-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Oswald' }}>
          Invoice {props.invoiceNumber}
        </h3>
        <p className="text-gray-400 mb-4">
          Invoice for <span className="text-white font-medium">{props.summary.property.name}</span>
          <br />Total: <span className="text-green-400 font-semibold">${props.summary.total.toFixed(2)}</span>
        </p>
        <div className="flex gap-3">
          <PDFDownloadLink
            document={<InvoiceDocument {...props} />}
            fileName={`${props.invoiceNumber}.pdf`}
            className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-4 py-2 rounded-lg text-sm transition flex-1 text-center"
          >
            {({ loading: pdfLoading }) => pdfLoading ? 'Generating...' : 'Download PDF'}
          </PDFDownloadLink>
          <button onClick={props.onClose}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm transition">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
