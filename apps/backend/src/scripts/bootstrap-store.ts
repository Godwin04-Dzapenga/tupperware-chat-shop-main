import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
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
  logger.info("Products: none seeded by bootstrap (catalogue is imported separately)")
  logger.info("==========================================")
}