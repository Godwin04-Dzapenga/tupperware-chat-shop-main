-- Tech Innovation demo catalogue
-- Safe test data for the solar/electronics storefront.
-- Run after 20260930000001_solar_electronics_catalogue.sql
-- and 20260930000002_product_variants.sql.

INSERT INTO public.products (
  name, description, price, cost_price, stock_quantity, reorder_level, sku,
  category_id, image_url, is_active, is_featured,
  product_type, brand, model_number, power_watts, voltage, capacity,
  warranty_months, installation_required, specifications
)
SELECT
  seed.name,
  seed.description,
  seed.price,
  seed.cost_price,
  seed.stock_quantity,
  seed.reorder_level,
  seed.sku,
  c.id,
  seed.image_url,
  true,
  seed.is_featured,
  seed.product_type,
  seed.brand,
  seed.model_number,
  seed.power_watts,
  seed.voltage,
  seed.capacity,
  seed.warranty_months,
  seed.installation_required,
  seed.specifications::jsonb
FROM (
  VALUES
  (
    'Tech Innovation 550W Monocrystalline Solar Panel',
    'High-efficiency monocrystalline PV panel for residential and commercial solar installations.',
    145.00, 110.00, 18, 5, 'TI-SP-550',
    'solar-panels',
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=85',
    true, 'solar-panel', 'Tech Innovation', 'TI-550M',
    550.00, '41.8V', null, 120, true,
    '{"technology":"Monocrystalline","efficiency":"21.3%","cell_type":"Half-cell","warranty":"10 year product / 25 year performance"}'
  ),
  (
    'Deye Hybrid Solar Inverter',
    'Hybrid inverter for home backup, solar PV and battery storage systems.',
    899.00, 720.00, 8, 2, 'DEYE-SUN-5K',
    'inverters',
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=85',
    true, 'hybrid-inverter', 'Deye', 'SUN-5K-SG03LP1',
    5000.00, '48V', null, 60, true,
    '{"phase":"Single Phase","battery":"48V Lithium","mppt":"2 MPPT","backup":"UPS-level switching"}'
  ),
  (
    'Lithium Iron Phosphate Solar Battery',
    'Long-life LiFePO4 energy storage battery designed for solar backup systems.',
    1195.00, 950.00, 10, 2, 'TI-LFP-5K',
    'batteries',
    'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?auto=format&fit=crop&w=900&q=85',
    true, 'lithium-battery', 'Tech Innovation', 'TI-LFP-51V100',
    null, '51.2V', '5.12kWh', 60, true,
    '{"chemistry":"LiFePO4","nominal_voltage":"51.2V","usable_energy":"4.6kWh","cycle_life":6000}'
  ),
  (
    '3.2kVA Home Solar Starter Kit',
    'Complete starter package for essential household loads with inverter, panels and battery storage.',
    2499.00, 2050.00, 5, 1, 'TI-KIT-3K2',
    'solar-kits',
    'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=900&q=85',
    true, 'solar-kit', 'Tech Innovation', 'TI-HOME-3K2',
    3200.00, '24V', '5.12kWh', 24, true,
    '{"panels":"6 x 550W","inverter":"3.2kVA hybrid","battery":"5.12kWh LiFePO4","use_case":"Lights, TV, fridge, Wi-Fi and small appliances"}'
  ),
  (
    'Solar Floodlight 200W',
    'Outdoor solar security floodlight with remote control and dusk-to-dawn operation.',
    79.00, 55.00, 25, 5, 'TI-LIGHT-200',
    'lighting',
    'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=900&q=85',
    true, 'solar-light', 'Tech Innovation', 'TI-SFL-200',
    200.00, '12V', null, 12, false,
    '{"battery":"LiFePO4","runtime":"10-12 hours","sensor":"Dusk-to-dawn","remote":"Included"}'
  ),
  (
    'DC Solar Cable 6mm²',
    'UV-resistant solar PV cable for panel, combiner and inverter connections.',
    2.80, 1.70, 500, 50, 'TI-CABLE-6MM',
    'solar-accessories',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=85',
    true, 'solar-accessory', 'Tech Innovation', 'TI-PV-6MM',
    null, '1000V DC', null, 12, false,
    '{"cross_section":"6mm²","conductor":"Tinned copper","insulation":"XLPE","rating":"1500V DC"}'
  ),
  (
    'Automatic Voltage Protector 63A',
    'Digital voltage protection device for protecting household electronics and appliances.',
    65.00, 42.00, 30, 5, 'TI-AVP-63A',
    'electrical',
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=85',
    true, 'voltage-protector', 'Tech Innovation', 'TI-AVP-63',
    null, '230V AC', null, 12, false,
    '{"rated_current":"63A","display":"Digital voltage display","protection":"Over/under voltage"}'
  ),
  (
    'Smart Wi-Fi Energy Monitor',
    'Smart electricity monitor for tracking household energy consumption from a mobile device.',
    49.00, 32.00, 40, 8, 'TI-IOT-ENERGY',
    'electronics',
    'https://images.unsplash.com/photo-1558008258-3256797b43f3?auto=format&fit=crop&w=900&q=85',
    true, 'iot-device', 'Tech Innovation', 'TI-EM-01',
    null, '230V AC', null, 12, false,
    '{"connectivity":"Wi-Fi","platform":"Mobile dashboard","metering":"Real-time energy monitoring","installation":"DIN rail"}'
  )
) AS seed(
  name, description, price, cost_price, stock_quantity, reorder_level, sku,
  category_slug, image_url, is_featured, product_type, brand, model_number,
  power_watts, voltage, capacity, warranty_months, installation_required, specifications
)
JOIN public.categories c ON c.slug = seed.category_slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.products p WHERE p.sku = seed.sku
);

