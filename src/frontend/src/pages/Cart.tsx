import { ProductSort } from "@/backend";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCart,
  useClearCart,
  useProducts,
  useRemoveFromCart,
  useUpdateCartItem,
} from "@/hooks/useQueries";
import { formatPrice, pluralize } from "@/lib/format";
import { type CartLine, DELIVERY_COST, FREE_DELIVERY_FROM } from "@/types";
import { Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

export function CartPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading } = useCart();
  const { data: products } = useProducts(
    { inStockOnly: false, onSaleOnly: false },
    ProductSort.popular,
    1,
    200,
  );
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const clearCart = useClearCart();

  const lines: CartLine[] = useMemo(() => {
    if (!cart || !products) return [];
    return cart
      .map((item) => {
        const product = products.items.find((p) => p.id === item.productId);
        if (!product) return null;
        return {
          product,
          quantity: Number(item.quantity),
          color: item.color,
          size: item.size,
        };
      })
      .filter((line): line is CartLine => line !== null);
  }, [cart, products]);

  const subtotal = lines.reduce(
    (sum, line) => sum + Number(line.product.price) * line.quantity,
    0,
  );
  const discount = lines.reduce(
    (sum, line) =>
      sum +
      Math.max(0, Number(line.product.oldPrice) - Number(line.product.price)) *
        line.quantity,
    0,
  );
  const deliveryCost =
    subtotal >= FREE_DELIVERY_FROM || subtotal === 0 ? 0 : DELIVERY_COST;
  const total = subtotal + deliveryCost;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  function handleQuantity(productId: bigint, quantity: number) {
    if (quantity < 1) return;
    updateItem.mutate(
      { productId, quantity },
      { onError: () => toast.error("Не удалось обновить количество") },
    );
  }

  function handleRemove(productId: bigint) {
    removeItem.mutate(productId, {
      onSuccess: () => toast.success("Товар удалён из корзины"),
      onError: () => toast.error("Не удалось удалить товар"),
    });
  }

  function handleClear() {
    clearCart.mutate(undefined, {
      onSuccess: () => toast.success("Корзина очищена"),
      onError: () => toast.error("Не удалось очистить корзину"),
    });
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {["a", "b", "c"].map((id) => (
              <Skeleton key={id} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
        <EmptyState
          icon={ShoppingBag}
          title="Корзина пуста"
          description="Добавьте товары из каталога — они появятся здесь, и вы сможете оформить заказ."
          actionLabel="Перейти в каталог"
          onAction={() => void navigate({ to: "/catalog", search: {} })}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Корзина
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {itemCount} {pluralize(itemCount, "товар", "товара", "товаров")}
          </h1>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={handleClear}
          disabled={clearCart.isPending}
          data-ocid="cart.clear_button"
          className="rounded-full text-muted-foreground"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Очистить
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {lines.map((line, index) => (
            <div
              key={`${line.product.id.toString()}-${line.color}-${line.size}`}
              data-ocid={`cart.item.${index + 1}`}
              className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-subtle"
            >
              <Link
                to="/product/$productId"
                params={{ productId: line.product.id.toString() }}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted"
              >
                <img
                  src={
                    line.product.images[0] ?? "/assets/images/placeholder.svg"
                  }
                  alt={line.product.name}
                  className="h-full w-full object-cover"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {line.product.brand}
                    </p>
                    <Link
                      to="/product/$productId"
                      params={{ productId: line.product.id.toString() }}
                      className="line-clamp-2 font-display font-semibold leading-snug transition-smooth hover:text-primary"
                    >
                      {line.product.name}
                    </Link>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Удалить товар"
                    data-ocid={`cart.remove_button.${index + 1}`}
                    onClick={() => handleRemove(line.product.id)}
                    className="shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  {line.color ? `Цвет: ${line.color}` : ""}
                  {line.color && line.size ? " · " : ""}
                  {line.size ? `Размер: ${line.size}` : ""}
                </p>

                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center rounded-full border border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Уменьшить количество"
                      data-ocid={`cart.decrease_button.${index + 1}`}
                      onClick={() =>
                        handleQuantity(line.product.id, line.quantity - 1)
                      }
                      className="h-8 w-8 rounded-full"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center font-mono text-sm">
                      {line.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Увеличить количество"
                      data-ocid={`cart.increase_button.${index + 1}`}
                      onClick={() =>
                        handleQuantity(line.product.id, line.quantity + 1)
                      }
                      className="h-8 w-8 rounded-full"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <span className="font-display font-bold">
                    {formatPrice(Number(line.product.price) * line.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-product">
            <h2 className="font-display text-xl font-bold">Итого</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Товары</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 ? (
                <div className="flex justify-between text-success">
                  <span>Скидка</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Доставка</span>
                <span>
                  {deliveryCost === 0 ? "Бесплатно" : formatPrice(deliveryCost)}
                </span>
              </div>
            </div>
            <Separator />
            <div className="flex items-baseline justify-between">
              <span className="font-medium">К оплате</span>
              <span className="font-display text-2xl font-bold">
                {formatPrice(total)}
              </span>
            </div>
            {subtotal < FREE_DELIVERY_FROM ? (
              <p className="rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                До бесплатной доставки осталось{" "}
                {formatPrice(FREE_DELIVERY_FROM - subtotal)}
              </p>
            ) : null}
            <Button asChild size="lg" className="w-full rounded-full">
              <Link to="/checkout" data-ocid="cart.checkout_button">
                Оформить заказ
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full rounded-full">
              <Link to="/catalog" search={{}}>
                Продолжить покупки
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
