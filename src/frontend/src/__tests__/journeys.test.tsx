import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeCatalog, makeProduct } from "./fixtures";
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

describe("header counters", () => {
  beforeEach(() => {
    resetCoreState();
    window.history.pushState({}, "", "/");
  });

  it("shows the cart and favorites counts from the backend", async () => {
    const product = makeProduct({ id: 7n });
    coreState.actor = createMockActor({
      getCart: vi
        .fn()
        .mockResolvedValue([
          { productId: 7n, quantity: 2n, color: "Белый", size: "M" },
        ]),
      listFavorites: vi.fn().mockResolvedValue([product]),
    });

    renderApp((await import("@/App")).default);

    await waitFor(() => {
      expect(screen.getByTestId("header.cart_link")).toHaveTextContent("2");
    });
    expect(screen.getByTestId("header.favorites_link")).toHaveTextContent("1");
  });
});

describe("mobile bottom navigation", () => {
  beforeEach(() => {
    resetCoreState();
    window.history.pushState({}, "", "/");
  });

  it("renders the five accepted destinations", async () => {
    coreState.actor = createMockActor({});
    renderApp((await import("@/App")).default);

    const nav = await screen.findByRole("navigation", {
      name: "Основная навигация",
    });
    for (const label of [
      "Главная",
      "Каталог",
      "Корзина",
      "Избранное",
      "Профиль",
    ]) {
      expect(nav).toHaveTextContent(label);
    }
  });
});

describe("theme toggle", () => {
  beforeEach(() => {
    resetCoreState();
    window.history.pushState({}, "", "/");
    document.documentElement.classList.remove("dark");
  });

  it("switches the document to the dark theme", async () => {
    const user = userEvent.setup();
    coreState.actor = createMockActor({});
    renderApp((await import("@/App")).default);

    const toggle = await screen.findByTestId("theme.toggle");
    await user.click(toggle);

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });
});

describe("product page", () => {
  beforeEach(() => {
    resetCoreState();
  });

  it("adds the selected product to the cart", async () => {
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

    expect(await screen.findByText("Керамическая ваза")).toBeInTheDocument();
    await user.click(screen.getByTestId("product.add_to_cart_button"));

    await waitFor(() => {
      expect(actor.addToCart).toHaveBeenCalledWith(5n, 1n, "Белый", "S");
    });
  });
});

describe("checkout journey", () => {
  beforeEach(() => {
    resetCoreState();
  });

  it("places an order and shows the success screen with the order number", async () => {
    const user = userEvent.setup();
    authenticate();
    const { products } = makeCatalog(3, 1);
    const actor = createMockActor({
      getCart: vi
        .fn()
        .mockResolvedValue([
          { productId: 1n, quantity: 1n, color: "Белый", size: "S" },
        ]),
      listProducts: vi.fn().mockResolvedValue({
        total: 3n,
        page: 1n,
        pageSize: 200n,
        items: products,
      }),
      // Built inline: `vi.resetModules()` in `renderAt` invalidates the module
      // instance the shared `makeOrder` fixture closed over.
      checkout: vi.fn().mockResolvedValue({ id: 42n }),
    });
    coreState.actor = actor;

    await renderAt("/checkout");

    await user.type(
      await screen.findByTestId("checkout.first_name_input"),
      "Анна",
    );
    await user.type(screen.getByTestId("checkout.last_name_input"), "Иванова");
    await user.type(screen.getByTestId("checkout.phone_input"), "+79000000000");
    await user.type(screen.getByTestId("checkout.city_input"), "Москва");
    await user.type(
      screen.getByTestId("checkout.address_input"),
      "ул. Тверская, 1",
    );
    await user.click(screen.getByTestId("checkout.submit_button"));

    expect(
      await screen.findByText("Заказ успешно оформлен"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("checkout.order_number")).toHaveTextContent(
      "№00042",
    );
    expect(actor.checkout).toHaveBeenCalledTimes(1);
  });

  it("blocks submission and reports validation errors when fields are empty", async () => {
    const user = userEvent.setup();
    authenticate();
    const { products } = makeCatalog(3, 1);
    const actor = createMockActor({
      getCart: vi
        .fn()
        .mockResolvedValue([
          { productId: 1n, quantity: 1n, color: "Белый", size: "S" },
        ]),
      listProducts: vi.fn().mockResolvedValue({
        total: 3n,
        page: 1n,
        pageSize: 200n,
        items: products,
      }),
    });
    coreState.actor = actor;

    await renderAt("/checkout");

    await user.click(await screen.findByTestId("checkout.submit_button"));

    expect(
      await screen.findByTestId("checkout.first_name_error"),
    ).toBeInTheDocument();
    expect(actor.checkout).not.toHaveBeenCalled();
  });
});

describe("protected routes", () => {
  beforeEach(() => {
    resetCoreState();
  });

  it("redirects an unauthenticated visitor from the account page to login", async () => {
    coreState.actor = createMockActor({});

    await renderAt("/account");

    await waitFor(() => {
      expect(window.location.pathname).toBe("/login");
    });
    expect(
      await screen.findByText("Войдите в аккаунт AURUM"),
    ).toBeInTheDocument();
  });

  it("shows the access-denied screen to a non-admin on the admin page", async () => {
    authenticate();
    coreState.actor = createMockActor({
      getCallerUserRole: vi.fn().mockResolvedValue("user"),
      getDashboardStats: vi.fn().mockResolvedValue({
        ordersByStatus: [],
        salesByDay: [],
        productCount: 0n,
        salesTotal: 0n,
        orderCount: 0n,
        userCount: 0n,
        popularProducts: [],
      }),
    });

    await renderAt("/admin");

    expect(await screen.findByText("Доступ ограничен")).toBeInTheDocument();
  });
});