-- Variant examples make the catalogue feel like a real electronics retailer:
-- one product card can expose multiple capacities / power levels.
INSERT INTO public.product_variants (
  product_id, name, sku, price, stock_quantity, image_url, attributes, is_active, sort_order
)
SELECT p.id, v.name, v.sku, v.price, v.stock_quantity, v.image_url, v.attributes::jsonb, true, v.sort_order
FROM (
  VALUES
    ('TI-SP-550', '450W Panel', 'TI-SP-450', 125.00, 30, 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=85', '{"power":"450W","technology":"Monocrystalline"}', 10),
    ('TI-SP-550', '550W Panel', 'TI-SP-550-V', 145.00, 18, 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=85', '{"power":"550W","technology":"Monocrystalline"}', 20),
    ('TI-SP-550', '600W Panel', 'TI-SP-600', 169.00, 12, 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=85', '{"power":"600W","technology":"Monocrystalline"}', 30),

    ('DEYE-SUN-5K', '3.2kVA / 24V', 'DEYE-3K2-24', 699.00, 6, 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=85', '{"power":"3.2kVA","battery_voltage":"24V"}', 10),
    ('DEYE-SUN-5K', '5kVA / 48V', 'DEYE-5K-48', 899.00, 8, 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=85', '{"power":"5kVA","battery_voltage":"48V"}', 20),
    ('DEYE-SUN-5K', '8kVA / 48V', 'DEYE-8K-48', 1399.00, 4, 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=85', '{"power":"8kVA","battery_voltage":"48V"}', 30),

    ('TI-LFP-5K', '2.56kWh', 'TI-LFP-2560', 699.00, 12, 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?auto=format&fit=crop&w=900&q=85', '{"capacity":"2.56kWh","voltage":"51.2V"}', 10),
    ('TI-LFP-5K', '5.12kWh', 'TI-LFP-5120', 1195.00, 10, 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?auto=format&fit=crop&w=900&q=85', '{"capacity":"5.12kWh","voltage":"51.2V"}', 20),
    ('TI-LFP-5K', '10.24kWh', 'TI-LFP-10240', 2190.00, 5, 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?auto=format&fit=crop&w=900&q=85', '{"capacity":"10.24kWh","voltage":"51.2V"}', 30)
) AS v(parent_sku, name, sku, price, stock_quantity, image_url, attributes, sort_order)
JOIN public.products p ON p.sku = v.parent_sku
WHERE NOT EXISTS (
  SELECT 1
  FROM public.product_variants pv
  WHERE pv.product_id = p.id AND pv.sku = v.sku
);
