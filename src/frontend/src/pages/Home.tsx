import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  useCategories,
  useDiscountedProducts,
  useNewProducts,
  usePopularProducts,
  useTopProducts,
} from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Banknote,
  CreditCard,
  Headphones,
  Package,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";

const PERKS = [
  {
    icon: Truck,
    title: "Быстрая доставка",
    text: "От 1 дня по всей России",
  },
  {
    icon: ShieldCheck,
    title: "Гарантия качества",
    text: "Проверенные материалы",
  },
  {
    icon: RotateCcw,
    title: "Лёгкий возврат",
    text: "14 дней на обмен",
  },
  {
    icon: Headphones,
    title: "Поддержка 24/7",
    text: "Ответим в любое время",
  },
];

const DELIVERY_STEPS = [
  {
    icon: Package,
    title: "Сборка заказа",
    text: "Аккуратно упакуем каждый предмет в защитную тару.",
  },
  {
    icon: Truck,
    title: "Доставка",
    text: "Курьером, в пункт выдачи или самовывозом — как удобно.",
  },
  {
    icon: RotateCcw,
    title: "Возврат",
    text: "14 дней на обмен или возврат без лишних вопросов.",
  },
];

const PAYMENT_METHODS = [
  { icon: CreditCard, label: "Банковские карты" },
  { icon: Smartphone, label: "СБП и переводы" },
  { icon: Banknote, label: "При получении" },
];

