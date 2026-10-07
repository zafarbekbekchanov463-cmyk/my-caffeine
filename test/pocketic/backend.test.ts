import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

// Deterministic callers. `createIdentity` is the only hand-free way to name a
// caller from the lane: the client re-exports no `Principal`.
const admin = createIdentity("aurum-admin");
const shopper = createIdentity("aurum-shopper");

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

/**
 * The declarations type every `ProductFilter` field as required, with optionals
 * as `[] | [T]`, so a partial object fails Candid encoding. Build the full shape.
 */
function emptyFilter(): Parameters<_SERVICE["listProducts"]>[0] {
  return {
    categoryId: [],
    minRating: [],
    inStockOnly: false,
    color: [],
    size: [],
    search: [],
    maxPrice: [],
    brand: [],
    minPrice: [],
    onSaleOnly: false,
  };
}

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  // Install as the admin identity so the access-control bootstrap can grant it
  // the admin role; the app's own `_initialize_access_control` is what does so.
  ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
    sender: admin.getPrincipal(),
  }));
  actor.setIdentity(admin);
  await actor._initialize_access_control();
});

afterAll(async () => {
  await pic?.tearDown();
});

it("seeds the demo catalog on first install", async () => {
  const categories = await actor.listCategories();
  expect(categories).toHaveLength(10);
  expect(categories.map((category) => category.slug)).toContain("electronics");

  const page = await actor.listProducts(
    emptyFilter(),
    { popular: null },
    1n,
    100n,
  );
  expect(page.total).toBeGreaterThanOrEqual(50n);
  expect(page.items.length).toBeGreaterThan(0);
});

it("answers caller-scoped empty-state reads instead of trapping", async () => {
  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  guest.setIdentity(shopper);

  await expect(guest.getCart()).resolves.toEqual([]);
  await expect(guest.listFavorites()).resolves.toEqual([]);
  await expect(guest.listOrders()).resolves.toEqual([]);
  await expect(guest.getCallerUserProfile()).resolves.toEqual([]);
});

it("grants the bootstrap caller the admin role", async () => {
  await expect(actor.isCallerAdmin()).resolves.toBe(true);
  await expect(actor.getCallerUserRole()).resolves.toEqual({ admin: null });
});

it("round-trips a category and a product through the real canister", async () => {
  const category = await actor.createCategory({
    name: "Декор",
    slug: "decor",
    icon: "🏺",
  });
  expect(category.name).toBe("Декор");

  const product = await actor.createProduct({
    categoryId: category.id,
    inStock: true,
    name: "Настольная лампа",
    description: "Тёплый свет",
    isPopular: true,
    sizes: [],
    specs: [],
    stock: 5n,
    discount: 0n,
    oldPrice: 3990n,
    brand: "AURUM",
    isNew: true,
    colors: ["Белый"],
    price: 2990n,
    images: ["/assets/images/placeholder.svg"],
  });
  expect(product.name).toBe("Настольная лампа");

  const fetched = await actor.getProduct(product.id);
  expect(fetched).toContainEqual(
    expect.objectContaining({ name: "Настольная лампа" }),
  );
});

it("adds to cart and checks out into an order for the calling shopper", async () => {
  const page = await actor.listProducts(
    { ...emptyFilter(), inStockOnly: true },
    { popular: null },
    1n,
    1n,
  );
  const product = page.items[0];
  expect(product).toBeDefined();

  const shopperActor = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  shopperActor.setIdentity(shopper);

  await shopperActor.addToCart(product.id, 2n, "Чёрный", "");
  const cart = await shopperActor.getCart();
  expect(cart).toContainEqual(
    expect.objectContaining({ productId: product.id, quantity: 2n }),
  );

  const order = await shopperActor.checkout({
    firstName: "Анна",
    lastName: "Иванова",
    phone: "+7 900 000-00-00",
    city: "Москва",
    address: "ул. Тверская, 1",
    comment: "",
    delivery: { courier: null },
  });
  expect(order.id).toBeGreaterThan(0n);
  expect(order.items.length).toBeGreaterThanOrEqual(1);

  const orders = await shopperActor.listOrders();
  expect(orders).toContainEqual(expect.objectContaining({ id: order.id }));

  const fetched = await shopperActor.getOrder(order.id);
  expect(fetched).toContainEqual(expect.objectContaining({ id: order.id }));
});

it("updates an order status through the accepted lifecycle", async () => {
  const orders = await actor.listAllOrders();
  expect(orders.length).toBeGreaterThan(0);
  const target = orders[0];

  const updated = await actor.updateOrderStatus(target.id, { shipped: null });
  expect(updated).toContainEqual(
    expect.objectContaining({ id: target.id, status: { shipped: null } }),
  );
});

it("toggles favorites and reads the dashboard stats", async () => {
  const page = await actor.listProducts(
    { ...emptyFilter(), inStockOnly: true },
    { popular: null },
    1n,
    1n,
  );
  const product = page.items[0];

  const shopperActor = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  shopperActor.setIdentity(shopper);

  await shopperActor.addFavorite(product.id);
  const favorites = await shopperActor.listFavorites();
  expect(favorites).toContainEqual(expect.objectContaining({ id: product.id }));

  await shopperActor.removeFavorite(product.id);
  await expect(shopperActor.listFavorites()).resolves.toEqual([]);

  const stats = await actor.getDashboardStats();
  expect(stats.productCount).toBeGreaterThanOrEqual(50n);
});

