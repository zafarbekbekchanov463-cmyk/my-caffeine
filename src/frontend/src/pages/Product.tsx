import { ProductCard, ProductGridSkeleton } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAddFavorite,
  useAddToCart,
  useFavorites,
  useProduct,
  useRemoveFavorite,
  useReviews,
  useSimilarProducts,
} from "@/hooks/useQueries";
import { discountPercent, formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Heart,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const DELIVERY_OPTIONS = [
  {
    icon: Truck,
    title: "Курьером до двери",
    detail: "1–2 дня по городу, 3–5 дней по России",
  },
  {
    icon: Package,
    title: "В пункт выдачи",
    detail: "2–4 дня, более 12 000 точек по стране",
  },
  {
    icon: Zap,
    title: "Экспресс-доставка",
    detail: "В день заказа при оформлении до 14:00",
  },
];

export function ProductPage() {
  const { productId } = useParams({ from: "/product/$productId" });
  const navigate = useNavigate();
  const id = useMemo(() => {
    try {
      return BigInt(productId);
    } catch {
      return null;
    }
  }, [productId]);
  const { data: product, isLoading } = useProduct(id ?? 0n);
  const { data: reviews } = useReviews(id ?? 0n);
  const { data: similar, isLoading: similarLoading } = useSimilarProducts(
    id ?? 0n,
    4,
  );
  const { data: favorites } = useFavorites();
  const addToCart = useAddToCart();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);

  if (id === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-6">
        <h1 className="font-display text-3xl font-bold">Товар не найден</h1>
        <p className="mt-3 text-muted-foreground">
          Возможно, он был удалён или ссылка устарела.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/catalog" search={{}}>
            Вернуться в каталог
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="flex gap-3">
              {["a", "b", "c", "d"].map((key) => (
                <Skeleton key={key} className="h-20 w-20 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-6">
        <h1 className="font-display text-3xl font-bold">Товар не найден</h1>
        <p className="mt-3 text-muted-foreground">
          Возможно, он был удалён или ссылка устарела.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/catalog" search={{}}>
            Вернуться в каталог
          </Link>
        </Button>
      </div>
    );
  }

  const discount = discountPercent(product.price, product.oldPrice);
  const isFavorite = (favorites ?? []).some((item) => item.id === product.id);
  const selectedColor = color ?? product.colors[0] ?? "";
  const selectedSize = size ?? product.sizes[0] ?? "";
  const images =
    product.images.length > 0
      ? product.images
      : ["/assets/images/placeholder.svg"];

  function handleAddToCart() {
    addToCart.mutate(
      {
        productId: product!.id,
        quantity,
        color: selectedColor,
        size: selectedSize,
      },
      {
        onSuccess: () => toast.success("Товар добавлен в корзину"),
        onError: () => toast.error("Не удалось добавить товар"),
      },
    );
  }

  function handleBuyNow() {
    addToCart.mutate(
      {
        productId: product!.id,
        quantity,
        color: selectedColor,
        size: selectedSize,
      },
      {
        onSuccess: () => void navigate({ to: "/checkout" }),
        onError: () => toast.error("Не удалось оформить заказ"),
      },
    );
  }

  function handleToggleFavorite() {
    const action = isFavorite ? removeFavorite : addFavorite;
    action.mutate(product!.id, {
      onSuccess: () =>
        toast.success(
          isFavorite ? "Удалено из избранного" : "Добавлено в избранное",
        ),
      onError: () => toast.error("Не удалось обновить избранное"),
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <Link
        to="/catalog"
        search={{}}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-smooth hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад в каталог
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <div className="group overflow-hidden rounded-2xl border border-border bg-muted shadow-product">
            <img
              src={images[activeImage]}
              alt={product.name}
              className="aspect-square w-full object-cover transition-smooth group-hover:scale-[1.02]"
            />
          </div>
          {images.length > 1 ? (
            <div className="flex gap-3">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`Изображение ${index + 1}`}
                  aria-current={activeImage === index}
                  data-ocid={`product.thumbnail.${index + 1}`}
                  className={cn(
                    "h-20 w-20 overflow-hidden rounded-xl border-2 bg-muted transition-smooth hover:opacity-100",
                    activeImage === index
                      ? "border-primary"
                      : "border-transparent opacity-70",
                  )}
                >
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              {product.brand}
            </Badge>
            {product.isNew ? (
              <Badge className="rounded-full bg-primary text-primary-foreground">
                Новинка
              </Badge>
            ) : null}
            {discount > 0 ? (
              <Badge className="rounded-full bg-accent text-accent-foreground">
                −{discount}%
              </Badge>
            ) : null}
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {product.name}
          </h1>

          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-4 w-4",
                    star < Math.round(product.rating)
                      ? "fill-accent text-accent"
                      : "text-muted-foreground",
                  )}
                />
              ))}
            </div>
            <span className="font-medium">{product.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              · {product.reviewCount.toString()} отзывов
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold">
              {formatPrice(product.price)}
            </span>
            {discount > 0 ? (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.oldPrice)}
              </span>
            ) : null}
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          {product.colors.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Цвет</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-pressed={selectedColor === c}
                    data-ocid={`product.color.${c}`}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm transition-smooth",
                      selectedColor === c
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {product.sizes.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Размер</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    aria-pressed={selectedSize === s}
                    data-ocid={`product.size.${s}`}
                    className={cn(
                      "min-w-12 rounded-full border px-4 py-1.5 text-sm transition-smooth",
                      selectedSize === s
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2 text-sm">
            {product.inStock ? (
              <span className="inline-flex items-center gap-1.5 text-success">
                <Check className="h-4 w-4" /> В наличии
              </span>
            ) : (
              <span className="text-destructive">Нет в наличии</span>
            )}
            <span className="text-muted-foreground">
              · осталось {product.stock.toString()} шт.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-border">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Уменьшить количество"
                data-ocid="product.quantity_decrease"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="rounded-full"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-mono text-sm">
                {quantity}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Увеличить количество"
                data-ocid="product.quantity_increase"
                onClick={() => setQuantity((q) => q + 1)}
                className="rounded-full"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={
                isFavorite ? "Удалить из избранного" : "Добавить в избранное"
              }
              aria-pressed={isFavorite}
              data-ocid="product.favorite_button"
              onClick={handleToggleFavorite}
              className={cn("rounded-full", isFavorite && "text-destructive")}
            >
              <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              size="lg"
              onClick={handleAddToCart}
              disabled={addToCart.isPending || !product.inStock}
              data-ocid="product.add_to_cart_button"
              className="rounded-full"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {product.inStock ? "Добавить в корзину" : "Нет в наличии"}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={handleBuyNow}
              disabled={addToCart.isPending || !product.inStock}
              data-ocid="product.buy_now_button"
              className="rounded-full"
            >
              <Zap className="mr-2 h-4 w-4" />
              Купить сейчас
            </Button>
          </div>

          <div className="grid gap-2 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Доставка от 1 дня. Бесплатно при заказе от 5 000 ₽.
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Гарантия подлинности и безопасная оплата.
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-primary" />
              Возврат в течение 14 дней без объяснения причин.
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="description" className="mt-14">
        <TabsList className="rounded-full">
          <TabsTrigger
            value="description"
            data-ocid="product.tab.description"
            className="rounded-full"
          >
            Описание
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            data-ocid="product.tab.specs"
            className="rounded-full"
          >
            Характеристики
          </TabsTrigger>
          <TabsTrigger
            value="delivery"
            data-ocid="product.tab.delivery"
            className="rounded-full"
          >
            Доставка
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-subtle">
            <p className="leading-relaxed text-muted-foreground">
              {product.description}
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {product.name} от {product.brand} — это сочетание продуманного
              дизайна и надёжных материалов. Товар проходит контроль качества
              перед отправкой и поставляется в оригинальной упаковке
              производителя.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="specs" className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {product.specs.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                Характеристики для этого товара пока не указаны.
              </p>
            ) : (
              <dl>
                {product.specs.map(([key, value], index) => (
                  <div
                    key={key}
                    className={cn(
                      "grid grid-cols-2 gap-4 px-6 py-4 text-sm",
                      index % 2 === 1 && "bg-muted/40",
                    )}
                  >
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            {DELIVERY_OPTIONS.map((option) => (
              <div
                key={option.title}
                className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <option.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-display text-base font-semibold">
                  {option.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {option.detail}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Бесплатная доставка при заказе от 5 000 ₽. Стоимость курьерской
            доставки — 490 ₽. Отслеживание заказа доступно в личном кабинете.
          </p>
        </TabsContent>
      </Tabs>

      <section className="mt-14">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Отзывы покупателей
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-medium text-foreground">
              {product.rating.toFixed(1)}
            </span>
            <span>· {product.reviewCount.toString()} отзывов</span>
          </div>
        </div>
        <div className="space-y-4">
          {(reviews ?? []).length === 0 ? (
            <p
              data-ocid="product.reviews_empty_state"
              className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground"
            >
              Отзывов пока нет. Станьте первым, кто поделится впечатлением.
            </p>
          ) : (
            (reviews ?? []).map((review, index) => (
              <div
                key={review.id.toString()}
                data-ocid={`product.review.${index + 1}`}
                className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                      {review.author.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{review.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-3.5 w-3.5",
                          star < Number(review.rating)
                            ? "fill-accent text-accent"
                            : "text-muted-foreground",
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {review.text}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <Separator className="my-14" />

      <section>
        <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">
          Похожие товары
        </h2>
        {similarLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (similar ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Похожих товаров пока нет.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {(similar ?? []).map((item, index) => (
              <ProductCard
                key={item.id.toString()}
                product={item}
                index={index}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
