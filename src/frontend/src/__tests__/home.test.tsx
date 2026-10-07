import { screen, waitFor } from "@testing-library/react";
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

import App from "@/App";

describe("HomePage", () => {
  beforeEach(() => {
    resetCoreState();
    window.history.pushState({}, "", "/");
  });

  it("renders the hero banner and does not show a blank screen", async () => {
    const { products, categories } = makeCatalog(60, 10);
    const actor = createMockActor({
      listCategories: vi.fn().mockResolvedValue(categories),
      getNewProducts: vi.fn().mockResolvedValue(products.slice(0, 8)),
      getDiscountedProducts: vi.fn().mockResolvedValue(products.slice(0, 8)),
      getPopularProducts: vi.fn().mockResolvedValue(products.slice(0, 8)),
      getTopProducts: vi.fn().mockResolvedValue(products.slice(0, 8)),
    });
    coreState.actor = actor;

    renderApp(App);

    expect(
      await screen.findByText("Новые товары уже здесь"),
    ).toBeInTheDocument();
    expect(screen.getByText("Выберите своё")).toBeInTheDocument();
    expect(screen.getByText("Что говорят покупатели")).toBeInTheDocument();
    expect(screen.getByText("Как это работает")).toBeInTheDocument();
  });

  it("renders every category returned by the backend", async () => {
    const { categories } = makeCatalog(60, 10);
    const actor = createMockActor({
      listCategories: vi.fn().mockResolvedValue(categories),
    });
    coreState.actor = actor;

    renderApp(App);

    await waitFor(() => {
      expect(screen.getByText("Категория 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Категория 10")).toBeInTheDocument();
  });
});
