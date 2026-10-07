import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeCatalog, makeOrder, makeProduct } from "./fixtures";
import { coreState, resetCoreState } from "./mock-core";
import { createMockActor, renderApp } from "./test-utils";

vi.mock("@caffeineai/core-infrastructure", async () => {
  const { coreState: state } = await import("./mock-core");
  return {
    useActor: () => ({ actor: state.actor, isFetching: state.isFetching }),
    useInternetIdentity: () => state.auth,
    InternetIdentityProvider: ({ children }: { children: React.ReactNode }) =>
      children,
    loadConfig: async () => ({}),
  };
});

/**
 * Rebuilds the app's singleton router with `path` as its initial location.
 * `App.tsx` creates the router at module load, so a fresh module registry is
 * the only way to exercise a deep link / reload.
 */
async function renderAt(path: string) {
  window.history.pushState({}, "", path);
  vi.resetModules();
  const { default: App } = await import("@/App");
  return renderApp(App);
}

function authenticate() {
  coreState.auth = {
    ...coreState.auth,
    isAuthenticated: true,
    identity: { getPrincipal: () => ({ toString: () => "aaaaa-aa" }) },
  };
}

const { products, categories } = makeCatalog(60, 10);

function actorForCatalog() {
  return createMockActor({
    listCategories: vi.fn().mockResolvedValue(categories),
    listBrands: vi.fn().mockResolvedValue(["AURUM", "NORD"]),
    listProducts: vi
      .fn()
      .mockImplementation(
        (_filter: unknown, _sort: unknown, page: bigint, pageSize: bigint) => {
          const start = Number(page - 1n) * Number(pageSize);
          const items = products.slice(start, start + Number(pageSize));
          return Promise.resolve({
            total: BigInt(products.length),
            page,
            pageSize,
            items,
          });
        },
      ),
  });
}

describe("catalog extended filters", () => {
  beforeEach(() => {
    resetCoreState();
    window.history.pushState({}, "", "/catalog");
  });

  it("persists the in-stock filter in the URL", async () => {
    const user = userEvent.setup();
    coreState.actor = actorForCatalog();

    await renderAt("/catalog");

    const toggle = await screen.findByTestId("catalog.in_stock_switch");
    await user.click(toggle);

    await waitFor(() => {
      expect(window.location.search).toContain("inStockOnly=true");
    });
  });

  it("reads an extended filter from the URL and passes it to the backend", async () => {
    const actor = actorForCatalog();
    coreState.actor = actor;

    await renderAt("/catalog?brand=AURUM&minRating=4");

    await waitFor(() => {
      const filtered = actor.listProducts.mock.calls.find(
        (call) =>
          (call[0] as { brand?: string }).brand === "AURUM" &&
          (call[0] as { minRating?: number }).minRating === 4,
      );
      expect(filtered).toBeDefined();
    });
  });

  it("resets every filter and clears the URL query", async () => {
    const user = userEvent.setup();
    coreState.actor = actorForCatalog();

    await renderAt("/catalog?brand=AURUM&minRating=4");

    const reset = await screen.findByTestId("catalog.reset_filters_button");
    await user.click(reset);

    await waitFor(() => {
      expect(window.location.search).not.toContain("brand=");
      expect(window.location.search).not.toContain("minRating=");
    });
  });
});

describe("product page selection", () => {
  beforeEach(() => {
    resetCoreState();
  });

  it("passes the chosen color, size and quantity to the cart", async () => {
    const user = userEvent.setup();
    const product = makeProduct({
      id: 5n,
      name: "Керамическая ваза",
      colors: ["Белый", "Синий"],
      sizes: ["S", "M"],
    });
    const actor = createMockActor({
      getProduct: vi.fn().mockResolvedValue(product),
      getSimilarProducts: vi.fn().mockResolvedValue([]),
      listReviews: vi.fn().mockResolvedValue([]),
      listFavorites: vi.fn().mockResolvedValue([]),
    });
    coreState.actor = actor;

    await renderAt("/product/5");

    await screen.findByText("Керамическая ваза");
    await user.click(screen.getByTestId("product.color.Синий"));
    await user.click(screen.getByTestId("product.size.M"));
    await user.click(screen.getByTestId("product.quantity_increase"));
    await user.click(screen.getByTestId("product.add_to_cart_button"));

    await waitFor(() => {
      expect(actor.addToCart).toHaveBeenCalledWith(5n, 2n, "Синий", "M");
    });
  });

  it("shows the specs and delivery tabs", async () => {
    const user = userEvent.setup();
    const product = makeProduct({
      id: 5n,
      name: "Керамическая ваза",
      specs: [["Материал", "Керамика"]],
    });
    coreState.actor = createMockActor({
      getProduct: vi.fn().mockResolvedValue(product),
      getSimilarProducts: vi.fn().mockResolvedValue([]),
      listReviews: vi.fn().mockResolvedValue([]),
      listFavorites: vi.fn().mockResolvedValue([]),
    });

    await renderAt("/product/5");

    await screen.findByText("Керамическая ваза");
    await user.click(screen.getByTestId("product.tab.specs"));
    expect(await screen.findByText("Керамика")).toBeInTheDocument();

    await user.click(screen.getByTestId("product.tab.delivery"));
    expect(await screen.findByText("Курьером до двери")).toBeInTheDocument();
  });
});