const REVIEWS = [
  {
    name: "Анна Ковалёва",
    initials: "АК",
    rating: 5,
    text: "Заказывала набор керамики — пришло идеально упакованным, цвета точно как на фото. Теперь это любимая посуда дома.",
  },
  {
    name: "Дмитрий Соколов",
    initials: "ДС",
    rating: 5,
    text: "Лампа с плетёным абажуром превзошла ожидания. Свет тёплый, сборка простая, доставили на следующий день.",
  },
  {
    name: "Мария Лебедева",
    initials: "МЛ",
    rating: 4,
    text: "Текстиль мягкий и плотный, швы аккуратные. Немного дольше ждала доставку, но результат того стоил.",
  },
  {
    name: "Игорь Петров",
    initials: "ИП",
    rating: 5,
    text: "Отличный магазин: честные цены, понятный сайт и быстрая поддержка. Заказываю уже третий раз.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: { to: string; label: string };
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {eyebrow}
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h2>
      </div>
      {action ? (
        <Link
          to={action.to}
          search={{}}
          className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary transition-smooth hover:gap-2 sm:flex"
        >
          {action.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function ProductCarousel({
  products,
  loading,
  ocid,
}: {
  products: Product[] | undefined;
  loading: boolean;
  ocid: string;
}) {
  if (loading) {
    const ids = Array.from({ length: 4 }, (_, i) => `${ocid}-skeleton-${i}`);
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {ids.map((id) => (
          <ProductCardSkeleton key={id} />
        ))}
      </div>
    );
  }

  const items = products ?? [];
  if (items.length === 0) return null;

  return (
    <Carousel
      opts={{ align: "start", loop: false }}
      className="w-full"
      data-ocid={ocid}
    >
      <CarouselContent className="-ml-4">
        {items.map((product, index) => (
          <CarouselItem
            key={product.id.toString()}
            className="basis-1/2 pl-4 md:basis-1/3 lg:basis-1/4"
          >
            <ProductCard product={product} index={index} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden md:inline-flex" />
      <CarouselNext className="hidden md:inline-flex" />
    </Carousel>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Оценка ${rating} из 5`}
    >
      {Array.from({ length: 5 }, (_, i) => `star-${i}`).map((id, i) => (
        <Star
          key={id}
          className={cn(
            "h-4 w-4",
            i < rating ? "fill-accent text-accent" : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}

export function HomePage() {
  const { data: categories } = useCategories();
  const { data: newProducts, isLoading: newLoading } = useNewProducts(8);
  const { data: discounted, isLoading: discountLoading } =
    useDiscountedProducts(8);
  const { data: popular, isLoading: popularLoading } = usePopularProducts(8);
  const { data: top, isLoading: topLoading } = useTopProducts(8);

  return (
    <div>
      {/* Hero banner */}
      <section
        className="relative overflow-hidden bg-gradient-subtle"
        data-ocid="home.hero_section"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
          <div className="animate-fade-up space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Новая коллекция
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Новые товары уже здесь
            </h1>
            <p className="max-w-md text-base text-muted-foreground md:text-lg">
              Керамика, текстиль и свет — тщательно отобранные вещи, которые
              делают пространство спокойным и цельным.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/catalog" search={{}} data-ocid="home.hero_cta">
                  Смотреть товары
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full"
              >
                <Link to="/catalog" search={{ sort: "newest" }}>
                  Новинки
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative animate-fade-in">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-elevated">
              <img
                src="/assets/generated/hero-objects.dim_1600x1000.jpg"
                alt="Керамическая ваза, лампа и посуда на тёплом фоне"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden animate-float rounded-2xl border border-border bg-card px-4 py-3 shadow-elevated sm:block">
              <p className="font-mono text-xs text-muted-foreground">
                от 1 990 ₽
              </p>
              <p className="font-display text-sm font-semibold">
                Более 200 товаров
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Perks strip */}
      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4 md:px-6">
          {PERKS.map((perk) => {
            const Icon = perk.icon;
            return (
              <div key={perk.title} className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card text-primary shadow-subtle">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{perk.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {perk.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <section
        className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24"
        data-ocid="home.categories_section"
      >
        <SectionHeading eyebrow="Категории" title="Выберите своё" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {(categories ?? []).map((category) => (
            <Link
              key={category.id.toString()}
              to="/catalog"
              search={{ category: category.slug }}
              data-ocid={`home.category.${category.slug}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-subtle transition-smooth hover:-translate-y-1 hover:shadow-product"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-2xl transition-smooth group-hover:bg-primary/10">
                {category.icon}
              </span>
              <span className="text-sm font-medium">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section
        className="bg-muted/40 py-16 md:py-24"
        data-ocid="home.new_section"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeading
            eyebrow="Свежие находки"
            title="Новинки"
            action={{ to: "/catalog", label: "Все новинки" }}
          />
          <ProductCarousel
            products={newProducts}
            loading={newLoading}
            ocid="home.new_carousel"
          />
        </div>
      </section>

      {/* Discounted */}
      <section
        className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24"
        data-ocid="home.discount_section"
      >
        <SectionHeading
          eyebrow="Выгодно"
          title="Товары со скидкой"
          action={{ to: "/catalog", label: "Все акции" }}
        />
        <ProductCarousel
          products={discounted}
          loading={discountLoading}
          ocid="home.discount_carousel"
        />
      </section>

      {/* Popular */}
      <section
        className="bg-muted/40 py-16 md:py-24"
        data-ocid="home.popular_section"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeading
            eyebrow="Выбор покупателей"
            title="Популярные товары"
            action={{ to: "/catalog", label: "Смотреть всё" }}
          />
          <ProductCarousel
            products={popular}
            loading={popularLoading}
            ocid="home.popular_carousel"
          />
        </div>
      </section>

      {/* Top rated */}
      <section
        className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24"
        data-ocid="home.top_section"
      >
        <SectionHeading
          eyebrow="Лучшее"
          title="Лучшие товары"
          action={{ to: "/catalog", label: "Смотреть всё" }}
        />
        <ProductCarousel
          products={top}
          loading={topLoading}
          ocid="home.top_carousel"
        />
      </section>

      {/* Reviews */}
      <section
        className="bg-muted/40 py-16 md:py-24"
        data-ocid="home.reviews_section"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeading eyebrow="Отзывы" title="Что говорят покупатели" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {REVIEWS.map((review, index) => (
              <figure
                key={review.name}
                data-ocid={`home.review.${index + 1}`}
                className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-subtle transition-smooth hover:-translate-y-1 hover:shadow-product"
              >
                <Stars rating={review.rating} />
                <blockquote className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  «{review.text}»
                </blockquote>
                <figcaption className="flex items-center gap-3 border-t border-border pt-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 font-display text-sm font-semibold text-primary">
                      {review.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {review.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Проверенный покупатель
                    </p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery */}
      <section
        className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24"
        data-ocid="home.delivery_section"
      >
        <SectionHeading eyebrow="Доставка" title="Как это работает" />
        <div className="grid gap-4 md:grid-cols-3">
          {DELIVERY_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                data-ocid={`home.delivery_step.${index + 1}`}
                className="relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-subtle"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="font-mono text-xs text-muted-foreground">
                  0{index + 1}
                </p>
                <h3 className="font-display text-lg font-semibold">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Payment + CTA */}
      <section
        className="mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24"
        data-ocid="home.payment_section"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary px-6 py-14 text-center text-primary-foreground md:px-16 md:py-20">
          <Badge className="mb-6 rounded-full bg-primary-foreground/15 text-primary-foreground">
            Оплата
          </Badge>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight md:text-4xl">
            Соберите дом, в котором хочется остаться
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
            Более 200 предметов для интерьера. Доставка от одного дня и лёгкий
            возврат.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <span
                  key={method.label}
                  className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-2 text-sm font-medium"
                >
                  <Icon className="h-4 w-4" />
                  {method.label}
                </span>
              );
            })}
          </div>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="mt-8 rounded-full"
          >
            <Link to="/catalog" search={{}} data-ocid="home.payment_cta">
              Перейти в каталог
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
