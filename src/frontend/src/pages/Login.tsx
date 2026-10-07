import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Loader2,
  LogIn,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useEffect } from "react";

const BENEFITS = [
  { icon: ShoppingBag, text: "История заказов и повтор покупок" },
  { icon: Sparkles, text: "Избранное, доступное с любого устройства" },
  { icon: ShieldCheck, text: "Безопасный вход без пароля" },
];

export function LoginPage() {
  const { login, clear, isAuthenticated, isLoggingIn, loginError } =
    useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: "/account" });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
      <div className="animate-fade-up space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Безопасный вход
        </span>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Войдите в аккаунт AURUM
        </h1>
        <p className="max-w-md text-muted-foreground">
          Используйте Internet Identity — современный способ входа без пароля.
          Ваши данные защищены, а вход занимает несколько секунд.
        </p>
        <ul className="space-y-3">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <li
                key={benefit.text}
                className="flex items-center gap-3 text-sm"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {benefit.text}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="animate-fade-up rounded-3xl border border-border bg-card p-8 shadow-elevated">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold">AURUM</span>
        </div>

        {isAuthenticated ? (
          <>
            <h2 className="font-display text-2xl font-bold">Вы уже вошли</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Управляйте профилем и заказами в личном кабинете или выйдите из
              аккаунта на этом устройстве.
            </p>
            <div className="mt-6 space-y-3">
              <Button
                type="button"
                size="lg"
                onClick={() => void navigate({ to: "/account" })}
                data-ocid="login.account_button"
                className="w-full rounded-full"
              >
                Перейти в личный кабинет
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  clear();
                  void navigate({ to: "/" });
                }}
                data-ocid="login.logout_button"
                className="w-full rounded-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold">
              Добро пожаловать
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Войдите или создайте аккаунт, чтобы оформлять заказы и сохранять
              избранное.
            </p>

            {loginError ? (
              <p
                className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
                data-ocid="login.error_state"
              >
                Не удалось войти. Попробуйте ещё раз.
              </p>
            ) : null}

            <div className="mt-6 space-y-3">
              <Button
                type="button"
                size="lg"
                onClick={() => login()}
                disabled={isLoggingIn}
                data-ocid="login.submit_button"
                className="w-full rounded-full"
              >
                {isLoggingIn ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                {isLoggingIn ? "Входим…" : "Войти"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => login()}
                disabled={isLoggingIn}
                data-ocid="login.register_button"
                className="w-full rounded-full"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Создать аккаунт
              </Button>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Регистрация и вход проходят через Internet Identity — без пароля и
              без хранения лишних данных.
            </p>
            <div className="mt-6 text-center text-sm">
              <Link
                to="/catalog"
                search={{}}
                className="text-primary transition-smooth hover:underline"
              >
                Продолжить без входа
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
