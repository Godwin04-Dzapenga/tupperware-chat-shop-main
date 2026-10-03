import {
  createApiKeysWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  createInventoryLevelsWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  createShippingProfilesWorkflow,
  createShippingOptionsWorkflow,
} from "@medusajs/medusa/core-flows"
import { ExecArgs } from "@medusajs/framework/types"
import { writeFileSync } from "node:fs"
import path from "node:path"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

const SALES_CHANNEL_NAME = "Tech Innovation Online Store"
const REGION_NAME = "Zimbabwe"
const API_KEY_TITLE = "Tech Innovation Storefront"
const CURRENCY_CODE = "usd"

const categories = [
  { name: "Solar Panels", handle: "solar-panels", description: "Solar photovoltaic panels and modules." },
  { name: "Inverters", handle: "inverters", description: "Solar and hybrid inverters." },
  { name: "Batteries", handle: "batteries", description: "Solar energy storage batteries." },
  { name: "Solar Kits", handle: "solar-kits", description: "Complete solar starter and package systems." },
  { name: "Electrical", handle: "electrical", description: "Electrical protection, cabling and related equipment." },
  { name: "Electronics", handle: "electronics", description: "Smart electronics and technology products." },
  { name: "Lighting", handle: "lighting", description: "Solar and energy-efficient lighting." },
  { name: "Accessories", handle: "solar-accessories", description: "Solar installation and system accessories." },
]

const products = [
  {
    title: "Tech Innovation Monocrystalline Solar Panel",
    handle: "tech-innovation-monocrystalline-solar-panel",
    description: "High-efficiency monocrystalline solar panel for residential and commercial solar systems.",
    categoryHandle: "solar-panels",
    sku: "TI-SOLAR-PANEL",
    basePrice: 180,
    stock: 50,
    options: { title: "Panel Power", values: ["450W", "550W", "600W"] },
    variants: [
      { title: "450W", sku: "TI-SOLAR-PANEL-450W", price: 150, power_watts: 450 },
      { title: "550W", sku: "TI-SOLAR-PANEL-550W", price: 180, power_watts: 550 },
      { title: "600W", sku: "TI-SOLAR-PANEL-600W", price: 210, power_watts: 600 },
    ],
    metadata: { brand: "Tech Innovation", product_type: "solar_panel", power_watts: 550, warranty_months: 120 },
  },
  {
    title: "Deye Hybrid Solar Inverter",
    handle: "deye-hybrid-solar-inverter",
    description: "Deye hybrid inverter for residential and commercial solar energy systems.",
    categoryHandle: "inverters",
    sku: "DEYE-HYBRID",
    basePrice: 950,
    stock: 20,
    options: { title: "Capacity", values: ["3.2kVA", "5kVA", "8kVA"] },
    variants: [
      { title: "3.2kVA / 24V", sku: "DEYE-HYBRID-3.2KVA", price: 750, voltage: "24V", capacity: "3.2kVA" },
      { title: "5kVA / 48V", sku: "DEYE-HYBRID-5KVA", price: 950, voltage: "48V", capacity: "5kVA" },
      { title: "8kVA / 48V", sku: "DEYE-HYBRID-8KVA", price: 1450, voltage: "48V", capacity: "8kVA" },
    ],
    metadata: { brand: "Deye", product_type: "hybrid_inverter", voltage: "48V", warranty_months: 60 },
  },
  {
    title: "Lithium Iron Phosphate Solar Battery",
    handle: "lithium-iron-phosphate-solar-battery",
    description: "LiFePO4 battery storage for solar energy systems.",
    categoryHandle: "batteries",
    sku: "TI-LIFEPO4",
    basePrice: 1200,
    stock: 15,
    options: { title: "Capacity", values: ["2.56kWh", "5.12kWh", "10.24kWh"] },
    variants: [
      { title: "2.56kWh", sku: "TI-LIFEPO4-2.56KWH", price: 650, capacity: "2.56kWh", voltage: "51.2V" },
      { title: "5.12kWh", sku: "TI-LIFEPO4-5.12KWH", price: 1200, capacity: "5.12kWh", voltage: "51.2V" },
      { title: "10.24kWh", sku: "TI-LIFEPO4-10.24KWH", price: 2250, capacity: "10.24kWh", voltage: "51.2V" },
    ],
    metadata: { brand: "Tech Innovation", product_type: "lifepo4_battery", voltage: "51.2V", warranty_months: 60 },
  },
  {
    title: "3.2kVA Home Solar Starter Kit",
    handle: "3-2kva-home-solar-starter-kit",
    description: "Complete 3.2kVA starter package for home solar backup power.",
    categoryHandle: "solar-kits",
    sku: "TI-KIT-3.2KVA",
    basePrice: 1850,
    stock: 10,
    metadata: { brand: "Tech Innovation", product_type: "solar_kit", power_watts: 3200 },
  },
  {
    title: "Solar LED Floodlight 200W",
    handle: "solar-led-floodlight-200w",
    description: "High-output solar LED floodlight for outdoor lighting.",
    categoryHandle: "lighting",
    sku: "TI-FLOOD-200W",
    basePrice: 85,
    stock: 40,
    metadata: { brand: "Tech Innovation", product_type: "solar_lighting", power_watts: 200 },
  },
  {
    title: "6mm² Solar DC Cable",
    handle: "6mm-solar-dc-cable",
    description: "6mm² solar DC cable for photovoltaic installations.",
    categoryHandle: "solar-accessories",
    sku: "TI-CABLE-6MM",
    basePrice: 2.5,
    stock: 500,
    metadata: { brand: "Tech Innovation", product_type: "solar_cable" },
  },
  {
    title: "Automatic Voltage Protector 63A",
    handle: "automatic-voltage-protector-63a",
    description: "Automatic voltage protection for residential electrical systems.",
    categoryHandle: "electrical",
    sku: "TI-AVP-63A",
    basePrice: 65,
    stock: 30,
    metadata: { brand: "Tech Innovation", product_type: "voltage_protector", amperage: "63A" },
  },
  {
    title: "Smart Wi-Fi Energy Monitor",
    handle: "smart-wifi-energy-monitor",
    description: "Smart Wi-Fi energy monitoring device for tracking household electricity usage.",
    categoryHandle: "electronics",
    sku: "TI-ENERGY-MONITOR",
    basePrice: 45,
    stock: 25,
    metadata: { brand: "Tech Innovation", product_type: "energy_monitor", connectivity: "Wi-Fi" },
  },
]

