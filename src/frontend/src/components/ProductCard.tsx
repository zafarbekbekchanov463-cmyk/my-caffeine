import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddFavorite,
  useAddToCart,
  useFavorites,
  useRemoveFavorite,
} from "@/hooks/useQueries";
import { discountPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  index?: number;
  className?: string;
}

export function ProductCard({
  product,
  index = 0,
  className,
}: ProductCardProps) {
  const addToCart = useAddToCart();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const { data: favorites } = useFavorites();

  const isFavorite = (favorites ?? []).some((item) => item.id === product.id);
  const discount = discountPercent(product.price, product.oldPrice);
  const image = product.images[0] ?? "/assets/images/placeholder.svg";

  function handleAddToCart() {
    addToCart.mutate(
      {
        productId: product.id,
        quantity: 1,
        color: product.colors[0] ?? "",
        size: product.sizes[0] ?? "",
      },
      {
        onSuccess: () => toast.success("Товар добавлен в корзину"),
        onError: () => toast.error("Не удалось добавить товар"),
      },
    );
  }

  function handleToggleFavorite() {
    const action = isFavorite ? removeFavorite : addFavorite;
    action.mutate(product.id, {
      onSuccess: () =>
        toast.success(
          isFavorite ? "Удалено из избранного" : "Добавлено в избранное",
        ),
      onError: () => toast.error("Не удалось обновить избранное"),
    });
  }

  return (
    <article
      data-ocid={`product.item.${index + 1}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-product transition-smooth hover:-translate-y-1 hover:shadow-product-hover",
        className,
      )}
    >
      <Link
        to="/product/$productId"
        params={{ productId: product.id.toString() }}
        className="relative block overflow-hidden bg-muted"
        aria-label={product.name}
      >
        <div className="aspect-square w-full overflow-hidden">
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-smooth group-hover:scale-105"
          />
        </div>
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 ? (
            <Badge className="rounded-full bg-accent text-accent-foreground">
              −{discount}%
            </Badge>
          ) : null}
          {product.isNew ? (
            <Badge className="rounded-full bg-primary text-primary-foreground">
              Новинка
            </Badge>
          ) : null}
        </div>
      </Link>

      <button
        type="button"
        onClick={handleToggleFavorite}
        aria-label={
          isFavorite ? "Удалить из избранного" : "Добавить в избранное"
        }
        aria-pressed={isFavorite}
        data-ocid={`product.favorite_button.${index + 1}`}
        className={cn(
          "absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-border bg-card/90 backdrop-blur transition-smooth hover:scale-105",
          isFavorite ? "text-destructive" : "text-muted-foreground",
        )}
      >
        <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {product.brand}
        </p>
        <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-base font-semibold leading-snug">
          <Link
            to="/product/$productId"
            params={{ productId: product.id.toString() }}
          >
            {product.name}
          </Link>
        </h3>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
          <span className="font-medium text-foreground">
            {product.rating.toFixed(1)}
          </span>
          <span>({product.reviewCount.toString()})</span>
        </div>

        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-display text-lg font-bold">
            {formatPrice(product.price)}
          </span>
          {discount > 0 ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.oldPrice)}
            </span>
          ) : null}
        </div>

        <Button
          type="button"
          onClick={handleAddToCart}
          disabled={addToCart.isPending || !product.inStock}
          data-ocid={`product.add_to_cart_button.${index + 1}`}
          className="mt-2 w-full rounded-full"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {product.inStock ? "В корзину" : "Нет в наличии"}
        </Button>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-product">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-full rounded-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  const ids = Array.from({ length: count }, (_, i) => `product-skeleton-${i}`);
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
      {ids.map((id) => (
        <ProductCardSkeleton key={id} />
      ))}
    </div>
  );
}
