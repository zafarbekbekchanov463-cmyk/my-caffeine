import { DeliveryMethod, ProductSort } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCart, useCheckout, useProducts } from "@/hooks/useQueries";
import { formatPrice, pluralize } from "@/lib/format";
import { type CartLine, DELIVERY_LABELS, deliveryCostFor } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link } from "@tanstack/react-router";

import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Package,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

const DELIVERY_ICONS: Record<DeliveryMethod, typeof Truck> = {
  courier: Truck,
  pickupPoint: Package,
  selfPickup: Store,
};

const DELIVERY_HINTS: Record<DeliveryMethod, string> = {
  courier: "Курьер до двери",
  pickupPoint: "Ближайший пункт выдачи",
  selfPickup: "Заберёте из магазина",
};

export function CheckoutPage() {
  const { isAuthenticated, login } = useInternetIdentity();
  const { data: cart } = useCart();
  const { data: products } = useProducts(
    { inStockOnly: false, onSaleOnly: false },
    ProductSort.popular,
    1,
    200,
  );
  const checkout = useCheckout();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMethod>(
    DeliveryMethod.courier,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placedOrderId, setPlacedOrderId] = useState<bigint | null>(null);

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
  const deliveryCost = deliveryCostFor(delivery, subtotal);
  const total = subtotal + deliveryCost;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "Укажите имя";
    if (!lastName.trim()) next.lastName = "Укажите фамилию";
    if (!phone.trim()) next.phone = "Укажите телефон";
    else if (phone.replace(/\D/g, "").length < 10)
      next.phone = "Проверьте номер телефона";
    if (!city.trim()) next.city = "Укажите город";
    if (delivery !== DeliveryMethod.selfPickup && !address.trim())
      next.address = "Укажите адрес";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isAuthenticated) {
      toast.error("Войдите, чтобы оформить заказ");
      login();
      return;
    }
    if (!validate()) {
      toast.error("Проверьте заполнение полей");
      return;
    }
    checkout.mutate(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim(),
        comment: comment.trim(),
        delivery,
      },
      {
        onSuccess: (order) => {
          setPlacedOrderId(order.id);
          toast.success("Заказ успешно оформлен!");
        },
        onError: () => toast.error("Не удалось оформить заказ"),
      },
    );
  }

  if (placedOrderId !== null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 md:px-6 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="overflow-hidden rounded-3xl border border-border bg-card shadow-product"
        >
          <div className="bg-gradient-primary px-6 py-10 text-center text-primary-foreground">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-foreground/15">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1
              className="mt-5 font-display text-3xl font-bold tracking-tight"
              data-ocid="checkout.success_state"
            >
              Заказ успешно оформлен
            </h1>
            <p className="mt-2 text-sm text-primary-foreground/80">
              Спасибо за покупку! Мы уже начали собирать ваш заказ.
            </p>
          </div>
          <div className="space-y-6 px-6 py-8">
            <div className="rounded-2xl border border-border bg-muted/40 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Номер заказа
              </p>
              <p
                className="mt-1 font-mono text-3xl font-bold tracking-tight"
                data-ocid="checkout.order_number"
              >
                №{placedOrderId.toString().padStart(5, "0")}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="flex-1 rounded-full"
                data-ocid="checkout.view_order_button"
              >
                <Link
                  to="/orders/$orderId"
                  params={{ orderId: placedOrderId.toString() }}
                >
                  Детали заказа
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="flex-1 rounded-full"
                data-ocid="checkout.continue_shopping_button"
              >
                <Link to="/catalog" search={{}}>
                  Продолжить покупки
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center md:px-6 md:py-24">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold">Корзина пуста</h1>
        <p className="mt-3 text-muted-foreground">
          Добавьте товары, прежде чем переходить к оформлению заказа.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/catalog" search={{}}>
            Перейти в каталог
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Оформление
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Оформление заказа
        </h1>
        <p className="text-muted-foreground">
          {itemCount} {pluralize(itemCount, "товар", "товара", "товаров")} в
          заказе
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-8 lg:grid-cols-[1fr_380px]"
      >
        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-subtle"
          >
            <h2 className="font-display text-lg font-bold">Получатель</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Анна"
                  autoComplete="given-name"
                  aria-invalid={Boolean(errors.firstName)}
                  data-ocid="checkout.first_name_input"
                  className="rounded-xl"
                />
                {errors.firstName ? (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="checkout.first_name_error"
                  >
                    {errors.firstName}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Иванова"
                  autoComplete="family-name"
                  aria-invalid={Boolean(errors.lastName)}
                  data-ocid="checkout.last_name_input"
                  className="rounded-xl"
                />
                {errors.lastName ? (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="checkout.last_name_error"
                  >
                    {errors.lastName}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 900 000-00-00"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  data-ocid="checkout.phone_input"
                  className="rounded-xl"
                />
                {errors.phone ? (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="checkout.phone_error"
                  >
                    {errors.phone}
                  </p>
                ) : null}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-subtle"
          >
            <h2 className="font-display text-lg font-bold">Доставка</h2>
            <RadioGroup
              value={delivery}
              onValueChange={(value) => setDelivery(value as DeliveryMethod)}
              className="grid gap-3 sm:grid-cols-3"
            >
              {(Object.keys(DELIVERY_LABELS) as DeliveryMethod[]).map(
                (method) => {
                  const Icon = DELIVERY_ICONS[method];
                  const methodCost = deliveryCostFor(method, subtotal);
                  return (
                    <Label
                      key={method}
                      htmlFor={`delivery-${method}`}
                      className="flex cursor-pointer flex-col gap-2 rounded-xl border border-border p-4 transition-smooth hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:shadow-subtle"
                    >
                      <span className="flex items-center justify-between">
                        <Icon className="h-5 w-5 text-primary" />
                        <RadioGroupItem
                          value={method}
                          id={`delivery-${method}`}
                          data-ocid={`checkout.delivery.${method}`}
                        />
                      </span>
                      <span className="text-sm font-semibold">
                        {DELIVERY_LABELS[method]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {DELIVERY_HINTS[method]}
                      </span>
                      <span className="text-xs font-medium text-primary">
                        {methodCost === 0
                          ? "Бесплатно"
                          : formatPrice(methodCost)}
                      </span>
                    </Label>
                  );
                },
              )}
            </RadioGroup>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Город</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Москва"
                  autoComplete="address-level2"
                  aria-invalid={Boolean(errors.city)}
                  data-ocid="checkout.city_input"
                  className="rounded-xl"
                />
                {errors.city ? (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="checkout.city_error"
                  >
                    {errors.city}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Адрес</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ул. Тверская, 1, кв. 10"
                  autoComplete="street-address"
                  disabled={delivery === DeliveryMethod.selfPickup}
                  aria-invalid={Boolean(errors.address)}
                  data-ocid="checkout.address_input"
                  className="rounded-xl"
                />
                {errors.address ? (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="checkout.address_error"
                  >
                    {errors.address}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Комментарий к заказу</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Позвонить за час до доставки"
                data-ocid="checkout.comment_textarea"
                className="rounded-xl"
              />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-subtle"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold">Оплата</h2>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <Lock className="h-4 w-4 shrink-0 text-primary" />
              Демонстрационный режим: реальные данные карты не требуются и не
              сохраняются.
            </div>
          </motion.section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-product">
            <h2 className="font-display text-xl font-bold">Ваш заказ</h2>
            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {lines.map((line) => (
                <div
                  key={`${line.product.id.toString()}-${line.color}-${line.size}`}
                  className="flex items-center gap-3"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={
                        line.product.images[0] ??
                        "/assets/images/placeholder.svg"
                      }
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {line.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      × {line.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatPrice(Number(line.product.price) * line.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Товары</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
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
            <Button
              type="submit"
              size="lg"
              disabled={checkout.isPending}
              data-ocid="checkout.submit_button"
              className="w-full rounded-full"
            >
              {checkout.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              {isAuthenticated ? "Подтвердить заказ" : "Войти и оформить"}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {delivery === DeliveryMethod.selfPickup
                ? "Самовывоз из магазина"
                : `Доставка: ${DELIVERY_LABELS[delivery]}`}
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