export default async function bootstrapStore({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve("logger")

  logger.info("Starting Tech Innovation Medusa store bootstrap...")

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
    filters: { name: SALES_CHANNEL_NAME },
  })

  let salesChannel: any = salesChannels[0]

  if (!salesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [{ name: SALES_CHANNEL_NAME, description: "Tech Innovation ecommerce storefront" }],
      },
    })
    salesChannel = result[0]
    logger.info(`Created sales channel: ${salesChannel.name} (${salesChannel.id})`)
  } else {
    logger.info(`Using existing sales channel: ${salesChannel.name} (${salesChannel.id})`)
  }

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "countries.*"],
    filters: { name: REGION_NAME },
  })

  let region: any = regions.find((item: any) => item.currency_code === CURRENCY_CODE)

  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [{
          name: REGION_NAME,
          currency_code: CURRENCY_CODE,
          countries: ["zw"],
        }],
      },
    })
    region = result[0]
    logger.info(`Created region: ${region.name} (${region.id})`)
  } else {
    logger.info(`Using existing USD region: ${region.name} (${region.id})`)
  }

  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "type", "token"],
    filters: { title: API_KEY_TITLE, type: "publishable" },
  })

  let apiKey: any = apiKeys[0]

  if (!apiKey) {
    const { data: adminUsers } = await query.graph({
      entity: "user",
      fields: ["id", "email"],
    })
    const createdBy = adminUsers[0]?.id ?? ""

    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [{
          title: API_KEY_TITLE,
          type: "publishable",
          created_by: createdBy,
        }],
      },
    })
    apiKey = result[0]
    logger.info(`Created publishable API key: ${apiKey.token}`)
  } else {
    logger.info(`Using existing publishable API key: ${apiKey.id}`)
  }

  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle"],
  })

  const categoryByHandle = new Map(existingCategories.map((category: any) => [category.handle, category]))

  for (const category of categories) {
    if (!categoryByHandle.has(category.handle)) {
      const { result } = await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [{
            name: category.name,
            handle: category.handle,
            description: category.description,
            is_active: true,
            is_internal: false,
          }],
        },
      })
      categoryByHandle.set(category.handle, result[0])
      logger.info(`Created category: ${category.name}`)
    }
  }

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title"],
  })

  const existingHandles = new Set(existingProducts.map((product: any) => product.handle))

  const productsToCreate = products
    .filter((product) => !existingHandles.has(product.handle))
    .map((product) => {
      const category = categoryByHandle.get(product.categoryHandle)
      const productOptions = product.options
        ? [{
            title: product.options.title,
            values: product.variants?.map((variant) => variant.title) ?? product.options.values,
          }]
        : [{ title: "Default Option", values: ["Default"] }]

      const variants = product.variants?.length
        ? product.variants.map((variant) => ({
            title: variant.title,
            sku: variant.sku,
            options: product.options
              ? { [product.options.title]: variant.title }
              : { "Default Option": "Default" },
            manage_inventory: true,
            allow_backorder: false,
            prices: [{ currency_code: CURRENCY_CODE, amount: variant.price }],
            metadata: {
              power_watts: variant.power_watts,
              voltage: variant.voltage,
              capacity: variant.capacity,
            },
          }))
        : [{
            title: "Default",
            sku: product.sku,
            options: { "Default Option": "Default" },
            manage_inventory: true,
            allow_backorder: false,
            prices: [{ currency_code: CURRENCY_CODE, amount: product.basePrice }],
          }]

      return {
        title: product.title,
        handle: product.handle,
        description: product.description,
        status: "published" as const,
        categories: category ? [{ id: category.id }] : [],
        sales_channels: [{ id: salesChannel.id }],
        options: productOptions,
        variants,
        metadata: {
          ...product.metadata,
          source: "tech-innovation-bootstrap",
          source_sku: product.sku,
          initial_stock: product.stock,
        },
      }
    })

  if (productsToCreate.length) {
    const { result: createdProducts } = await createProductsWorkflow(container).run({
      input: { products: productsToCreate },
    })
    logger.info(`Created ${createdProducts.length} Tech Innovation products.`)
  } else {
    logger.info("All Tech Innovation products already exist; nothing to create.")
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: apiKey.id,
      add: [salesChannel.id],
      remove: [],
    },
  })

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })

  let stockLocation: any = stockLocations.find(
    (location: any) => location.name === "Tech Innovation Main Warehouse"
  )

  if (!stockLocation) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [{ name: "Tech Innovation Main Warehouse" }],
      },
    })
    stockLocation = result[0]
    logger.info(`Created stock location: ${stockLocation.name} (${stockLocation.id})`)
  } else {
    logger.info(`Using existing stock location: ${stockLocation.name} (${stockLocation.id})`)
  }

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [salesChannel.id],
      remove: [],
    },
  })

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku", "location_levels.*"],
  })

  const skuToStock = new Map<string, number>()
  for (const product of products) {
    const stock = Number(product.stock ?? 0)
    for (const variant of product.variants?.length
      ? product.variants
      : [{ sku: product.sku }]) {
      if (variant.sku) skuToStock.set(variant.sku, stock)
    }
  }

  const existingLevels = new Set<string>()
  for (const item of inventoryItems as any[]) {
    for (const level of item.location_levels || []) {
      if (level.location_id === stockLocation.id) {
        existingLevels.add(item.id)
      }
    }
  }

  const inventoryLevels = (inventoryItems as any[])
    .filter((item) => !existingLevels.has(item.id))
    .map((item) => ({
      inventory_item_id: item.id,
      location_id: stockLocation.id,
      stocked_quantity: skuToStock.get(item.sku) ?? 0,
    }))

  if (inventoryLevels.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: inventoryLevels },
    })
    logger.info(`Created ${inventoryLevels.length} inventory levels.`)
  } else {
    logger.info("Inventory levels already exist for the storefront stock location.")
  }

  // Configure the fulfillment and payment pieces required by the Medusa storefront checkout.
  // This is intentionally idempotent: existing links/options are reused.
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const { data: paymentProviders } = await query.graph({
    entity: "payment_provider",
    fields: ["id", "name", "is_enabled"],
  })
  const systemPaymentProvider = (paymentProviders as any[]).find(
    (provider) =>
      provider.is_enabled !== false &&
      /system|manual/i.test(`${provider.id} ${provider.name ?? ""}`)
  )
  const paynowPaymentProvider = (paymentProviders as any[]).find(
    (provider) =>
      provider.is_enabled !== false &&
      /paynow/i.test(`${provider.id} ${provider.name ?? ""}`)
  )

  if (!systemPaymentProvider) {
    throw new Error(
      "No system/manual payment provider is registered in Medusa. The default system payment provider must be available before checkout can be enabled."
    )
  }

  const { data: regionWithProviders } = await query.graph({
    entity: "region",
    fields: ["id", "payment_providers.*"],
    filters: { id: region.id },
  })
  const regionPaymentProviders = regionWithProviders[0]?.payment_providers ?? []
  if (!regionPaymentProviders.some((provider: any) => provider.id === systemPaymentProvider.id)) {
    await link.create({
      [Modules.REGION]: { region_id: region.id },
      [Modules.PAYMENT]: { payment_provider_id: systemPaymentProvider.id },
    })
    logger.info(`Enabled system payment provider ${systemPaymentProvider.id} for Zimbabwe.`)
  } else {
    logger.info("System payment provider is already enabled for Zimbabwe.")
  }

  if (paynowPaymentProvider) {
    if (!regionPaymentProviders.some((provider: any) => provider.id === paynowPaymentProvider.id)) {
      await link.create({
        [Modules.REGION]: { region_id: region.id },
        [Modules.PAYMENT]: { payment_provider_id: paynowPaymentProvider.id },
      })
      logger.info(`Enabled Paynow payment provider ${paynowPaymentProvider.id} for Zimbabwe.`)
    } else {
      logger.info("Paynow payment provider is already enabled for Zimbabwe.")
    }
  } else {
    logger.info("Paynow payment provider is not registered yet; add Paynow credentials and restart Medusa before seeding.")
  }

  let shippingProfile = (await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  }))[0]

  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: {
        data: [{
          name: "Tech Innovation Default Shipping",
          type: "default",
        }],
      },
    })
    shippingProfile = result[0]
    logger.info(`Created shipping profile: ${shippingProfile.name} (${shippingProfile.id})`)
  }

  const { data: existingFulfillmentSets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name", "type", "service_zones.*", "service_zones.geo_zones.*"],
    filters: { name: "Tech Innovation Zimbabwe Delivery" },
  })

  let fulfillmentSet: any = existingFulfillmentSets[0]

  if (!fulfillmentSet) {
    fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "Tech Innovation Zimbabwe Delivery",
      type: "shipping",
      service_zones: [{
        name: "Zimbabwe",
        geo_zones: [{
          country_code: "zw",
          type: "country",
        }],
      }],
    })
    logger.info(`Created Zimbabwe fulfillment set: ${fulfillmentSet.id}`)
  } else {
    logger.info(`Using existing Zimbabwe fulfillment set: ${fulfillmentSet.id}`)
  }

  const serviceZone = fulfillmentSet.service_zones?.[0]
  if (!serviceZone) {
    throw new Error("Zimbabwe fulfillment set has no service zone.")
  }

  const { data: locationLinks } = await query.graph({
    entity: "stock_location",
    fields: ["id", "fulfillment_sets.*", "fulfillment_providers.*"],
    filters: { id: stockLocation.id },
  })
  const linkedLocation = locationLinks[0]
  if (!linkedLocation?.fulfillment_sets?.some((set: any) => set.id === fulfillmentSet.id)) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    })
    logger.info("Linked warehouse to Zimbabwe fulfillment set.")
  }
  const { data: fulfillmentProviders } = await query.graph({
      entity: "fulfillment_provider",
      fields: ["id", "name", "is_enabled"],
    })
  const manualFulfillmentProvider = (fulfillmentProviders as any[]).find(
    (provider) =>
      provider.is_enabled !== false &&
      /manual/i.test(`${provider.id} ${provider.name ?? ""}`)
  )
  if (!manualFulfillmentProvider) {
    throw new Error("No manual fulfillment provider is registered in Medusa.")
  }
  if (!linkedLocation?.fulfillment_providers?.some((provider: any) => provider.id === manualFulfillmentProvider.id)) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: manualFulfillmentProvider.id },
    })
    logger.info(`Linked warehouse to manual fulfillment provider ${manualFulfillmentProvider.id}.`)
  } else {
    logger.info("Manual fulfillment provider is already linked to the warehouse.")
  }

  const { data: shippingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "service_zone_id", "shipping_profile_id", "provider_id"],
    filters: { service_zone_id: serviceZone.id, name: "Standard Delivery" },
  })

  if (!shippingOptions.length) {
    await createShippingOptionsWorkflow(container).run({
      input: [{
        name: "Standard Delivery",
        price_type: "flat",
        provider_id: manualFulfillmentProvider.id,
        service_zone_id: serviceZone.id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Standard Tech Innovation delivery in Zimbabwe.",
          code: "standard",
        },
        prices: [{
          currency_code: CURRENCY_CODE,
          amount: 5,
          region_id: region.id,
        }],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      }],
    })
    logger.info("Created Standard Delivery shipping option at USD 5.")
  } else {
    logger.info("Standard Delivery shipping option already exists.")
  }

  const rootEnvLocal = path.resolve(process.cwd(), "../../.env.local")
  writeFileSync(
    rootEnvLocal,
    [
      "VITE_MEDUSA_BACKEND_URL=http://localhost:9000",
      "VITE_MEDUSA_PUBLISHABLE_KEY=" + apiKey.token,
      "VITE_MEDUSA_REGION_ID=" + region.id,
      "VITE_MEDUSA_SALES_CHANNEL_ID=" + salesChannel.id,
      "VITE_MEDUSA_CURRENCY_CODE=usd",
      "VITE_COMMERCE_CATALOG_PROVIDER=medusa",
      "",
    ].join("\n"),
    "utf8"
  )
  logger.info("Updated root .env.local with Medusa storefront configuration.")

  logger.info("")
  logger.info("=== TECH INNOVATION MEDUSA STORE READY ===")
  logger.info(`Sales Channel ID: ${salesChannel.id}`)
  logger.info(`Region ID: ${region.id}`)
  logger.info(`Currency: ${region.currency_code}`)
  logger.info(`Publishable API Key: ${apiKey.token}`)
  logger.info("Products: catalogue bootstrap complete")
  logger.info("==========================================")
}