import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"

type Brand = {
  id: string
  name: string
  handle: string
  description: string | null
  logo_url: string | null
}

type BrandForm = {
  name: string
  handle: string
  description: string
  logo_url: string
}

const emptyForm: BrandForm = {
  name: "",
  handle: "",
  description: "",
  logo_url: "",
}

async function readError(response: Response) {
  const payload = await response.json().catch(() => ({}))
  return payload.message || "The request could not be completed."
}

export default function BrandsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [form, setForm] = useState<BrandForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const response = await fetch("/admin/brands", { credentials: "include" })
      if (!response.ok) throw new Error(await readError(response))
      return (await response.json()) as { brands: Brand[] }
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const endpoint = editingId ? `/admin/brands/${editingId}` : "/admin/brands"
      const response = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          handle: form.handle,
          description: form.description || null,
          logo_url: form.logo_url || null,
        }),
      })
      if (!response.ok) throw new Error(await readError(response))
      return response.json()
    },
    onSuccess: async () => {
      setMessage(editingId ? "Brand updated." : "Brand created.")
      setForm(emptyForm)
      setEditingId(null)
      await queryClient.invalidateQueries({ queryKey: ["admin-brands"] })
    },
    onError: (mutationError) => {
      setMessage(mutationError instanceof Error ? mutationError.message : "Could not save brand.")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/admin/brands/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!response.ok) throw new Error(await readError(response))
    },
    onSuccess: async () => {
      setMessage("Brand deleted.")
      if (editingId) {
        setEditingId(null)
        setForm(emptyForm)
      }
      await queryClient.invalidateQueries({ queryKey: ["admin-brands"] })
    },
    onError: (mutationError) => {
      setMessage(mutationError instanceof Error ? mutationError.message : "Could not delete brand.")
    },
  })

  const brands = useMemo(() => {
    const items = data?.brands || []
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((brand) =>
      [brand.name, brand.handle, brand.description || ""]
        .some((value) => value.toLowerCase().includes(term))
    )
  }, [data?.brands, search])

  function startEdit(brand: Brand) {
    setEditingId(brand.id)
    setForm({
      name: brand.name,
      handle: brand.handle,
      description: brand.description || "",
      logo_url: brand.logo_url || "",
    })
    setMessage("")
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setMessage("")
  }

  function updateField(field: keyof BrandForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: "#64748b", marginBottom: 6 }}>CATALOG</p>
        <h1 style={{ fontSize: 28, fontWeight: 650, margin: 0 }}>Brands</h1>
        <p style={{ color: "#64748b", marginTop: 8 }}>
          Create and manage the brands shown across your Tech Innovation store.
        </p>
      </div>

      <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 0 }}>
          {editingId ? "Edit brand" : "Add a brand"}
        </h2>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setMessage("")
            saveMutation.mutate()
          }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span>Brand name *</span>
            <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="e.g. HP" style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Handle</span>
            <input value={form.handle} onChange={(event) => updateField("handle", event.target.value)} placeholder="e.g. hp" style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Logo URL</span>
            <input type="url" value={form.logo_url} onChange={(event) => updateField("logo_url", event.target.value)} placeholder="https://..." style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
            <span>Description</span>
            <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={3} placeholder="Short description of this brand" style={{ ...inputStyle, resize: "vertical" }} />
          </label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", gridColumn: "1 / -1" }}>
            <button type="submit" disabled={saveMutation.isPending} style={primaryButtonStyle}>
              {saveMutation.isPending ? "Saving…" : editingId ? "Save changes" : "Create brand"}
            </button>
            {editingId && <button type="button" onClick={cancelEdit} style={secondaryButtonStyle}>Cancel</button>}
          </div>
        </form>
        {message && <p role="status" style={{ marginBottom: 0, marginTop: 16, color: message.toLowerCase().includes("could not") || message.toLowerCase().includes("required") ? "#b91c1c" : "#166534" }}>{message}</p>}
      </section>

      <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>All brands</h2>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search brands…" aria-label="Search brands" style={{ ...inputStyle, maxWidth: 300 }} />
        </div>
        {isLoading && <p>Loading brands…</p>}
        {error && <p role="alert" style={{ color: "#b91c1c" }}>{error instanceof Error ? error.message : "Could not load brands."}</p>}
        {!isLoading && !error && brands.length === 0 && (
          <p style={{ color: "#64748b" }}>{search ? "No brands match your search." : "No brands yet. Add your first brand above."}</p>
        )}
        {brands.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr>
                  {["Brand", "Handle", "Description", "Actions"].map((heading) => (
                    <th key={heading} style={tableHeaderStyle}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id}>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {brand.logo_url ? (
                          <img src={brand.logo_url} alt="" style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 6, border: "1px solid #e2e8f0" }} />
                        ) : (
                          <div aria-hidden="true" style={{ width: 36, height: 36, display: "grid", placeItems: "center", background: "#f1f5f9", borderRadius: 6, fontWeight: 600 }}>{brand.name.slice(0, 1).toUpperCase()}</div>
                        )}
                        <span style={{ fontWeight: 600 }}>{brand.name}</span>
                      </div>
                    </td>
                    <td style={tableCellStyle}>{brand.handle}</td>
                    <td style={{ ...tableCellStyle, color: "#64748b", maxWidth: 360 }}>{brand.description || "—"}</td>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => startEdit(brand)} style={secondaryButtonStyle}>Edit</button>
                        <button
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Delete the brand "${brand.name}"?`)) deleteMutation.mutate(brand.id)
                          }}
                          style={dangerButtonStyle}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "10px 12px",
  font: "inherit",
  background: "transparent",
}

const primaryButtonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 8,
  padding: "10px 16px",
  background: "#111827",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
}

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "8px 12px",
  background: "transparent",
  cursor: "pointer",
}

const dangerButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  borderColor: "#fecaca",
  color: "#b91c1c",
}

const tableHeaderStyle: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid #e2e8f0",
  color: "#64748b",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
}

const tableCellStyle: React.CSSProperties = {
  padding: "14px 10px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "middle",
}

export const config = defineRouteConfig({
  label: "Brands",
})
