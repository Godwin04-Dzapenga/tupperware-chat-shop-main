import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../modules/brand"

type BrandInput = {
  name?: string
  handle?: string
  description?: string | null
  logo_url?: string | null
}

function makeHandle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const brands = await brandService.listBrands({})
  res.json({ brands })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as BrandInput
  const name = body.name?.trim()

  if (!name) {
    return res.status(400).json({ message: "Brand name is required." })
  }

  const handle = makeHandle(body.handle?.trim() || name)
  if (!handle) {
    return res.status(400).json({ message: "A valid brand handle is required." })
  }

  const brandService = req.scope.resolve(BRAND_MODULE)
  const brand = await brandService.createBrands({
    name,
    handle,
    description: body.description?.trim() || null,
    logo_url: body.logo_url?.trim() || null,
  })

  res.status(201).json({ brand })
}
