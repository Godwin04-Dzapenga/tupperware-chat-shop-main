import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, SlidersHorizontal, X, SearchX } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import type { StoreProduct } from "@/hooks/useCatalog";
import { useStoreUI } from "@/hooks/useStoreUI";
import { useStoreActions } from "@/hooks/useStoreActions";

export interface Crumb {
  label: string;
  to?: string;
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "savings" | "name";

const PRICE_RANGES = [
  { key: "0-100", label: "Under $100", min: 0, max: 100 },
  { key: "100-300", label: "$100 – $300", min: 100, max: 300 },
  { key: "300-600", label: "$300 – $600", min: 300, max: 600 },
  { key: "600-1200", label: "$600 – $1,200", min: 600, max: 1200 },
  { key: "1200-up", label: "$1,200 & above", min: 1200, max: Infinity },
];

const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Top Rated",
  savings: "Biggest Savings",
  name: "Name: A–Z",
};

interface ProductListingProps {
  title: string;
  subtitle?: string;
  products: StoreProduct[];
  loading?: boolean;
  crumbs?: Crumb[];
  defaultSort?: SortKey;
  emptyHint?: string;
}

export const ProductListing = ({
  title,
  subtitle,
  products,
  loading = false,
  crumbs = [],
  defaultSort = "featured",
  emptyHint,
}: ProductListingProps) => {
  const { compareProducts, toggleCompare, setQuickViewProduct } = useStoreUI();
  const { addProduct, orderViaWhatsApp } = useStoreActions();

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [selectedPower, setSelectedPower] = useState<string[]>([]);
  const [selectedVoltage, setSelectedVoltage] = useState<string[]>([]);
  const [selectedCapacity, setSelectedCapacity] = useState<string[]>([]);
  const [selectedWarranty, setSelectedWarranty] = useState<string[]>([]);
  const [installationOnly, setInstallationOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>(defaultSort);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      const brand = p.brand?.trim() || "Other";
      counts.set(brand, (counts.get(brand) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [products]);

  const productTypes = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      const type = p.product_type?.trim();
      if (type) counts.set(type, (counts.get(type) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [products]);

  const technicalOptions = useMemo(() => ({
    power: [...new Set(products.flatMap((p) => p.power_watts ? [String(p.power_watts)] : []))].sort((a, b) => Number(a) - Number(b)),
    voltage: [...new Set(products.flatMap((p) => p.voltage ? [p.voltage] : []))].sort(),
    capacity: [...new Set(products.flatMap((p) => p.capacity ? [p.capacity] : []))].sort(),
    warranty: [...new Set(products.flatMap((p) => p.warranty_months ? [String(p.warranty_months)] : []))].sort((a, b) => Number(a) - Number(b)),
  }), [products]);

  const activeFilterCount =
    selectedBrands.length +
    selectedTypes.length +
    selectedPower.length +
    selectedVoltage.length +
    selectedCapacity.length +
    selectedWarranty.length +
    (priceRange ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (topRatedOnly ? 1 : 0) +
    (installationOnly ? 1 : 0);

  const clearAll = () => {
    setSelectedBrands([]);
    setSelectedTypes([]);
    setPriceRange(null);
    setInStockOnly(false);
    setTopRatedOnly(false);
    setSelectedPower([]);
    setSelectedVoltage([]);
    setSelectedCapacity([]);
    setSelectedWarranty([]);
    setInstallationOnly(false);
  };

  const visible = useMemo(() => {
    let list = products;

    if (selectedBrands.length) {
      list = list.filter((p) => selectedBrands.includes(p.brand || "Other"));
    }

    if (selectedTypes.length) {
      list = list.filter((p) => selectedTypes.includes(p.product_type || ""));
    }

    if (selectedPower.length) list = list.filter((p) => p.power_watts != null && selectedPower.includes(String(p.power_watts)));
    if (selectedVoltage.length) list = list.filter((p) => p.voltage != null && selectedVoltage.includes(p.voltage));
    if (selectedCapacity.length) list = list.filter((p) => p.capacity != null && selectedCapacity.includes(p.capacity));
    if (selectedWarranty.length) list = list.filter((p) => p.warranty_months != null && selectedWarranty.includes(String(p.warranty_months)));
    if (installationOnly) list = list.filter((p) => p.installation_required);

    if (priceRange) {
      const range = PRICE_RANGES.find((r) => r.key === priceRange);
      if (range) list = list.filter((p) => p.price >= range.min && p.price < range.max);
    }

    if (inStockOnly) list = list.filter((p) => p.stock_quantity > 0);
    if (topRatedOnly) list = list.filter((p) => p.avg_rating >= 4);

    const sorted = [...list];

    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        sorted.sort((a, b) => b.avg_rating - a.avg_rating);
        break;
      case "savings":
        sorted.sort((a, b) => b.savings - a.savings);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sorted.sort(
          (a, b) =>
            Number(b.is_featured) - Number(a.is_featured) ||
            b.avg_rating - a.avg_rating
        );
    }

    return sorted;
  }, [products, selectedBrands, selectedTypes, selectedPower, selectedVoltage, selectedCapacity, selectedWarranty, priceRange, inStockOnly, topRatedOnly, installationOnly, sort]);

  const toggleValue = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const filterRail = (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-3 pb-2">
        <span className="text-sm font-bold text-bb-ink">Refine Results</span>
        {activeFilterCount > 0 && (
          <button onClick={clearAll} className="text-xs font-semibold text-bb-blue hover:underline">
            Clear all
          </button>
        )}
      </div>

      {brands.length > 0 && (
        <FilterSection title="Brand">
          {brands.map(([brand, count]) => (
            <label key={brand} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-700 hover:text-bb-ink">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleValue(brand, setSelectedBrands)}
                className="h-4 w-4 rounded border-slate-300 accent-bb-blue"
              />
              <span className="flex-1 truncate">{brand}</span>
              <span className="text-xs text-slate-400">{count}</span>
            </label>
          ))}
        </FilterSection>
      )}

      {productTypes.length > 0 && (
        <FilterSection title="Product Type">
          {productTypes.map(([type, count]) => (
            <label key={type} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-700 hover:text-bb-ink">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={() => toggleValue(type, setSelectedTypes)}
                className="h-4 w-4 rounded border-slate-300 accent-bb-blue"
              />
              <span className="flex-1 truncate capitalize">{type}</span>
              <span className="text-xs text-slate-400">{count}</span>
            </label>
          ))}
        </FilterSection>
      )}

      <FilterSection title="Price">
        {PRICE_RANGES.map((range) => {
          const count = products.filter((p) => p.price >= range.min && p.price < range.max).length;
          const disabled = count === 0 && priceRange !== range.key;

          return (
            <label
              key={range.key}
              className={`flex items-center gap-2 py-1 text-sm ${disabled ? "text-slate-300" : "cursor-pointer text-slate-700 hover:text-bb-ink"}`}
            >
              <input
                type="checkbox"
                disabled={disabled}
                checked={priceRange === range.key}
                onChange={() => setPriceRange((prev) => (prev === range.key ? null : range.key))}
                className="h-4 w-4 rounded border-slate-300 accent-bb-blue"
              />
              <span className="flex-1">{range.label}</span>
              <span className="text-xs text-slate-400">{count}</span>
            </label>
          );
        })}
      </FilterSection>

      {(technicalOptions.power.length > 0 || technicalOptions.voltage.length > 0 || technicalOptions.capacity.length > 0 || technicalOptions.warranty.length > 0) && (
        <FilterSection title="Technical Specifications">
          {technicalOptions.power.length > 0 && <TechnicalFilter title="Power" values={technicalOptions.power} selected={selectedPower} onToggle={(v) => toggleValue(v, setSelectedPower)} suffix=" W" />}
          {technicalOptions.voltage.length > 0 && <TechnicalFilter title="Voltage" values={technicalOptions.voltage} selected={selectedVoltage} onToggle={(v) => toggleValue(v, setSelectedVoltage)} />}
          {technicalOptions.capacity.length > 0 && <TechnicalFilter title="Capacity" values={technicalOptions.capacity} selected={selectedCapacity} onToggle={(v) => toggleValue(v, setSelectedCapacity)} />}
          {technicalOptions.warranty.length > 0 && <TechnicalFilter title="Warranty" values={technicalOptions.warranty} selected={selectedWarranty} onToggle={(v) => toggleValue(v, setSelectedWarranty)} suffix=" months" />}
        </FilterSection>
      )}

      <FilterSection title="Availability & Rating">
        <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-700 hover:text-bb-ink">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-bb-blue"
          />
          <span className="flex-1">In stock only</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-700 hover:text-bb-ink">
          <input
            type="checkbox"
            checked={installationOnly}
            onChange={(e) => setInstallationOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-bb-blue"
          />
          <span className="flex-1">Installation required</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-700 hover:text-bb-ink">
          <input
            type="checkbox"
            checked={topRatedOnly}
            onChange={(e) => setTopRatedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-bb-blue"
          />
          <span className="flex-1">Customer rating 4+</span>
        </label>
      </FilterSection>
    </div>
  );

  return (
    <div className="store-shell py-6">
      {crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-slate-500">
          {crumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-slate-400" />}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-bb-blue hover:underline">{crumb.label}</Link>
              ) : (
                <span className="font-semibold text-slate-700">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="mb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-bb-ink sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-600">{subtitle}</p>}
          </div>
          {!loading && <span className="text-xs font-semibold text-slate-500">{products.length} products</span>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="hidden self-start rounded-lg border border-slate-200 bg-white p-3 lg:sticky lg:top-36 lg:block">
          {filterRail}
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileFiltersOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold text-bb-ink hover:border-bb-blue lg:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-bb-red px-1.5 text-[10px] font-black text-white">{activeFilterCount}</span>
                )}
              </button>
              <span className="text-sm text-slate-600">
                {loading ? "Loading…" : <span className="font-bold text-bb-ink">{visible.length}</span>} items
              </span>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-500">
              Sort by
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-bb-ink focus:border-bb-blue focus:outline-none"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <option key={key} value={key}>{SORT_LABELS[key]}</option>
                ))}
              </select>
            </label>
          </div>

          {mobileFiltersOpen && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 lg:hidden">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-bb-ink">Filters</span>
                <button onClick={() => setMobileFiltersOpen(false)} className="text-slate-400 hover:text-bb-ink" aria-label="Close filters">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {filterRail}
            </div>
          )}

          {activeFilterCount > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {selectedBrands.map((brand) => (
                <FilterPill key={`brand-${brand}`} label={brand} onRemove={() => setSelectedBrands((prev) => prev.filter((b) => b !== brand))} />
              ))}
              {selectedTypes.map((type) => (
                <FilterPill key={`type-${type}`} label={type} onRemove={() => setSelectedTypes((prev) => prev.filter((t) => t !== type))} />
              ))}
              {selectedPower.map((value) => <FilterPill key={`power-${value}`} label={value + " W"} onRemove={() => setSelectedPower((prev) => prev.filter((v) => v !== value))} />)}
              {selectedVoltage.map((value) => <FilterPill key={`voltage-${value}`} label={value} onRemove={() => setSelectedVoltage((prev) => prev.filter((v) => v !== value))} />)}
              {selectedCapacity.map((value) => <FilterPill key={`capacity-${value}`} label={value} onRemove={() => setSelectedCapacity((prev) => prev.filter((v) => v !== value))} />)}
              {selectedWarranty.map((value) => <FilterPill key={`warranty-${value}`} label={value + " months warranty"} onRemove={() => setSelectedWarranty((prev) => prev.filter((v) => v !== value))} />)}
              {installationOnly && <FilterPill label="Installation required" onRemove={() => setInstallationOnly(false)} />}
              {priceRange && (
                <FilterPill label={PRICE_RANGES.find((r) => r.key === priceRange)?.label || ""} onRemove={() => setPriceRange(null)} />
              )}
              {inStockOnly && <FilterPill label="In stock" onRemove={() => setInStockOnly(false)} />}
              {topRatedOnly && <FilterPill label="4+ stars" onRemove={() => setTopRatedOnly(false)} />}
              <button onClick={clearAll} className="text-xs font-semibold text-bb-blue hover:underline">Clear all</button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="aspect-square rounded-lg bg-slate-100" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
                  <div className="mt-2 h-5 w-1/4 rounded bg-slate-100" />
                  <div className="mt-4 h-9 rounded-md bg-slate-100" />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center">
              <SearchX className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-lg font-bold text-bb-ink">No products match those filters</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">{emptyHint || "Try removing a filter or browsing another department."}</p>
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="mt-4 rounded-md bg-bb-yellow px-5 py-2 text-xs font-black uppercase tracking-wide text-black hover:bg-bb-yellow-dark">
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOrder={orderViaWhatsApp}
                  onQuickView={setQuickViewProduct}
                  onAddToCart={addProduct}
                  isCompared={compareProducts.some((c) => c.id === product.id)}
                  onToggleCompare={toggleCompare}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border-t border-slate-100 px-3 py-3 first:border-t-0">
    <div className="mb-1.5 text-xs font-black uppercase tracking-wide text-slate-500">{title}</div>
    <div className="space-y-0.5">{children}</div>
  </div>
);

const FilterPill = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white py-1 pl-3 pr-1.5 text-xs font-semibold text-bb-ink">
    {label}
    <button onClick={onRemove} className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-bb-ink" aria-label={`Remove ${label} filter`}>
      <X className="h-3 w-3" />
    </button>
  </span>
);


const TechnicalFilter = ({
  title,
  values,
  selected,
  onToggle,
  suffix = "",
}: {
  title: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
  suffix?: string;
}) => (
  <div className="mb-3 last:mb-0">
    <div className="mb-1 text-[11px] font-bold text-slate-500">{title}</div>
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onToggle(value)}
          className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${selected.includes(value) ? "border-bb-blue bg-blue-50 text-bb-blue" : "border-slate-200 bg-white text-slate-600 hover:border-bb-blue"}`}
        >
          {value}{suffix}
        </button>
      ))}
    </div>
  </div>
);