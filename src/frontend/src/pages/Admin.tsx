import { ProductSort } from "@/backend";
import { EmptyState } from "@/components/EmptyState";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useImageUpload } from "@/hooks/useImageUpload";
import {
  useAllOrders,
  useCallerRole,
  useCategories,
  useCreateCategory,
  useCreateProduct,
  useDashboardStats,
  useDeleteCategory,
  useDeleteProduct,
  useProducts,
  useUpdateCategory,
  useUpdateOrderStatus,
  useUpdateProduct,
  useUsers,
} from "@/hooks/useQueries";
import { formatDateTime, formatNumber, formatPrice } from "@/lib/format";
import type { Category, OrderStatus, Product } from "@/types";
import { ORDER_STATUS_LABELS } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Boxes,
  ImagePlus,
  Loader2,
  Package,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

const CHART_CONFIG = {
  sales: { label: "Выручка", color: "var(--chart-1)" },
  orders: { label: "Заказы", color: "var(--chart-2)" },
  count: { label: "Заказы", color: "var(--chart-2)" },
} as const;

const STATUS_COLORS: Record<string, string> = {
  accepted: "var(--chart-1)",
  assembling: "var(--chart-2)",
  shipped: "var(--chart-5)",
  delivered: "var(--chart-3)",
};

interface ProductFormState {
  name: string;
  brand: string;
  price: string;
  oldPrice: string;
  stock: string;
  categoryId: string;
  description: string;
  imageUrl: string;
  sizes: string[];
  colors: string[];
  specs: [string, string][];
  isPopular: boolean;
  isNew: boolean;
}