it("rejects admin mutations from a non-admin caller", async () => {
  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  guest.setIdentity(shopper);

  await expect(
    guest.createCategory({ name: "X", slug: "x", icon: "📦" }),
  ).rejects.toThrow(/not registered|Unauthorized/);
  await expect(guest.listAllOrders()).rejects.toThrow(
    /not registered|Unauthorized/,
  );
});

it("serves the catalog read helpers without trapping", async () => {
  const page = await actor.listProducts(
    { ...emptyFilter(), inStockOnly: true },
    { popular: null },
    1n,
    1n,
  );
  const product = page.items[0];
  expect(product).toBeDefined();

  await expect(actor.listBrands()).resolves.toContain("Aurora");
  await expect(actor.getPopularProducts(4n)).resolves.toBeInstanceOf(Array);
  await expect(actor.getNewProducts(4n)).resolves.toBeInstanceOf(Array);
  await expect(actor.getDiscountedProducts(4n)).resolves.toBeInstanceOf(Array);
  await expect(actor.getTopProducts(4n)).resolves.toBeInstanceOf(Array);
  await expect(actor.getSimilarProducts(product.id, 4n)).resolves.toBeInstanceOf(
    Array,
  );
  await expect(actor.listReviews(product.id)).resolves.toBeInstanceOf(Array);
});

it("returns the API documentation and schema as text", async () => {
  const doc = await actor.getApiDoc();
  expect(doc).toContain("Backend API");
  await expect(actor.schema()).resolves.toBeTypeOf("string");
});

it("updates and deletes a product through the real canister", async () => {
  const category = await actor.createCategory({
    name: "Обновления",
    slug: "updates",
    icon: "🔄",
  });
  const product = await actor.createProduct({
    categoryId: category.id,
    inStock: true,
    name: "Товар до обновления",
    description: "Описание",
    isPopular: false,
    sizes: [],
    specs: [],
    stock: 3n,
    discount: 0n,
    oldPrice: 1000n,
    brand: "AURUM",
    isNew: false,
    colors: [],
    price: 1000n,
    images: [],
  });

  const updated = await actor.updateProduct(product.id, {
    categoryId: category.id,
    inStock: true,
    name: "Товар после обновления",
    description: "Новое описание",
    isPopular: true,
    sizes: [],
    specs: [],
    stock: 7n,
    discount: 10n,
    oldPrice: 1200n,
    brand: "AURUM",
    isNew: true,
    colors: [],
    price: 1080n,
    images: [],
  });
  expect(updated).toContainEqual(
    expect.objectContaining({ name: "Товар после обновления", stock: 7n }),
  );

  await expect(actor.deleteProduct(product.id)).resolves.toBe(true);
  await expect(actor.getProduct(product.id)).resolves.toEqual([]);
});

it("updates and deletes a category through the real canister", async () => {
  const category = await actor.createCategory({
    name: "Временная",
    slug: "temp",
    icon: "🧪",
  });

  const updated = await actor.updateCategory(category.id, {
    name: "Переименованная",
    slug: "renamed",
    icon: "✅",
  });
  expect(updated).toContainEqual(
    expect.objectContaining({ name: "Переименованная", slug: "renamed" }),
  );

  await expect(actor.deleteCategory(category.id)).resolves.toBe(true);
  await expect(actor.deleteCategory(category.id)).resolves.toBe(false);
});

it("saves and reads back the caller profile", async () => {
  const shopperActor = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  shopperActor.setIdentity(shopper);

  await shopperActor.saveCallerUserProfile({
    name: "Анна Иванова",
    email: "anna@example.com",
    phone: "+7 900 000-00-00",
    city: "Москва",
    address: "ул. Тверская, 1",
  });

  const profile = await shopperActor.getCallerUserProfile();
  expect(profile).toContainEqual(
    expect.objectContaining({ name: "Анна Иванова", city: "Москва" }),
  );

  const users = await actor.listUsers();
  expect(users.some(([, p]) => p.name === "Анна Иванова")).toBe(true);
});

it("keeps one caller's order and profile private from another", async () => {
  const alice = createIdentity("aurum-alice");
  const bob = createIdentity("aurum-bob");

  const aliceActor = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  aliceActor.setIdentity(alice);
  const bobActor = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  bobActor.setIdentity(bob);

  const page = await aliceActor.listProducts(
    { ...emptyFilter(), inStockOnly: true },
    { popular: null },
    1n,
    1n,
  );
  const product = page.items[0];
  await aliceActor.addToCart(product.id, 1n, "", "");
  const order = await aliceActor.checkout({
    firstName: "Алиса",
    lastName: "П",
    phone: "+7 900 000-00-00",
    city: "Москва",
    address: "ул. Тверская, 1",
    comment: "",
    delivery: { courier: null },
  });

  // Bob cannot read Alice's order, and sees no orders of his own.
  await expect(bobActor.getOrder(order.id)).resolves.toEqual([]);
  await expect(bobActor.listOrders()).resolves.toEqual([]);

  await aliceActor.saveCallerUserProfile({
    name: "Алиса",
    email: "alice@example.com",
    phone: "",
    city: "Москва",
    address: "",
  });
  await expect(bobActor.getUserProfile(alice.getPrincipal())).rejects.toThrow(
    /Unauthorized|not registered/,
  );
});
