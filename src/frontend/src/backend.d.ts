import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CartItem {
    color: string;
    size: string;
    productId: ProductId;
    quantity: bigint;
}
export interface Category {
    id: CategoryId;
    icon: string;
    name: string;
    slug: string;
}
export type CategoryId = bigint;
export interface CategoryInput {
    icon: string;
    name: string;
    slug: string;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface CheckoutInput {
    city: string;
    comment: string;
    address: string;
    delivery: DeliveryMethod;
    phone: string;
    lastName: string;
    firstName: string;
}
export interface DashboardStats {
    ordersByStatus: Array<[string, bigint]>;
    salesByDay: Array<[string, bigint]>;
    productCount: bigint;
    salesTotal: bigint;
    orderCount: bigint;
    userCount: bigint;
    popularProducts: Array<Product>;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Order {
    id: OrderId;
    status: OrderStatus;
    total: bigint;
    city: string;
    createdAt: Timestamp;
    user: Principal;
    deliveryCost: bigint;
    comment: string;
    address: string;
    discount: bigint;
    delivery: DeliveryMethod;
    phone: string;
    items: Array<OrderItem>;
    lastName: string;
    subtotal: bigint;
    firstName: string;
}
export type OrderId = bigint;
export interface OrderItem {
    name: string;
    color: string;
    size: string;
    productId: ProductId;
    quantity: bigint;
    image: string;
    price: bigint;
}
export interface Product {
    id: ProductId;
    categoryId: CategoryId;
    inStock: boolean;
    name: string;
    createdAt: Timestamp;
    description: string;
    isPopular: boolean;
    sizes: Array<string>;
    specs: Array<[string, string]>;
    stock: bigint;
    discount: bigint;
    oldPrice: bigint;
    brand: string;
    rating: number;
    isNew: boolean;
    colors: Array<string>;
    price: bigint;
    reviewCount: bigint;
    images: Array<string>;
}
export interface ProductFilter {
    categoryId?: CategoryId;
    minRating?: number;
    inStockOnly: boolean;
    color?: string;
    size?: string;
    search?: string;
    maxPrice?: bigint;
    brand?: string;
    minPrice?: bigint;
    onSaleOnly: boolean;
}
export type ProductId = bigint;
export interface ProductInput {
    categoryId: CategoryId;
    inStock: boolean;
    name: string;
    description: string;
    isPopular: boolean;
    sizes: Array<string>;
    specs: Array<[string, string]>;
    stock: bigint;
    discount: bigint;
    oldPrice: bigint;
    brand: string;
    isNew: boolean;
    colors: Array<string>;
    price: bigint;
    images: Array<string>;
}
export interface ProductPage {
    total: bigint;
    page: bigint;
    pageSize: bigint;
    items: Array<Product>;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Review {
    id: ReviewId;
    createdAt: Timestamp;
    text: string;
    productId: ProductId;
    author: string;
    rating: bigint;
}
export type ReviewId = bigint;
export type Timestamp = bigint;
export interface UserProfile {
    city: string;
    name: string;
    email: string;
    address: string;
    phone: string;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum DeliveryMethod {
    selfPickup = "selfPickup",
    courier = "courier",
    pickupPoint = "pickupPoint"
}
export enum OrderStatus {
    assembling = "assembling",
    shipped = "shipped",
    delivered = "delivered",
    accepted = "accepted"
}
export enum ProductSort {
    popular = "popular",
    newest = "newest",
    discount = "discount",
    priceDesc = "priceDesc",
    rating = "rating",
    priceAsc = "priceAsc"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addFavorite(productId: bigint): Promise<void>;
    addToCart(productId: bigint, quantity: bigint, color: string, size: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkout(input: CheckoutInput): Promise<Order>;
    clearCart(): Promise<void>;
    createCategory(input: CategoryInput): Promise<Category>;
    createProduct(input: ProductInput): Promise<Product>;
    deleteCategory(id: bigint): Promise<boolean>;
    deleteProduct(id: bigint): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Returns the backend API documentation as static Markdown.
     */
    getApiDoc(): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(): Promise<Array<CartItem>>;
    getDashboardStats(): Promise<DashboardStats>;
    getDiscountedProducts(limit: bigint): Promise<Array<Product>>;
    getNewProducts(limit: bigint): Promise<Array<Product>>;
    getOrder(id: bigint): Promise<Order | null>;
    getPopularProducts(limit: bigint): Promise<Array<Product>>;
    getProduct(id: bigint): Promise<Product | null>;
    getSimilarProducts(id: bigint, limit: bigint): Promise<Array<Product>>;
    getTopProducts(limit: bigint): Promise<Array<Product>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listAllOrders(): Promise<Array<Order>>;
    listBrands(): Promise<Array<string>>;
    listCategories(): Promise<Array<Category>>;
    listFavorites(): Promise<Array<Product>>;
    listOrders(): Promise<Array<Order>>;
    listProducts(filter: ProductFilter, sort: ProductSort, page: bigint, pageSize: bigint): Promise<ProductPage>;
    listReviews(productId: bigint): Promise<Array<Review>>;
    listUsers(): Promise<Array<[Principal, UserProfile]>>;
    removeFavorite(productId: bigint): Promise<void>;
    removeFromCart(productId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    schema(): Promise<string>;
    updateCartItem(productId: bigint, quantity: bigint): Promise<void>;
    updateCategory(id: bigint, input: CategoryInput): Promise<Category | null>;
    updateOrderStatus(id: bigint, status: OrderStatus): Promise<Order | null>;
    updateProduct(id: bigint, input: ProductInput): Promise<Product | null>;
}
