// Test-only: brings the jest-dom matcher augmentation into the TypeScript
// program so `toBeInTheDocument` / `toHaveTextContent` typecheck in tests.
// `vitest.setup.ts` imports the same module at runtime.
import "@testing-library/jest-dom/vitest";
import type { backendInterface } from "@/backend";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

/**
 * A typed stand-in for the generated `Backend` actor. Every public method is a
 * `vi.fn()` so tests can assert the exact calls the UI makes. Defaults return
 * empty collections so a component that only reads renders an empty state.
 */
export type MockActor = {
  [K in keyof backendInterface]: ReturnType<typeof vi.fn>;
};

export function createMockActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
): MockActor {
  const actor = {
    _initialize_access_control: vi.fn().mockResolvedValue(undefined),
    _internet_identity_sign_in_finish: vi
      .fn()
      .mockResolvedValue({ __kind__: "ok", ok: null }),
    _internet_identity_sign_in_start: vi
      .fn()
      .mockResolvedValue(new Uint8Array()),
    addFavorite: vi.fn().mockResolvedValue(undefined),
    addToCart: vi.fn().mockResolvedValue(undefined),
    assignCallerUserRole: vi.fn().mockResolvedValue(undefined),
    checkout: vi.fn(),
    clearCart: vi.fn().mockResolvedValue(undefined),
    createCategory: vi.fn(),
    createProduct: vi.fn(),
    deleteCategory: vi.fn().mockResolvedValue(true),
    deleteProduct: vi.fn().mockResolvedValue(true),
    execute: vi.fn().mockResolvedValue({ hasMore: false, rows: [] }),
    getApiDoc: vi.fn().mockResolvedValue(""),
    getCallerUserProfile: vi.fn().mockResolvedValue(null),
    getCallerUserRole: vi.fn().mockResolvedValue("guest"),
    getCart: vi.fn().mockResolvedValue([]),
    getDashboardStats: vi.fn(),
    getDiscountedProducts: vi.fn().mockResolvedValue([]),
    getNewProducts: vi.fn().mockResolvedValue([]),
    getOrder: vi.fn().mockResolvedValue(null),
    getPopularProducts: vi.fn().mockResolvedValue([]),
    getProduct: vi.fn().mockResolvedValue(null),
    getSimilarProducts: vi.fn().mockResolvedValue([]),
    getTopProducts: vi.fn().mockResolvedValue([]),
    getUserProfile: vi.fn().mockResolvedValue(null),
    isCallerAdmin: vi.fn().mockResolvedValue(false),
    listAllOrders: vi.fn().mockResolvedValue([]),
    listBrands: vi.fn().mockResolvedValue([]),
    listCategories: vi.fn().mockResolvedValue([]),
    listFavorites: vi.fn().mockResolvedValue([]),
    listOrders: vi.fn().mockResolvedValue([]),
    listProducts: vi.fn().mockResolvedValue({
      total: 0n,
      page: 1n,
      pageSize: 12n,
      items: [],
    }),
    listReviews: vi.fn().mockResolvedValue([]),
    listUsers: vi.fn().mockResolvedValue([]),
    removeFavorite: vi.fn().mockResolvedValue(undefined),
    removeFromCart: vi.fn().mockResolvedValue(undefined),
    saveCallerUserProfile: vi.fn().mockResolvedValue(undefined),
    schema: vi.fn().mockResolvedValue(""),
    updateCartItem: vi.fn().mockResolvedValue(undefined),
    updateCategory: vi.fn().mockResolvedValue(null),
    updateOrderStatus: vi.fn().mockResolvedValue(null),
    updateProduct: vi.fn().mockResolvedValue(null),
    ...overrides,
  } as unknown as MockActor;
  return actor;
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

export function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

export function renderWithQueryClient(
  ui: ReactElement,
  queryClient: QueryClient = createTestQueryClient(),
  options?: Omit<RenderOptions, "wrapper">,
) {
  return {
    queryClient,
    ...render(ui, { wrapper: createWrapper(queryClient), ...options }),
  };
}

/**
 * Renders the real `App` (which owns the router and ThemeProvider) inside a
 * fresh QueryClient, mirroring how `main.tsx` composes the providers.
 */
export function renderApp(
  App: () => ReactElement,
  queryClient: QueryClient = createTestQueryClient(),
) {
  return {
    queryClient,
    ...render(<App />, { wrapper: createWrapper(queryClient) }),
  };
}
