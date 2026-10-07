import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart, useFavorites } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Heart,
  Home,
  LayoutGrid,
  LogIn,
  Moon,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";

const NAV_LINKS = [
  { to: "/catalog", label: "Каталог" },
  { to: "/catalog", label: "Новинки", search: { sort: "newest" } },
  { to: "/catalog", label: "Бренды", search: { brands: true } },
] as const;

const MOBILE_NAV = [
  { to: "/", label: "Главная", icon: Home },
  { to: "/catalog", label: "Каталог", icon: LayoutGrid },
  { to: "/cart", label: "Корзина", icon: ShoppingCart },
  { to: "/favorites", label: "Избранное", icon: Heart },
  { to: "/account", label: "Профиль", icon: User },
] as const;

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      data-ocid="theme.toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full"
    >
      {mounted && isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] font-bold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAuthenticated } = useInternetIdentity();
  const { data: cart } = useCart();
  const { data: favorites } = useFavorites();
  const [query, setQuery] = useState("");

  const cartCount = (cart ?? []).reduce(
    (sum, item) => sum + Number(item.quantity),
    0,
  );
  const favoritesCount = (favorites ?? []).length;

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    void navigate({ to: "/catalog", search: { q: trimmed } });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:gap-6 md:px-6">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2"
            aria-label="На главную"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <span className="hidden font-display text-xl font-bold tracking-tight sm:block">
              AURUM
            </span>
          </Link>

          <form
            onSubmit={handleSearch}
            className="relative hidden flex-1 md:block"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск товаров, брендов…"
              aria-label="Поиск товаров"
              data-ocid="header.search_input"
              className="h-10 rounded-full border-input bg-background pl-9"
            />
          </form>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                search={"search" in link ? link.search : {}}
                className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Link
              to="/favorites"
              aria-label="Избранное"
              data-ocid="header.favorites_link"
              className="relative grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
            >
              <Heart className="h-5 w-5" />
              <CountBadge count={favoritesCount} />
            </Link>
            <Link
              to="/cart"
              aria-label="Корзина"
              data-ocid="header.cart_link"
              className="relative grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
            >
              <ShoppingCart className="h-5 w-5" />
              <CountBadge count={cartCount} />
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={isAuthenticated ? "Личный кабинет" : "Войти"}
              data-ocid="header.account_button"
              onClick={() =>
                void navigate({ to: isAuthenticated ? "/account" : "/login" })
              }
              className="rounded-full"
            >
              {isAuthenticated ? (
                <User className="h-5 w-5" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 lg:pb-0">{children}</main>

      <footer className="border-t border-border bg-muted/50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-bold">AURUM</span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Современные предметы для вдумчивого дома. Качественные материалы и
              честные цены.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Магазин
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/catalog"
                  className="text-muted-foreground transition-smooth hover:text-foreground"
                >
                  Каталог
                </Link>
              </li>
              <li>
                <Link
                  to="/favorites"
                  className="text-muted-foreground transition-smooth hover:text-foreground"
                >
                  Избранное
                </Link>
              </li>
              <li>
                <Link
                  to="/cart"
                  className="text-muted-foreground transition-smooth hover:text-foreground"
                >
                  Корзина
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Аккаунт
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/account"
                  className="text-muted-foreground transition-smooth hover:text-foreground"
                >
                  Личный кабинет
                </Link>
              </li>
              <li>
                <Link
                  to="/orders"
                  className="text-muted-foreground transition-smooth hover:text-foreground"
                >
                  Мои заказы
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-muted-foreground transition-smooth hover:text-foreground"
                >
                  Войти
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Помощь
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Доставка и оплата</li>
              <li>Возврат товара</li>
              <li>Связаться с нами</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground md:flex-row md:px-6">
            <p>© {new Date().getFullYear()} AURUM. Все права защищены.</p>
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="transition-smooth hover:text-foreground"
            >
              © {new Date().getFullYear()}. Built with love using caffeine.ai
            </a>
          </div>
        </div>
      </footer>

      <nav
        aria-label="Основная навигация"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg lg:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {MOBILE_NAV.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <li key={item.label} className="flex-1">
                <Link
                  to={item.to}
                  data-ocid={`mobile_nav.${item.label.toLowerCase()}`}
                  className={cn(
                    "flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-smooth",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "fill-current")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
