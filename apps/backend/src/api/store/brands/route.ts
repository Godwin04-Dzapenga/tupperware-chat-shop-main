import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../modules/brand"

// Public storefront endpoint: brands managed in Medusa Admin can be displayed
// without exposing the admin-only API or requiring an admin session.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const brands = await brandService.listBrands({})
  res.json({ brands })
}