const EMPTY_PRODUCT_FORM: ProductFormState = {
  name: "",
  brand: "",
  price: "",
  oldPrice: "",
  stock: "",
  categoryId: "",
  description: "",
  imageUrl: "",
  sizes: [],
  colors: [],
  specs: [],
  isPopular: false,
  isNew: true,
};

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-card p-5 shadow-subtle ${className ?? ""}`}
    >
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ImageField({
  id,
  value,
  onChange,
  ocid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  ocid: string;
}) {
  const { isUploading, progress, error, upload, reset } = useImageUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const url = await upload(file);
    if (url) onChange(url);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Изображение товара</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
          {value ? (
            <img
              src={value}
              alt="Предпросмотр товара"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-muted-foreground">
              <ImagePlus className="h-6 w-6" />
            </span>
          )}
          {isUploading ? (
            <span className="absolute inset-0 grid place-items-center bg-background/70">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              data-ocid={`${ocid}.upload_button`}
              className="rounded-full"
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isUploading ? `Загрузка ${progress}%` : "Загрузить файл"}
            </Button>
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange("");
                  reset();
                }}
                data-ocid={`${ocid}.clear_button`}
                className="rounded-full text-muted-foreground hover:text-destructive"
              >
                <X className="mr-2 h-4 w-4" />
                Убрать
              </Button>
            ) : null}
          </div>
          {isUploading ? (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-smooth"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
          <Input
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="или вставьте ссылку на изображение"
            data-ocid={ocid}
            className="rounded-xl"
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function AdminPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useInternetIdentity();
  const { data: role, isLoading: roleLoading } = useCallerRole();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: products, isLoading: productsLoading } = useProducts(
    { inStockOnly: false, onSaleOnly: false },
    ProductSort.newest,
    1,
    50,
  );
  const { data: categories } = useCategories();
  const { data: orders, isLoading: ordersLoading } = useAllOrders();
  const { data: users, isLoading: usersLoading } = useUsers();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const updateOrderStatus = useUpdateOrderStatus();

  const [form, setForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const isAdmin = role === "admin";

  useEffect(() => {
    if (!isAuthenticated) {
      void navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  const salesByDay = useMemo(
    () =>
      (stats?.salesByDay ?? []).map(([day, total]) => ({
        day,
        sales: Number(total),
      })),
    [stats],
  );

  const ordersByStatus = useMemo(
    () =>
      (stats?.ordersByStatus ?? []).map(([status, count]) => ({
        status,
        label: ORDER_STATUS_LABELS[status as OrderStatus] ?? status,
        count: Number(count),
      })),
    [stats],
  );

  const popularProducts = stats?.popularProducts ?? [];

  function updateForm<K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildProductInput(state: ProductFormState) {
    const priceValue = BigInt(Math.max(0, Number(state.price) || 0));
    const oldPriceValue = state.oldPrice
      ? BigInt(Math.max(0, Number(state.oldPrice) || 0))
      : priceValue;
    const stockValue = BigInt(Math.max(0, Number(state.stock) || 0));
    return {
      name: state.name.trim(),
      brand: state.brand.trim() || "AURUM",
      description: state.description.trim(),
      price: priceValue,
      oldPrice: oldPriceValue,
      discount:
        oldPriceValue > priceValue && oldPriceValue > 0n
          ? BigInt(
              Math.round(
                (Number(oldPriceValue - priceValue) / Number(oldPriceValue)) *
                  100,
              ),
            )
          : 0n,
      stock: stockValue,
      categoryId: BigInt(state.categoryId),
      inStock: stockValue > 0n,
      isPopular: state.isPopular,
      isNew: state.isNew,
      sizes: state.sizes,
      colors: state.colors,
      specs: state.specs,
      images: state.imageUrl.trim()
        ? [state.imageUrl.trim()]
        : ["/assets/images/placeholder.svg"],
    };
  }

  function handleCreateProduct(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.price || !form.categoryId) {
      toast.error("Заполните название, цену и категорию");
      return;
    }
    const input = buildProductInput(form);
    createProduct.mutate(input, {
      onSuccess: () => {
        toast.success("Товар добавлен");
        setForm(EMPTY_PRODUCT_FORM);
      },
      onError: () => toast.error("Не удалось добавить товар"),
    });
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      brand: product.brand,
      price: product.price.toString(),
      oldPrice: product.oldPrice.toString(),
      stock: product.stock.toString(),
      categoryId: product.categoryId.toString(),
      description: product.description,
      imageUrl: product.images[0] ?? "",
      sizes: [...product.sizes],
      colors: [...product.colors],
      specs: product.specs.map(([key, value]) => [key, value]),
      isPopular: product.isPopular,
      isNew: product.isNew,
    });
    setEditOpen(true);
  }

  function handleUpdateProduct(event: FormEvent) {
    event.preventDefault();
    if (editingId === null) return;
    if (!form.name.trim() || !form.price || !form.categoryId) {
      toast.error("Заполните название, цену и категорию");
      return;
    }
    const input = buildProductInput(form);
    updateProduct.mutate(
      { id: editingId, data: input },
      {
        onSuccess: () => {
          toast.success("Товар обновлён");
          setEditOpen(false);
          setEditingId(null);
          setForm(EMPTY_PRODUCT_FORM);
        },
        onError: () => toast.error("Не удалось обновить товар"),
      },
    );
  }

  function handleCreateCategory(event: FormEvent) {
    event.preventDefault();
    if (!categoryName.trim() || !categorySlug.trim()) {
      toast.error("Заполните название и slug");
      return;
    }
    createCategory.mutate(
      {
        name: categoryName.trim(),
        slug: categorySlug.trim(),
        icon: categoryIcon.trim() || "📦",
      },
      {
        onSuccess: () => {
          toast.success("Категория добавлена");
          setCategoryName("");
          setCategorySlug("");
          setCategoryIcon("");
        },
        onError: () => toast.error("Не удалось добавить категорию"),
      },
    );
  }

  function handleUpdateCategory(event: FormEvent) {
    event.preventDefault();
    if (!editingCategory) return;
    if (!categoryName.trim() || !categorySlug.trim()) {
      toast.error("Заполните название и slug");
      return;
    }
    updateCategory.mutate(
      {
        id: editingCategory.id,
        data: {
          name: categoryName.trim(),
          slug: categorySlug.trim(),
          icon: categoryIcon.trim() || "📦",
        },
      },
      {
        onSuccess: () => {
          toast.success("Категория обновлена");
          setEditingCategory(null);
          setCategoryName("");
          setCategorySlug("");
          setCategoryIcon("");
        },
        onError: () => toast.error("Не удалось обновить категорию"),
      },
    );
  }

  function startEditCategory(category: Category) {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategorySlug(category.slug);
    setCategoryIcon(category.icon);
  }

  function cancelCategoryEdit() {
    setEditingCategory(null);
    setCategoryName("");
    setCategorySlug("");
    setCategoryIcon("");
  }

  if (!isAuthenticated) return null;

  if (roleLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <Skeleton className="h-10 w-64" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center md:px-6">
        <h1 className="font-display text-3xl font-bold">Доступ ограничен</h1>
        <p className="mt-3 text-muted-foreground">
          Раздел доступен только администраторам магазина.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <a href="/">На главную</a>
        </Button>
      </div>
    );
  }

  return (
    <div
      data-ocid="admin.page"
      className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12"
    >
      <div className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Управление
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Админ-панель
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Сводка по продажам, товарам и заказам магазина AURUM.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          ["a", "b", "c", "d"].map((id) => (
            <Skeleton key={id} className="h-28 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={TrendingUp}
              label="Выручка"
              value={formatPrice(stats?.salesTotal ?? 0)}
              hint="За всё время"
            />
            <StatCard
              icon={ShoppingCart}
              label="Заказов"
              value={formatNumber(stats?.orderCount ?? 0)}
              hint="Оформлено"
            />
            <StatCard
              icon={Package}
              label="Товаров"
              value={formatNumber(stats?.productCount ?? 0)}
              hint="В каталоге"
            />
            <StatCard
              icon={Users}
              label="Пользователей"
              value={formatNumber(stats?.userCount ?? 0)}
              hint="Зарегистрировано"
            />
          </>
        )}
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <Panel
          title="Динамика продаж"
          description="Выручка по дням"
          className="lg:col-span-2"
        >
          {statsLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : salesByDay.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Недостаточно данных для графика
            </p>
          ) : (
            <ChartContainer
              config={CHART_CONFIG}
              data-ocid="admin.sales_chart"
              className="h-64 w-full"
            >
              <AreaChart data={salesByDay} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={(value: number) => formatNumber(value)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatPrice(Number(value))}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#salesFill)"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </Panel>

        <Panel title="Заказы по статусам" description="Текущее распределение">
          {statsLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : ordersByStatus.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Заказов пока нет
            </p>
          ) : (
            <ChartContainer
              config={CHART_CONFIG}
              data-ocid="admin.orders_chart"
              className="h-64 w-full"
            >
              <BarChart data={ordersByStatus} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {ordersByStatus.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? "var(--chart-1)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </Panel>
      </div>

      <Panel
        title="Популярные товары"
        description="Наиболее востребованные позиции"
        className="mb-8"
      >
        {statsLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : popularProducts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Пока нет данных о продажах
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {popularProducts.slice(0, 4).map((product, index) => (
              <div
                key={product.id.toString()}
                data-ocid={`admin.popular_product.${index + 1}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <img
                    src={product.images[0] ?? "/assets/images/placeholder.svg"}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Tabs defaultValue="products">
        <TabsList className="rounded-full">
          <TabsTrigger
            value="products"
            data-ocid="admin.tab.products"
            className="rounded-full"
          >
            Товары
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            data-ocid="admin.tab.categories"
            className="rounded-full"
          >
            Категории
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            data-ocid="admin.tab.orders"
            className="rounded-full"
          >
            Заказы
          </TabsTrigger>
          <TabsTrigger
            value="users"
            data-ocid="admin.tab.users"
            className="rounded-full"
          >
            Пользователи
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6 space-y-6">
          <form
            onSubmit={handleCreateProduct}
            className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-subtle md:grid-cols-3"
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="p-name">Название</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="Керамическая ваза"
                data-ocid="admin.product_name_input"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-brand">Бренд</Label>
              <Input
                id="p-brand"
                value={form.brand}
                onChange={(e) => updateForm("brand", e.target.value)}
                placeholder="AURUM"
                data-ocid="admin.product_brand_input"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-price">Цена, ₽</Label>
              <Input
                id="p-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
                placeholder="2990"
                data-ocid="admin.product_price_input"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-old">Старая цена, ₽</Label>
              <Input
                id="p-old"
                type="number"
                min={0}
                value={form.oldPrice}
                onChange={(e) => updateForm("oldPrice", e.target.value)}
                placeholder="3990"
                data-ocid="admin.product_old_price_input"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-stock">Остаток, шт.</Label>
              <Input
                id="p-stock"
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => updateForm("stock", e.target.value)}
                placeholder="10"
                data-ocid="admin.product_stock_input"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-category">Категория</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) => updateForm("categoryId", value)}
              >
                <SelectTrigger
                  id="p-category"
                  data-ocid="admin.product_category_select"
                  className="rounded-xl"
                >
                  <SelectValue placeholder="Выберите" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((category) => (
                    <SelectItem
                      key={category.id.toString()}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <ImageField
                id="p-image"
                value={form.imageUrl}
                onChange={(value) => updateForm("imageUrl", value)}
                ocid="admin.product_image_input"
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="p-desc">Описание</Label>
              <Textarea
                id="p-desc"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Краткое описание товара"
                data-ocid="admin.product_description_textarea"
                className="rounded-xl"
              />
            </div>
            <div className="md:col-span-3">
              <Button
                type="submit"
                disabled={createProduct.isPending}
                data-ocid="admin.create_product_button"
                className="rounded-full"
              >
                {createProduct.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Добавить товар
              </Button>
            </div>
          </form>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-subtle">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Товар</TableHead>
                  <TableHead>Бренд</TableHead>
                  <TableHead className="text-right">Цена</TableHead>
                  <TableHead className="text-right">Остаток</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ) : (products?.items ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8">
                      <EmptyState
                        icon={Boxes}
                        title="Товаров пока нет"
                        description="Добавьте первый товар через форму выше, чтобы он появился в каталоге."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  (products?.items ?? []).map((product, index) => (
                    <TableRow
                      key={product.id.toString()}
                      data-ocid={`admin.product_row.${index + 1}`}
                    >
                      <TableCell className="max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                            <img
                              src={
                                product.images[0] ??
                                "/assets/images/placeholder.svg"
                              }
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <span className="truncate font-medium">
                            {product.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.brand}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.inStock ? (
                          <Badge variant="secondary" className="rounded-full">
                            {product.stock.toString()}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="rounded-full">
                            Нет
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Редактировать товар"
                            data-ocid={`admin.edit_product_button.${index + 1}`}
                            onClick={() => openEdit(product)}
                            className="rounded-full text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Удалить товар"
                            data-ocid={`admin.delete_product_button.${index + 1}`}
                            onClick={() =>
                              deleteProduct.mutate(product.id, {
                                onSuccess: () => toast.success("Товар удалён"),
                                onError: () =>
                                  toast.error("Не удалось удалить товар"),
                              })
                            }
                            className="rounded-full text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-6 space-y-6">
          <form
            onSubmit={
              editingCategory ? handleUpdateCategory : handleCreateCategory
            }
            className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-subtle md:grid-cols-4"
          >
            <div className="space-y-2">
              <Label htmlFor="c-name">Название</Label>
              <Input
                id="c-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Свет"
                data-ocid="admin.category_name_input"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-slug">Slug</Label>
              <Input
                id="c-slug"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                placeholder="lighting"
                data-ocid="admin.category_slug_input"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-icon">Иконка</Label>
              <Input
                id="c-icon"
                value={categoryIcon}
                onChange={(e) => setCategoryIcon(e.target.value)}
                placeholder="💡"
                data-ocid="admin.category_icon_input"
                className="rounded-xl"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                type="submit"
                disabled={createCategory.isPending || updateCategory.isPending}
                data-ocid="admin.create_category_button"
                className="flex-1 rounded-full"
              >
                {createCategory.isPending || updateCategory.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : editingCategory ? (
                  <Pencil className="mr-2 h-4 w-4" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {editingCategory ? "Сохранить" : "Добавить"}
              </Button>
              {editingCategory ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelCategoryEdit}
                  data-ocid="admin.cancel_category_button"
                  className="rounded-full"
                >
                  Отмена
                </Button>
              ) : null}
            </div>
          </form>

          {(categories ?? []).length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="Категорий пока нет"
              description="Создайте первую категорию, чтобы сгруппировать товары каталога."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(categories ?? []).map((category, index) => (
                <div
                  key={category.id.toString()}
                  data-ocid={`admin.category_card.${index + 1}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-subtle"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-xl">
                    {category.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{category.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {category.slug}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Редактировать категорию"
                    data-ocid={`admin.edit_category_button.${index + 1}`}
                    onClick={() => startEditCategory(category)}
                    className="rounded-full text-muted-foreground hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Удалить категорию"
                    data-ocid={`admin.delete_category_button.${index + 1}`}
                    onClick={() =>
                      deleteCategory.mutate(category.id, {
                        onSuccess: () => toast.success("Категория удалена"),
                        onError: () =>
                          toast.error("Не удалось удалить категорию"),
                      })
                    }
                    className="rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-subtle">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Заказ</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ) : (orders ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8">
                      <EmptyState
                        icon={ShoppingCart}
                        title="Заказов пока нет"
                        description="Как только покупатели оформят заказы, они появятся здесь."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  (orders ?? []).map((order, index) => (
                    <TableRow
                      key={order.id.toString()}
                      data-ocid={`admin.order_row.${index + 1}`}
                    >
                      <TableCell className="font-mono font-semibold">
                        №{order.id.toString().padStart(5, "0")}
                      </TableCell>
                      <TableCell>
                        {order.firstName} {order.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatPrice(order.total)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <OrderStatusBadge status={order.status} />
                          <Select
                            value={order.status}
                            onValueChange={(value) =>
                              updateOrderStatus.mutate(
                                { id: order.id, status: value as OrderStatus },
                                {
                                  onSuccess: () =>
                                    toast.success("Статус обновлён"),
                                  onError: () =>
                                    toast.error("Не удалось обновить статус"),
                                },
                              )
                            }
                          >
                            <SelectTrigger
                              data-ocid={`admin.order_status_select.${index + 1}`}
                              className="h-8 w-36 rounded-full"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                Object.keys(
                                  ORDER_STATUS_LABELS,
                                ) as OrderStatus[]
                              ).map((status) => (
                                <SelectItem key={status} value={status}>
                                  {ORDER_STATUS_LABELS[status]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-subtle">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Город</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ) : (users ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8">
                      <EmptyState
                        icon={Users}
                        title="Пользователей пока нет"
                        description="Зарегистрированные покупатели появятся в этом списке."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  (users ?? []).map(([principal, profile], index) => (
                    <TableRow
                      key={principal.toString()}
                      data-ocid={`admin.user_row.${index + 1}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {(profile.name || "?").charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {profile.name || "Без имени"}
                            </p>
                            <p className="truncate font-mono text-xs text-muted-foreground">
                              {principal.toString().slice(0, 12)}…
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {profile.email || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {profile.phone || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {profile.city || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditingId(null);
            setForm(EMPTY_PRODUCT_FORM);
          }
        }}
      >
        <DialogContent
          data-ocid="admin.edit_product_modal"
          className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              Редактирование товара
            </DialogTitle>
            <DialogDescription>
              Измените цену, скидку, количество и другие параметры товара.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleUpdateProduct}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="e-name">Название</Label>
              <Input
                id="e-name"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                data-ocid="admin.edit_product_name_input"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-brand">Бренд</Label>
              <Input
                id="e-brand"
                value={form.brand}
                onChange={(e) => updateForm("brand", e.target.value)}
                data-ocid="admin.edit_product_brand_input"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-category">Категория</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) => updateForm("categoryId", value)}
              >
                <SelectTrigger
                  id="e-category"
                  data-ocid="admin.edit_product_category_select"
                  className="rounded-xl"
                >
                  <SelectValue placeholder="Выберите" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((category) => (
                    <SelectItem
                      key={category.id.toString()}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-price">Цена, ₽</Label>
              <Input
                id="e-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
                data-ocid="admin.edit_product_price_input"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-old">Старая цена, ₽</Label>
              <Input
                id="e-old"
                type="number"
                min={0}
                value={form.oldPrice}
                onChange={(e) => updateForm("oldPrice", e.target.value)}
                data-ocid="admin.edit_product_old_price_input"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-stock">Остаток, шт.</Label>
              <Input
                id="e-stock"
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => updateForm("stock", e.target.value)}
                data-ocid="admin.edit_product_stock_input"
                className="rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <ImageField
                id="e-image"
                value={form.imageUrl}
                onChange={(value) => updateForm("imageUrl", value)}
                ocid="admin.edit_product_image_input"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="e-desc">Описание</Label>
              <Textarea
                id="e-desc"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                data-ocid="admin.edit_product_description_textarea"
                className="rounded-xl"
              />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                data-ocid="admin.cancel_edit_button"
                className="rounded-full"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={updateProduct.isPending}
                data-ocid="admin.save_product_button"
                className="rounded-full"
              >
                {updateProduct.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
