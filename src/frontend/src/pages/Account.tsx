import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCallerProfile,
  useCallerRole,
  useOrders,
  useSaveProfile,
} from "@/hooks/useQueries";
import { formatPrice } from "@/lib/format";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Loader2, LogOut, Package, User } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

export function AccountPage() {
  const navigate = useNavigate();
  const { isAuthenticated, clear, identity } = useInternetIdentity();
  const { data: profile, isLoading } = useCallerProfile();
  const { data: role } = useCallerRole();
  const { data: orders } = useOrders();
  const saveProfile = useSaveProfile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (profile && !initialized) {
      setName(profile.name);
      setEmail(profile.email);
      setPhone(profile.phone);
      setCity(profile.city);
      setAddress(profile.address);
      setInitialized(true);
    }
  }, [profile, initialized]);

  useEffect(() => {
    if (!isAuthenticated) {
      void navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveProfile.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim(),
      },
      {
        onSuccess: () => toast.success("Профиль сохранён"),
        onError: () => toast.error("Не удалось сохранить профиль"),
      },
    );
  }

  if (!isAuthenticated) return null;

  const orderCount = (orders ?? []).length;
  const totalSpent = (orders ?? []).reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );
  const isAdmin = role === "admin";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary font-display text-xl font-bold text-primary-foreground">
            {(name || "A").slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Личный кабинет
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              {name || "Покупатель"}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin ? (
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/admin" data-ocid="account.admin_link">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Админ-панель
              </Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              clear();
              void navigate({ to: "/" });
            }}
            data-ocid="account.logout_button"
            className="rounded-full text-muted-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle">
          <p className="text-sm text-muted-foreground">Заказов</p>
          <p className="mt-1 font-display text-3xl font-bold">{orderCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle">
          <p className="text-sm text-muted-foreground">Потрачено</p>
          <p className="mt-1 font-display text-3xl font-bold">
            {formatPrice(totalSpent)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle">
          <p className="text-sm text-muted-foreground">Статус</p>
          <p className="mt-1 font-display text-3xl font-bold">
            {isAdmin ? "Админ" : "Покупатель"}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-subtle"
        >
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold">Данные профиля</h2>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {["a", "b", "c", "d"].map((id) => (
                <Skeleton key={id} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Имя</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Анна Иванова"
                    data-ocid="account.name_input"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="anna@example.com"
                    data-ocid="account.email_input"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 900 000-00-00"
                    data-ocid="account.phone_input"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Город</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Москва"
                    data-ocid="account.city_input"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Адрес доставки</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ул. Тверская, 1, кв. 10"
                  data-ocid="account.address_input"
                  className="rounded-xl"
                />
              </div>
              <Button
                type="submit"
                disabled={saveProfile.isPending}
                data-ocid="account.save_button"
                className="rounded-full"
              >
                {saveProfile.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Сохранить изменения
              </Button>
            </>
          )}
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-subtle">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold">Заказы</h2>
            </div>
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground">
              У вас {orderCount} {orderCount === 1 ? "заказ" : "заказов"}.
              Отслеживайте статус и детали доставки.
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-4 w-full rounded-full"
            >
              <Link to="/orders" data-ocid="account.orders_link">
                Мои заказы
              </Link>
            </Button>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-subtle">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Идентификатор
            </p>
            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
              {identity?.getPrincipal().toString() ?? "—"}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
