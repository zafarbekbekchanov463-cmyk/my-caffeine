import type {
  CartItem,
  Category,
  DeliveryMethod,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductFilter,
  ProductPage,
  ProductSort,
  Review,
  UserProfile,
} from "@/backend";

export type {
  CartItem,
  Category,
  DeliveryMethod,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductFilter,
  ProductPage,
  ProductSort,
  Review,
  UserProfile,
};

export type {
  ProductId,
  CategoryId,
  OrderId,
  ReviewId,
  Timestamp,
} from "@/backend";

export interface CartLine {
  product: Product;
  quantity: number;
  color: string;
  size: string;
}

export interface CartSummary {
  lines: CartLine[];
  subtotal: number;
  discount: number;
  deliveryCost: number;
  total: number;
  itemCount: number;
}

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  courier: "Курьером",
  pickupPoint: "В пункт выдачи",
  selfPickup: "Самовывоз",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  accepted: "Принят",
  assembling: "Собирается",
  shipped: "Отправлен",
  delivered: "Доставлен",
};

export const SORT_LABELS: Record<ProductSort, string> = {
  popular: "Популярные",
  newest: "Новинки",
  rating: "По рейтингу",
  priceAsc: "Сначала дешёвые",
  priceDesc: "Сначала дорогие",
  discount: "По скидке",
};

export const DELIVERY_COST = 490;
export const FREE_DELIVERY_FROM = 5000;

/**
 * Mirrors the backend `deliveryCostOf` in lib/store.mo so the cost shown at
 * checkout always matches the persisted order total.
 */
export function deliveryCostFor(
  method: DeliveryMethod,
  subtotal: number,
): number {
  switch (method) {
    case "courier":
      return subtotal >= 5000 ? 0 : 490;
    case "pickupPoint":
      return subtotal >= 3000 ? 0 : 290;
    case "selfPickup":
      return 0;
    default:
      return 0;
  }
}
