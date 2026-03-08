export interface Property {
  id: string
  name: string
  acres_total: number | null
  is_standard_billing: boolean
  active: boolean
  created_at: string
}

export interface Chemical {
  id: string
  product_name: string
  chemical_name: string | null
  price_per_unit: number | null
  price_unit: string | null
  crop_type: string | null
  target_pest: string | null
  rates_per_acre: string | null
  gallons_per_acre: number | null
  psi_rpm: string | null
  time_of_year: string | null
  pre_harvest_interval: string | null
  active: boolean
  created_at: string
}

export interface SprayLog {
  id: string
  spray_date: string
  property_id: string
  acres_sprayed: number
  hours_to_spray: number | null
  notes: string | null
  created_by: string
  created_at: string
  property?: Property
  spray_log_chemicals?: SprayLogChemical[]
}

export interface SprayLogChemical {
  id: string
  spray_log_id: string
  chemical_id: string
  quantity_used: number | null
  unit: string | null
  cost_per_unit: number | null
  total_cost: number | null
  created_at: string
  chemical?: Chemical
}

export interface SprayInvoice {
  id: string
  property_id: string
  period_start: string
  period_end: string
  service_fee: number | null
  chemical_cost: number | null
  chemical_surcharge: number | null
  total_amount: number | null
  status: string
  invoice_number: string | null
  created_at: string
  property?: Property
}

export interface ChemicalEntry {
  chemical_id: string
  quantity_used: number
  unit: string
  cost_per_unit: number
  total_cost: number
}
