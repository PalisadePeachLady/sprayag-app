-- SprayAg Database Schema

-- 1. Properties
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  acres_total decimal(6,2),
  is_standard_billing boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Chemicals
CREATE TABLE IF NOT EXISTS chemicals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  chemical_name text,
  price_per_unit decimal(10,2),
  price_unit text,
  crop_type text,
  target_pest text,
  rates_per_acre text,
  gallons_per_acre decimal(6,2),
  psi_rpm text,
  time_of_year text,
  pre_harvest_interval text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. Spray Logs
CREATE TABLE IF NOT EXISTS spray_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spray_date date NOT NULL,
  property_id uuid REFERENCES properties(id),
  acres_sprayed decimal(6,2) NOT NULL,
  hours_to_spray decimal(4,1),
  notes text,
  created_by text DEFAULT 'brandon',
  created_at timestamptz DEFAULT now()
);

-- 4. Spray Log Chemicals
CREATE TABLE IF NOT EXISTS spray_log_chemicals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spray_log_id uuid REFERENCES spray_logs(id) ON DELETE CASCADE,
  chemical_id uuid REFERENCES chemicals(id),
  quantity_used decimal(8,2),
  unit text,
  cost_per_unit decimal(10,2),
  total_cost decimal(10,2),
  created_at timestamptz DEFAULT now()
);

-- 5. Spray Invoices
CREATE TABLE IF NOT EXISTS spray_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  service_fee decimal(10,2),
  chemical_cost decimal(10,2),
  chemical_surcharge decimal(10,2),
  total_amount decimal(10,2),
  status text DEFAULT 'draft',
  invoice_number text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS but allow all operations with anon key for now
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_log_chemicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on properties" ON properties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chemicals" ON chemicals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on spray_logs" ON spray_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on spray_log_chemicals" ON spray_log_chemicals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on spray_invoices" ON spray_invoices FOR ALL USING (true) WITH CHECK (true);

-- Insert Properties
INSERT INTO properties (name, acres_total, is_standard_billing) VALUES
  ('MPV Vines', 7.9, false),
  ('MPV Peaches', 0.65, false),
  ('Priddy Peaches', 6.0, false),
  ('Priddy Cherry', 3.7, false),
  ('G&G Peaches', 2.7, true),
  ('G&G Plums', 0.933, true),
  ('La Colina', 4.5, true),
  ('Devin Mulford', 9.0, true),
  ('Matt H.', 1.1, true),
  ('Byron Huffman', 1.2, true),
  ('CCRJ', 3.5, true);

