import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

const BRAND_RULES: Array<{ match: RegExp; brand: string }> = [
  { match: /\b(sony|playstation)\b/i, brand: "Sony" },
  { match: /\b(hp|hewlett[ -]packard|omen|probook|elitebook)\b/i, brand: "HP" },
  { match: /\basus\b/i, brand: "ASUS" },
  { match: /\blenovo\b/i, brand: "Lenovo" },
  { match: /\bdell\b/i, brand: "Dell" },
  { match: /\bacer\b/i, brand: "Acer" },
  { match: /\bapple|macbook|iphone\b/i, brand: "Apple" },
  { match: /\bsamsung\b/i, brand: "Samsung" },
]

/**
 * Safely adds normalized brand names to existing Medusa product metadata.
 * This script does not create, delete, reprice, or reseed products.
 * Re-running it is safe; unrelated metadata is preserved.
 */
export default async function syncProductBrands({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productService = container.resolve(Modules.PRODUCT)
  const logger = container.resolve("logger")

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata"],
  })

  let updated = 0
  let skipped = 0

  for (const product of products as Array<{
    id: string
    title: string
    metadata?: Record<string, unknown> | null
  }>) {
    const match = BRAND_RULES.find(({ match }) => match.test(product.title))
    if (!match) {
      skipped += 1
      continue
    }

    const metadata = product.metadata ?? {}
    if (metadata.brand === match.brand) {
      skipped += 1
      continue
    }

    await productService.updateProducts(product.id, {
      metadata: { ...metadata, brand: match.brand },
    })
    logger.info(`Set backend brand "${match.brand}" for "${product.title}" (${product.id}).`)
    updated += 1
  }

  logger.info(`Brand sync complete. Updated: ${updated}; unchanged/unmatched: ${skipped}. No products were created or deleted.`)
}
