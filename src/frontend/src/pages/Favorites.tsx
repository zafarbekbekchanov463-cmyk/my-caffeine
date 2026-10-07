import { EmptyState } from "@/components/EmptyState";
import { ProductCard, ProductGridSkeleton } from "@/components/ProductCard";
import { useFavorites } from "@/hooks/useQueries";
import { useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";

export function FavoritesPage() {
  const { data: favorites, isLoading } = useFavorites();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Избранное
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Сохранённые товары
        </h1>
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : (favorites ?? []).length === 0 ? (
        <EmptyState
          icon={Heart}
          title="В избранном пока пусто"
          description="Нажимайте на сердечко у товара, чтобы сохранить его здесь и вернуться к нему позже."
          actionLabel="Перейти в каталог"
          onAction={() => void navigate({ to: "/catalog", search: {} })}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {(favorites ?? []).map((product, index) => (
            <ProductCard
              key={product.id.toString()}
              product={product}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