-- Insert Chemicals
INSERT INTO chemicals (product_name, chemical_name, price_per_unit, price_unit, crop_type, target_pest, rates_per_acre, gallons_per_acre, psi_rpm, time_of_year, pre_harvest_interval) VALUES
  ('JMS Stylet oil (organic)', 'JMS Stylet oil', null, 'gal', 'vines', 'powdery mildew', '1-3 gal', 100, '115psi/1700rpm', 'all', '14-21 days'),
  ('Dormant oil (organic)', 'Dormant oil', 9.70, 'gal', 'peaches/cherries', 'pest eggs from over wintering/mildew', '4 gal', 100, '100psi/1700rpm', 'winter/spring used w/lime sulfur', null),
  ('Badge X2 (organic)', 'copper oxychloride, copper hydroxide', 9.75, 'gal', 'grape, cherry, plum, peaches', 'mildew, canker, blight, shot hole', '3.5-14# peach/cherry/plum, .75-3.5# grapes', 100, '100psi/1700rpm', 'winter/spring only never with green', null),
  ('Oxidate 5.0 (organic)', 'hydrogen peroxide, peroxyacetic acid', null, 'gal', 'grape, cherry, plum, peaches', 'mildew', null, null, null, null, null),
  ('Novasource/Lime Sulfur', 'calcium polysulfide', 9.75, 'gal', 'peaches/cherries, grapes', 'fungus/insecticide', '4-12 gal peach/cherry/plum, 15 gal grapes', 100, '100psi/1700rpm', 'winter/spring used w/dormant oil', null),
  ('Fortuna 75WDG', 'mancozeb', null, 'lb', 'vines', 'mildew, rots, downey', '1.5-4#', 100, '75psi/1700rpm', 'before fruit set/NOT WHEN HUMID', '7-10 days'),
  ('Rally/Stide 40WSP', 'myclobutanil', 4.49, 'oz', 'vines', 'mildew, rot, leaf spot, blight, rust', '3-5# vines, 2.5-6# cherry/plum/peach', 100, '75psi/1700rpm', null, '14-21 days'),
  ('Alion', 'INDAZIFLAM', 22.75, 'oz', 'grape, cherry, plum, peaches', 'herbicide, preemergence, post emergence', '4.25 oz per 50 gal water/2.25 acres', 50, 'close valves, 2mph', 'spring, summer', null),
  ('Matrix SG', 'Rimsulfuron', 8.50, 'oz', 'grape, cherry, plum, peaches', 'herbicide, preemergence, post emergence', '4.25 oz per 50 gal water/2.25 acres', 50, 'close valves, 2mph', 'spring, summer', null),
  ('Reckon 280sl', 'glufosnate-ammonium', 39.25, 'gal', 'grape, cherry, plum, peaches', 'herbicide, postemergence', '100 oz per 50 gal water/2.25 acres', 50, 'close valves, 2mph', 'all season', null),
  ('Imida 4f', 'Imidacloprid', 120.00, 'gal', 'grapes, stone fruit', 'leafhoppers, mealybug, aphids, fruit fly, stink bug', '1.2-1.6 oz grape, 1.6-3.2 oz stone fruit', 100, '75psi/1700rpm', 'all season', '20-21 days'),
  ('Altacor', 'chlorantraniliprole', 29.50, 'gal', 'grape, cherry, pear, peach', 'grape berry moth, cherry fruit fly, codling moth', '2-4.5 oz grape, 3-4.5 oz stone fruit', 100, '75psi/1700rpm', 'all season', '7-10 days'),
  ('Pro Sol', '20-20-20', 2.10, 'lb', 'all fruit', null, '6# cherry, 7# grapes, 3-4# peach', 100, null, null, null),
  ('Greenstem', 'biostimulant/fertilizer', 88.75, 'gal', 'cherry sizing program', null, '1 qt', 100, null, null, null),
  ('Metalosate Zn', 'zinc', 46.50, 'gal', 'cherry sizing program', null, '1 qt', 100, null, null, null),
  ('Metalosate CA', 'Calcium', 46.50, 'gal', 'cherry sizing program', null, '1 qt', 100, null, null, null),
  ('Foliar Blend', 'Optimize nutrient', 43.50, 'gal', 'cherry sizing program', null, '16 oz', 100, null, null, null),
  ('ProGibb 4%', 'fruit reducer', null, 'gal', 'cherry sizing program', null, '5 oz', 100, null, 'small green fruit/1-2 sprays', null),
  ('Kudos', 'shoot growth control', 68.25, 'lb', 'cherry sizing program', null, null, null, null, null, null),
  ('Asana', 'Esfenvalerate', 100.00, 'gal', 'pears', 'Pear Psylla, crown bore, Codling Moth', '4.8-14.5 oz', null, null, null, null),
  ('Topsin 4.5FL', 'Thiophanate-methyl', 63.25, 'gal', null, null, null, null, null, null, null),
  ('Glystar', 'glyphosate', 24.00, 'gal', 'herbicide', null, '48 oz', null, null, null, null),
  ('Delegate', 'Spinetoram', 13.75, 'gal', 'insecticide', 'codling moth, grape berry moth, cherry fruit fly, twig borer', '6-7 fly, 5-7 twig, 3-6 moth', null, null, null, null),
  ('Isomaste PTB', null, 200.00, 'pak', 'twig bore lures', 'twig bore', '1 per 3 trees', null, null, null, null),
  ('16-16-8 Granular', null, 35.00, 'lb', 'ground cover', null, null, null, null, null, null),
  ('Blackmaxx Humic Acid', 'humic acid', 24.25, 'gal', 'ground cover', null, '2.5 per 4 acres', 30, null, null, null),
  ('Ferriplus Iron', '6% iron', 15.25, 'lb', 'ground', null, '5#', 30, null, null, null),
  ('Metalosate FE', 'Iron', 46.50, 'gal', 'foliar', null, null, null, null, null, null),
  ('UMaxx Nitrogen 47-0-0', 'Nitrogen slow release', 56.00, 'lb', 'ground', null, 'handful per tree', null, null, null, null),
  ('Forfeit Weed Spray', 'weed spray', 39.25, 'gal', 'ground', null, '50 oz', 30, null, null, null),
  ('Tuscany Herbicide', null, 150.00, 'lb', 'weed', 'weeds', '9 oz', null, null, null, null),
  ('Onager Mitecide', 'Hexythiazox', 570.00, 'gal', 'tree/grape', 'mites', null, null, null, null, null),
  ('Ammonium Sulfate', null, 45.00, 'lb', 'weed spray mixture', 'weed', '12 per acre', null, null, null, null),
  ('Fortelis Fungicide', null, 220.00, 'oz', null, null, null, null, null, null, null),
  ('Nitrogen 46-0-0', 'Nitrogen', 35.00, 'lb', null, null, '10-15# per acre', null, null, null, null);
