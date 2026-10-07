import { EmptyState } from "@/components/EmptyState";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hooks/useQueries";
import { formatDateTime, formatPrice, pluralize } from "@/lib/format";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Package } from "lucide-react";
import { useEffect } from "react";

export function OrdersPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useInternetIdentity();
  const { data: orders, isLoading } = useOrders();

  useEffect(() => {
    if (!isAuthenticated) {
      void navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Заказы
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Мои заказы
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {["a", "b", "c"].map((id) => (
            <Skeleton key={id} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (orders ?? []).length === 0 ? (
        <EmptyState
          icon={Package}
          title="Заказов пока нет"
          description="Оформите первый заказ — он появится здесь вместе со статусом доставки."
          actionLabel="Перейти в каталог"
          onAction={() => void navigate({ to: "/catalog", search: {} })}
        />
      ) : (
        <div className="space-y-4">
          {(orders ?? []).map((order, index) => {
            const itemCount = order.items.reduce(
              (sum, item) => sum + Number(item.quantity),
              0,
            );
            return (
              <Link
                key={order.id.toString()}
                to="/orders/$orderId"
                params={{ orderId: order.id.toString() }}
                data-ocid={`orders.item.${index + 1}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-subtle transition-smooth hover:-translate-y-0.5 hover:shadow-product"
              >
                <div className="flex -space-x-3">
                  {order.items.slice(0, 3).map((item) => (
                    <div
                      key={`${order.id.toString()}-${item.productId.toString()}`}
                      className="h-12 w-12 overflow-hidden rounded-xl border-2 border-card bg-muted"
                    >
                      <img
                        src={item.image || "/assets/images/placeholder.svg"}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold">
                      №{order.id.toString().padStart(5, "0")}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDateTime(order.createdAt)} · {itemCount}{" "}
                    {pluralize(itemCount, "товар", "товара", "товаров")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold">
                    {formatPrice(order.total)}
                  </p>
                  <ChevronRight className="ml-auto mt-1 h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
