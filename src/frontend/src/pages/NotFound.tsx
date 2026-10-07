import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center md:px-6">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-muted text-muted-foreground">
        <Compass className="h-9 w-9" />
      </span>
      <p className="mt-6 font-mono text-sm text-primary">404</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">
        Страница не найдена
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Возможно, страница была перемещена или ссылка устарела. Вернитесь на
        главную или откройте каталог.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild className="rounded-full">
          <Link to="/">На главную</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/catalog" search={{}}>
            В каталог
          </Link>
        </Button>
      </div>
    </div>
  );
}
