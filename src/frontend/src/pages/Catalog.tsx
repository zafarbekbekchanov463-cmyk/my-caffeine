import { ProductSort } from "@/backend";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard, ProductGridSkeleton } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useBrands, useCategories, useProducts } from "@/hooks/useQueries";
import { formatNumber, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product, ProductFilter } from "@/types";
import { SORT_LABELS } from "@/types";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  ArrowDownUp,
  Check,
  PackageSearch,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 12;
const FACET_LIMIT = 200;
const RATING_OPTIONS = [4, 3, 2] as const;

const EMPTY_FILTER: ProductFilter = { inStockOnly: false, onSaleOnly: false };

function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface Suggestion {
  key: string;
  label: string;
  hint: string;
  to: "/catalog" | "/product/$productId";
  search?: { q?: string; category?: string };
  params?: { productId: string };
}

function CatalogSearch({
  initialQuery,
  onCommit,
  onNavigate,
}: {
  initialQuery: string;
  onCommit: (query: string) => void;
  onNavigate: (item: Suggestion) => void;
}) {
  const [value, setValue] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounced(value.trim(), 220);
  const { data: categories } = useCategories();
  const { data: matches } = useProducts(
    { ...EMPTY_FILTER, search: debounced || undefined },
    ProductSort.popular,
    1,
    6,
  );

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!debounced) return [];
    const list: Suggestion[] = [];
    const lower = debounced.toLowerCase();
    for (const category of categories ?? []) {
      if (category.name.toLowerCase().includes(lower)) {
        list.push({
          key: `category-${category.id.toString()}`,
          label: category.name,
          hint: "Категория",
          to: "/catalog",
          search: { category: category.slug },
        });
      }
    }
    for (const product of matches?.items ?? []) {
      list.push({
        key: `product-${product.id.toString()}`,
        label: product.name,
        hint: product.brand,
        to: "/product/$productId",
        params: { productId: product.id.toString() },
      });
    }
    return list.slice(0, 7);
  }, [debounced, categories, matches]);

  function commit(query: string) {
    setOpen(false);
    setActiveIndex(-1);
    onCommit(query);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        const item = suggestions[activeIndex];
        setOpen(false);
        setActiveIndex(-1);
        onNavigate(item);
      } else {
        commit(value.trim());
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Поиск по названию или категории…"
        aria-label="Поиск товаров"
        aria-expanded={open && suggestions.length > 0}
        aria-controls="catalog-search-suggestions"
        aria-autocomplete="list"
        data-ocid="catalog.search_input"
        className="h-12 rounded-full border-input bg-card pl-11 pr-11 text-base shadow-subtle"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue("");
            commit("");
          }}
          aria-label="Очистить поиск"
          data-ocid="catalog.search_clear_button"
          className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      {open && suggestions.length > 0 ? (
        <ul
          id="catalog-search-suggestions"
          data-ocid="catalog.search_suggestions"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-product-hover"
        >
          {suggestions.map((item, index) => (
            <li key={item.key}>
              <Link
                to={item.to}
                search={item.search ?? {}}
                params={item.params ?? {}}
                onClick={() => setOpen(false)}
                onMouseEnter={() => setActiveIndex(index)}
                data-ocid={`catalog.suggestion.${index + 1}`}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-smooth",
                  activeIndex === index
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="min-w-0 truncate font-medium text-foreground">
                  {item.label}
                </span>
                <span className="shrink-0 text-xs uppercase tracking-widest text-muted-foreground">
                  {item.hint}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  ocid,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ocid: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-ocid={ocid}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-smooth",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {active ? <Check className="h-3.5 w-3.5" /> : null}
      {children}
    </button>
  );
}

export function CatalogPage() {
  const search = useSearch({ from: "/catalog" });
  const navigate = useNavigate({ from: "/catalog" });
  const routerNavigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();

  const [page, setPage] = useState(1);
  const [minPrice, setMinPrice] = useState(search.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(search.maxPrice ?? "");
  const [brand, setBrand] = useState<string>(search.brand ?? "all");
  const [minRating, setMinRating] = useState<number | null>(
    search.minRating ?? null,
  );
  const [color, setColor] = useState<string | null>(search.color ?? null);
  const [size, setSize] = useState<string | null>(search.size ?? null);
  const [inStockOnly, setInStockOnly] = useState(search.inStockOnly ?? false);
  const [onSaleOnly, setOnSaleOnly] = useState(search.onSaleOnly ?? false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Reset pagination whenever the category, search query or sort changes so a
  // user on a later page never lands on an empty result set.
  const filterSignature = `${search.category ?? ""}|${search.q ?? ""}|${search.sort ?? ""}`;
  useEffect(() => {
    // `filterSignature` is the trigger; reading it keeps the dependency honest.
    void filterSignature;
    setPage(1);
  }, [filterSignature]);

  // Persist extended filters in the URL so they survive a page reload.
  useEffect(() => {
    void navigate({
      search: (prev) => ({
        ...prev,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        brand: brand === "all" ? undefined : brand,
        minRating: minRating ?? undefined,
        color: color ?? undefined,
        size: size ?? undefined,
        inStockOnly: inStockOnly || undefined,
        onSaleOnly: onSaleOnly || undefined,
      }),
      replace: true,
    });
  }, [
    minPrice,
    maxPrice,
    brand,
    minRating,
    color,
    size,
    inStockOnly,
    onSaleOnly,
    navigate,
  ]);

  const activeCategory = useMemo(
    () => (categories ?? []).find((c) => c.slug === search.category),
    [categories, search.category],
  );

  const sort = (search.sort as ProductSort | undefined) ?? ProductSort.popular;

  const filter: ProductFilter = useMemo(
    () => ({
      categoryId: activeCategory?.id,
      search: search.q,
      brand: brand === "all" ? undefined : brand,
      minPrice: minPrice ? BigInt(Math.max(0, Number(minPrice))) : undefined,
      maxPrice: maxPrice ? BigInt(Math.max(0, Number(maxPrice))) : undefined,
      minRating: minRating ?? undefined,
      color: color ?? undefined,
      size: size ?? undefined,
      inStockOnly,
      onSaleOnly,
    }),
    [
      activeCategory,
      search.q,
      brand,
      minPrice,
      maxPrice,
      minRating,
      color,
      size,
      inStockOnly,
      onSaleOnly,
    ],
  );

  const { data, isLoading } = useProducts(filter, sort, page, PAGE_SIZE);

  const { data: facets } = useProducts(
    EMPTY_FILTER,
    ProductSort.popular,
    1,
    FACET_LIMIT,
  );

  const colorOptions = useMemo(() => {
    const set = new Set<string>();
    for (const product of facets?.items ?? []) {
      for (const value of product.colors) set.add(value);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [facets]);

  const sizeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const product of facets?.items ?? []) {
      for (const value of product.sizes) set.add(value);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [facets]);

  const items: Product[] = data?.items ?? [];
  const total = data ? Number(data.total) : 0;
  const totalPages = data ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1;

  const activeFilterCount = [
    brand !== "all",
    !!minPrice,
    !!maxPrice,
    minRating !== null,
    color !== null,
    size !== null,
    inStockOnly,
    onSaleOnly,
  ].filter(Boolean).length;

  function resetFilters() {
    setMinPrice("");
    setMaxPrice("");
    setBrand("all");
    setMinRating(null);
    setColor(null);
    setSize(null);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setPage(1);
    void navigate({ search: {} });
  }

  function commitSearch(query: string) {
    setPage(1);
    void navigate({
      search: (prev) => ({ ...prev, q: query || undefined }),
    });
  }

  function navigateSuggestion(item: Suggestion) {
    if (item.to === "/product/$productId" && item.params) {
      void routerNavigate({
        to: "/product/$productId",
        params: item.params,
      });
    } else {
      void routerNavigate({
        to: "/catalog",
        search: item.search ?? {},
      });
    }
  }

  const hasActiveFilters =
    !!search.q || !!search.category || activeFilterCount > 0;

  const filterPanel = (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Цена, ₽
        </h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={minPrice}
            onChange={(event) => {
              setMinPrice(event.target.value);
              setPage(1);
            }}
            placeholder="от"
            aria-label="Цена от"
            data-ocid="catalog.min_price_input"
            className="rounded-xl"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={maxPrice}
            onChange={(event) => {
              setMaxPrice(event.target.value);
              setPage(1);
            }}
            placeholder="до"
            aria-label="Цена до"
            data-ocid="catalog.max_price_input"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Бренд
        </h3>
        <Select
          value={brand}
          onValueChange={(value) => {
            setBrand(value);
            setPage(1);
          }}
        >
          <SelectTrigger
            aria-label="Бренд"
            data-ocid="catalog.brand_select"
            className="rounded-xl"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все бренды</SelectItem>
            {(brands ?? []).map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Рейтинг
        </h3>
        <div className="flex flex-wrap gap-2">
          {RATING_OPTIONS.map((value) => (
            <FilterChip
              key={value}
              active={minRating === value}
              ocid={`catalog.rating_chip.${value}`}
              onClick={() => {
                setMinRating((current) => (current === value ? null : value));
                setPage(1);
              }}
            >
              <Star className="h-3.5 w-3.5 fill-current" />
              {value}+
            </FilterChip>
          ))}
        </div>
      </div>

      {colorOptions.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Цвет
          </h3>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((value) => (
              <FilterChip
                key={value}
                active={color === value}
                ocid={`catalog.color_chip.${value}`}
                onClick={() => {
                  setColor((current) => (current === value ? null : value));
                  setPage(1);
                }}
              >
                {value}
              </FilterChip>
            ))}
          </div>
        </div>
      ) : null}

      {sizeOptions.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Размер
          </h3>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((value) => (
              <FilterChip
                key={value}
                active={size === value}
                ocid={`catalog.size_chip.${value}`}
                onClick={() => {
                  setSize((current) => (current === value ? null : value));
                  setPage(1);
                }}
              >
                {value}
              </FilterChip>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Наличие и скидки
        </h3>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="inStock" className="text-sm">
            Только в наличии
          </Label>
          <Switch
            id="inStock"
            checked={inStockOnly}
            onCheckedChange={(value) => {
              setInStockOnly(value);
              setPage(1);
            }}
            data-ocid="catalog.in_stock_switch"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="onSale" className="text-sm">
            Только со скидкой
          </Label>
          <Switch
            id="onSale"
            checked={onSaleOnly}
            onCheckedChange={(value) => {
              setOnSaleOnly(value);
              setPage(1);
            }}
            data-ocid="catalog.on_sale_switch"
          />
        </div>
      </div>

      {hasActiveFilters ? (
        <Button
          type="button"
          variant="outline"
          onClick={resetFilters}
          data-ocid="catalog.reset_filters_button"
          className="w-full rounded-full"
        >
          <X className="mr-2 h-4 w-4" />
          Сбросить всё
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Каталог
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {activeCategory ? activeCategory.name : "Все товары"}
          </h1>
        </div>
        <div className="max-w-2xl">
          <CatalogSearch
            initialQuery={search.q ?? ""}
            onCommit={commitSearch}
            onNavigate={navigateSuggestion}
          />
        </div>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Link
          to="/catalog"
          search={{}}
          data-ocid="catalog.category.all"
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-smooth",
            !search.category
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          Все
        </Link>
        {(categories ?? []).map((category) => (
          <Link
            key={category.id.toString()}
            to="/catalog"
            search={{ category: category.slug }}
            data-ocid={`catalog.category.${category.slug}`}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-smooth",
              search.category === category.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {category.name}
          </Link>
        ))}
      </div>

      {search.brands ? (
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-subtle">
          <div className="mb-4 flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Бренды</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/catalog"
              search={{ brands: true }}
              data-ocid="catalog.brand.all"
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-smooth",
                brand === "all"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              Все бренды
            </Link>
            {(brands ?? []).map((value) => (
              <Link
                key={value}
                to="/catalog"
                search={{ brands: true, brand: value }}
                data-ocid={`catalog.brand.${value}`}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-smooth",
                  brand === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {value}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-5 shadow-subtle">
            <div className="mb-5 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-semibold">Фильтры</h2>
              {activeFilterCount > 0 ? (
                <Badge className="ml-auto rounded-full bg-primary text-primary-foreground">
                  {activeFilterCount}
                </Badge>
              ) : null}
            </div>
            {filterPanel}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen((value) => !value)}
              data-ocid="catalog.filters_toggle"
              className="rounded-full lg:hidden"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Фильтры
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>

            <p
              data-ocid="catalog.results_count"
              className="text-sm text-muted-foreground"
            >
              {isLoading ? (
                "Загрузка…"
              ) : (
                <>
                  Найдено{" "}
                  <span className="font-semibold text-foreground">
                    {formatNumber(total)}
                  </span>{" "}
                  {pluralize(total, "товар", "товара", "товаров")}
                </>
              )}
            </p>

            <div className="ml-auto flex items-center gap-2">
              <ArrowDownUp className="hidden h-4 w-4 text-muted-foreground sm:block" />
              <Label htmlFor="sort" className="sr-only">
                Сортировка
              </Label>
              <Select
                value={sort}
                onValueChange={(value) => {
                  setPage(1);
                  void navigate({
                    search: (prev) => ({ ...prev, sort: value }),
                  });
                }}
              >
                <SelectTrigger
                  id="sort"
                  data-ocid="catalog.sort_select"
                  className="w-48 rounded-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SORT_LABELS) as ProductSort[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {SORT_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filtersOpen ? (
            <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-subtle lg:hidden">
              {filterPanel}
            </div>
          ) : null}

          {isLoading ? (
            <ProductGridSkeleton count={PAGE_SIZE} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Ничего не найдено"
              description="Попробуйте изменить фильтры или поисковый запрос — возможно, подходящий товар ждёт вас в другой категории."
              actionLabel="Сбросить фильтры"
              onAction={resetFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                {items.map((product, index) => (
                  <motion.div
                    key={product.id.toString()}
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: reduceMotion ? 0 : Math.min(index, 8) * 0.04,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <ProductCard product={product} index={index} />
                  </motion.div>
                ))}
              </div>

              {totalPages > 1 ? (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    data-ocid="catalog.pagination_prev"
                    className="rounded-full"
                  >
                    Назад
                  </Button>
                  <span className="font-mono text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
                    data-ocid="catalog.pagination_next"
                    className="rounded-full"
                  >
                    Вперёд
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
