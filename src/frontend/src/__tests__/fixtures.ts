// `@/types` re-exports these as types only; the runtime enums live in `@/backend`.
import { DeliveryMethod, OrderStatus } from "@/backend";
import type {
  Category,
  Order,
  OrderItem,
  Product,
  Review,
  UserProfile,
} from "@/types";

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1n,
    categoryId: 1n,
    inStock: true,
    name: "Керамическая ваза",
    createdAt: 1_700_000_000_000_000_000n,
    description: "Ручная работа",
    isPopular: true,
    sizes: ["S", "M"],
    specs: [["Материал", "Керамика"]],
    stock: 10n,
    discount: 0n,
    oldPrice: 2990n,
    brand: "AURUM",
    rating: 4.8,
    isNew: true,
    colors: ["Белый", "Синий"],
    price: 2990n,
    reviewCount: 12n,
    images: ["/assets/images/placeholder.svg"],
    ...overrides,
  };
}

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 1n,
    icon: "🏺",
    name: "Декор",
    slug: "decor",
    ...overrides,
  };
}

export function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 1n,
    createdAt: 1_700_000_000_000_000_000n,
    text: "Отличный товар",
    productId: 1n,
    author: "Анна",
    rating: 5n,
    ...overrides,
  };
}

export function makeOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    name: "Керамическая ваза",
    color: "Белый",
    size: "M",
    productId: 1n,
    quantity: 2n,
    image: "/assets/images/placeholder.svg",
    price: 2990n,
    ...overrides,
  };
}

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 42n,
    status: OrderStatus.accepted,
    total: 6470n,
    city: "Москва",
    createdAt: 1_700_000_000_000_000_000n,
    user: { toString: () => "aaaaa-aa" } as unknown as Order["user"],
    deliveryCost: 490n,
    comment: "",
    address: "ул. Тверская, 1",
    discount: 0n,
    delivery: DeliveryMethod.courier,
    phone: "+7 900 000-00-00",
    items: [makeOrderItem()],
    lastName: "Иванова",
    subtotal: 5980n,
    firstName: "Анна",
    ...overrides,
  };
}

export function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    city: "Москва",
    name: "Анна Иванова",
    email: "anna@example.com",
    address: "ул. Тверская, 1",
    phone: "+7 900 000-00-00",
    ...overrides,
  };
}

/** Builds `count` products spread across `categoryCount` categories. */
export function makeCatalog(
  count: number,
  categoryCount: number,
): { products: Product[]; categories: Category[] } {
  const categories: Category[] = Array.from({ length: categoryCount }, (_, i) =>
    makeCategory({
      id: BigInt(i + 1),
      name: `Категория ${i + 1}`,
      slug: `cat-${i + 1}`,
      icon: "📦",
    }),
  );
  const products: Product[] = Array.from({ length: count }, (_, i) =>
    makeProduct({
      id: BigInt(i + 1),
      categoryId: BigInt((i % categoryCount) + 1),
      name: `Товар ${i + 1}`,
      brand: i % 2 === 0 ? "AURUM" : "NORD",
      price: BigInt(1000 + i * 100),
      oldPrice: BigInt(2000 + i * 100),
      rating: 3 + (i % 3),
      reviewCount: BigInt(i),
      isNew: i % 3 === 0,
      isPopular: i % 2 === 0,
      colors: i % 2 === 0 ? ["Белый", "Синий"] : ["Чёрный"],
      sizes: i % 2 === 0 ? ["S", "M"] : ["L"],
    }),
  );
  return { products, categories };
}