describe("cart page", () => {
  beforeEach(() => {
    resetCoreState();
  });

  it("recalculates the line total and order total from the cart", async () => {
    const product = makeProduct({
      id: 7n,
      name: "Керамическая ваза",
      price: 2990n,
      oldPrice: 2990n,
    });
    coreState.actor = createMockActor({
      getCart: vi
        .fn()
        .mockResolvedValue([
          { productId: 7n, quantity: 1n, color: "Белый", size: "M" },
        ]),
      listProducts: vi.fn().mockResolvedValue({
        total: 1n,
        page: 1n,
        pageSize: 200n,
        items: [product],
      }),
    });

    await renderAt("/cart");

    // 1 × 2990 = 2990 subtotal, below the 5000 free-delivery threshold → +490.
    expect(await screen.findByText("Керамическая ваза")).toBeInTheDocument();
    // The line total and the subtotal both read 2 990 ₽.
    expect(screen.getAllByText("2 990 ₽").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("3 480 ₽")).toBeInTheDocument();
  });
});

describe("admin dashboard", () => {
  beforeEach(() => {
    resetCoreState();
  });

  function adminActor(overrides: Record<string, unknown> = {}) {
    return createMockActor({
      getCallerUserRole: vi.fn().mockResolvedValue("admin"),
      getDashboardStats: vi.fn().mockResolvedValue({
        ordersByStatus: [["Принят", 2n]],
        salesByDay: [["2026-01-01", 10000n]],
        productCount: 60n,
        salesTotal: 10000n,
        orderCount: 2n,
        userCount: 3n,
        popularProducts: [],
      }),
      listProducts: vi.fn().mockResolvedValue({
        total: 1n,
        page: 1n,
        pageSize: 50n,
        items: [makeProduct({ id: 1n, name: "Керамическая ваза" })],
      }),
      listCategories: vi.fn().mockResolvedValue(categories),
      listAllOrders: vi.fn().mockResolvedValue([makeOrder({ id: 42n })]),
      listUsers: vi.fn().mockResolvedValue([]),
      ...overrides,
    });
  }

  it("renders dashboard stats and the product table for an admin", async () => {
    authenticate();
    coreState.actor = adminActor();

    await renderAt("/admin");

    expect(await screen.findByTestId("admin.page")).toBeInTheDocument();
    expect(screen.getByText("Админ-панель")).toBeInTheDocument();
    expect(await screen.findByText("Керамическая ваза")).toBeInTheDocument();
  });

  it("creates a product through the admin form", async () => {
    const user = userEvent.setup();
    authenticate();
    const actor = adminActor({
      createProduct: vi.fn().mockResolvedValue(makeProduct({ id: 99n })),
    });
    coreState.actor = actor;

    await renderAt("/admin");

    await user.type(
      await screen.findByTestId("admin.product_name_input"),
      "Новая лампа",
    );
    await user.type(screen.getByTestId("admin.product_price_input"), "2990");
    await user.type(screen.getByTestId("admin.product_stock_input"), "5");

    // Pick the first category from the Radix select.
    await user.click(screen.getByTestId("admin.product_category_select"));
    const option = await screen.findByRole("option", { name: "Категория 1" });
    await user.click(option);

    await user.click(screen.getByTestId("admin.create_product_button"));

    await waitFor(() => {
      expect(actor.createProduct).toHaveBeenCalledTimes(1);
    });
    const input = actor.createProduct.mock.calls[0][0] as {
      name: string;
      price: bigint;
      categoryId: bigint;
    };
    expect(input.name).toBe("Новая лампа");
    expect(input.price).toBe(2990n);
    expect(input.categoryId).toBe(1n);
  });

  it("updates an order status from the orders tab", async () => {
    const user = userEvent.setup();
    authenticate();
    const actor = adminActor({
      updateOrderStatus: vi.fn().mockResolvedValue(makeOrder({ id: 42n })),
    });
    coreState.actor = actor;

    await renderAt("/admin");

    await user.click(await screen.findByTestId("admin.tab.orders"));
    const select = await screen.findByTestId("admin.order_status_select.1");
    await user.click(select);
    const option = await screen.findByRole("option", { name: "Отправлен" });
    await user.click(option);

    await waitFor(() => {
      expect(actor.updateOrderStatus).toHaveBeenCalledWith(42n, "shipped");
    });
  });
});
