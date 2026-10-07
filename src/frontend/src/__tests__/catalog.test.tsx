import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeCatalog } from "./fixtures";
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

import { ProductSort } from "@/backend";

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

/**
 * Rebuilds the app's singleton router with `path` as its initial location.
 * `App.tsx` creates the router at module load, so a fresh module registry is
 * the only way to exercise a deep link / reload.
 */
async function renderCatalogAt(path: string) {
  window.history.pushState({}, "", path);
  vi.resetModules();
  const { default: App } = await import("@/App");
  return renderApp(App);
}

describe("CatalogPage", () => {
  beforeEach(() => {
    resetCoreState();
    window.history.pushState({}, "", "/catalog");
  });

  it("renders products from the backend and reports the total count", async () => {
    coreState.actor = actorForCatalog();

    await renderCatalogAt("/catalog");

    expect(await screen.findByText("Товар 1")).toBeInTheDocument();
    expect(screen.getByText("Товар 12")).toBeInTheDocument();
    // 60 products total, page size 12.
    expect(screen.getByTestId("catalog.results_count")).toHaveTextContent("60");
  });

  it("shows every category as a filter chip", async () => {
    coreState.actor = actorForCatalog();

    await renderCatalogAt("/catalog");

    await waitFor(() => {
      expect(screen.getByTestId("catalog.category.cat-1")).toBeInTheDocument();
    });
    expect(screen.getByTestId("catalog.category.cat-10")).toBeInTheDocument();
  });

  it("commits a search query and persists it in the URL", async () => {
    const user = userEvent.setup();
    coreState.actor = actorForCatalog();

    await renderCatalogAt("/catalog");

    const input = await screen.findByTestId("catalog.search_input");
    await user.type(input, "лампа{Enter}");

    await waitFor(() => {
      expect(window.location.search).toContain(
        "q=%D0%BB%D0%B0%D0%BC%D0%BF%D0%B0",
      );
    });
  });

  it("applies a sort selection and persists it in the URL", async () => {
    const user = userEvent.setup();
    coreState.actor = actorForCatalog();

    await renderCatalogAt("/catalog");

    const sortTrigger = await screen.findByTestId("catalog.sort_select");
    await user.click(sortTrigger);
    const option = await screen.findByRole("option", {
      name: "Сначала дешёвые",
    });
    await user.click(option);

    await waitFor(() => {
      expect(window.location.search).toContain(`sort=${ProductSort.priceAsc}`);
    });
  });

  it("reads filters from the URL on load and passes them to the backend", async () => {
    const actor = actorForCatalog();
    coreState.actor = actor;

    await renderCatalogAt("/catalog?category=cat-3&sort=priceAsc");

    // Wait for categories to resolve so the slug can map to its id.
    await screen.findByTestId("catalog.category.cat-3");
    await waitFor(() => {
      const filteredCall = actor.listProducts.mock.calls
        .filter((call) => call[1] === ProductSort.priceAsc)
        .at(-1);
      expect(filteredCall?.[0]).toMatchObject({ categoryId: 3n });
    });
  });

  it("shows an empty state when no products match", async () => {
    const actor = createMockActor({
      listCategories: vi.fn().mockResolvedValue(categories),
      listBrands: vi.fn().mockResolvedValue([]),
      listProducts: vi.fn().mockResolvedValue({
        total: 0n,
        page: 1n,
        pageSize: 12n,
        items: [],
      }),
    });
    coreState.actor = actor;

    await renderCatalogAt("/catalog");

    expect(await screen.findByText("Ничего не найдено")).toBeInTheDocument();
  });
});
