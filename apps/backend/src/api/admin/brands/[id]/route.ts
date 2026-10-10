import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../../modules/brand"

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

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const brand = await brandService.retrieveBrand(req.params.id)
  res.json({ brand })
}

export async function PATCH(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const body = req.body as BrandInput
  const updates: Record<string, string | null> = {}

  if (typeof body.name === "string") {
    const name = body.name.trim()
    if (!name) {
      return res.status(400).json({ message: "Brand name cannot be empty." })
    }
    updates.name = name
  }

  if (typeof body.handle === "string" || typeof body.name === "string") {
    const handle = makeHandle(
      typeof body.handle === "string" && body.handle.trim()
        ? body.handle
        : body.name || ""
    )
    if (!handle) {
      return res.status(400).json({ message: "A valid brand handle is required." })
    }
    updates.handle = handle
  }

  if (typeof body.description === "string" || body.description === null) {
    updates.description = body.description?.trim() || null
  }

  if (typeof body.logo_url === "string" || body.logo_url === null) {
    updates.logo_url = body.logo_url?.trim() || null
  }

  const brandService = req.scope.resolve(BRAND_MODULE)
  const brand = await brandService.updateBrands({
    id: req.params.id,
    ...updates,
  })

  res.json({ brand })
}

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  await brandService.deleteBrands(req.params.id)
  res.status(200).json({ id: req.params.id, deleted: true })
}
