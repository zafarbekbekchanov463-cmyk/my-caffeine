import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder } from "@/hooks/useQueries";
import { formatDateTime, formatPrice } from "@/lib/format";
import { DELIVERY_LABELS } from "@/types";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, MapPin, Phone, Truck } from "lucide-react";

export function OrderDetailPage() {
  const { orderId } = useParams({ from: "/orders/$orderId" });
  const { data: order, isLoading } = useOrder(BigInt(orderId));

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <Skeleton className="mb-6 h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-6">
        <h1 className="font-display text-3xl font-bold">Заказ не найден</h1>
        <p className="mt-3 text-muted-foreground">Возможно, ссылка устарела.</p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/orders">К списку заказов</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <Link
        to="/orders"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-smooth hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Все заказы
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Заказ
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            №{order.id.toString().padStart(5, "0")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-success/10 p-4 text-sm">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
        <p className="text-muted-foreground">
          Заказ принят. Мы свяжемся с вами для подтверждения деталей доставки.
        </p>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-subtle">
          <h2 className="mb-4 font-display text-lg font-bold">Состав заказа</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={`${item.productId.toString()}-${item.color}-${item.size}`}
                className="flex items-center gap-4"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <img
                    src={item.image || "/assets/images/placeholder.svg"}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.color ? `Цвет: ${item.color}` : ""}
                    {item.color && item.size ? " · " : ""}
                    {item.size ? `Размер: ${item.size}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    × {item.quantity.toString()}
                  </p>
                </div>
                <span className="font-semibold">
                  {formatPrice(Number(item.price) * Number(item.quantity))}
                </span>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Товары</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {Number(order.discount) > 0 ? (
              <div className="flex justify-between text-success">
                <span>Скидка</span>
                <span>−{formatPrice(order.discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Доставка</span>
              <span>
                {Number(order.deliveryCost) === 0
                  ? "Бесплатно"
                  : formatPrice(order.deliveryCost)}
              </span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-baseline justify-between">
            <span className="font-medium">Итого</span>
            <span className="font-display text-2xl font-bold">
              {formatPrice(order.total)}
            </span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-subtle">
            <div className="mb-3 flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <h2 className="font-display font-bold">Доставка</h2>
            </div>
            <p className="text-sm font-medium">
              {DELIVERY_LABELS[order.delivery]}
            </p>
            <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {order.city}
              {order.address ? `, ${order.address}` : ""}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-subtle">
            <div className="mb-3 flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <h2 className="font-display font-bold">Получатель</h2>
            </div>
            <p className="text-sm font-medium">
              {order.firstName} {order.lastName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{order.phone}</p>
            {order.comment ? (
              <p className="mt-2 text-xs italic text-muted-foreground">
                «{order.comment}»
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
