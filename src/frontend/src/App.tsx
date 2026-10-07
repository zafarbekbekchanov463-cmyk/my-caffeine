import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { AccountPage } from "@/pages/Account";
import { AdminPage } from "@/pages/Admin";
import { CartPage } from "@/pages/Cart";
import { CatalogPage } from "@/pages/Catalog";
import { CheckoutPage } from "@/pages/Checkout";
import { FavoritesPage } from "@/pages/Favorites";
import { HomePage } from "@/pages/Home";
import { LoginPage } from "@/pages/Login";
import { NotFoundPage } from "@/pages/NotFound";
import { OrderDetailPage } from "@/pages/OrderDetail";
import { OrdersPage } from "@/pages/Orders";
import { ProductPage } from "@/pages/Product";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
  notFoundComponent: NotFoundPage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

type CatalogSearch = {
  q?: string;
  category?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  brand?: string;
  minRating?: number;
  color?: string;
  size?: string;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  brands?: boolean;
};

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/catalog",
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    q: typeof search.q === "string" ? search.q : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
    sort: typeof search.sort === "string" ? search.sort : undefined,
    minPrice: typeof search.minPrice === "string" ? search.minPrice : undefined,
    maxPrice: typeof search.maxPrice === "string" ? search.maxPrice : undefined,
    brand: typeof search.brand === "string" ? search.brand : undefined,
    minRating:
      typeof search.minRating === "number" ? search.minRating : undefined,
    color: typeof search.color === "string" ? search.color : undefined,
    size: typeof search.size === "string" ? search.size : undefined,
    inStockOnly:
      typeof search.inStockOnly === "boolean" ? search.inStockOnly : undefined,
    onSaleOnly:
      typeof search.onSaleOnly === "boolean" ? search.onSaleOnly : undefined,
    brands: typeof search.brands === "boolean" ? search.brands : undefined,
  }),
  component: CatalogPage,
});

const productRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/product/$productId",
  component: ProductPage,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: CartPage,
});

const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/favorites",
  component: FavoritesPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: CheckoutPage,
});

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/account",
  component: AccountPage,
});

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: OrdersPage,
});

const orderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders/$orderId",
  component: OrderDetailPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  catalogRoute,
  productRoute,
  cartRoute,
  favoritesRoute,
  checkoutRoute,
  accountRoute,
  ordersRoute,
  orderDetailRoute,
  loginRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  );
}
