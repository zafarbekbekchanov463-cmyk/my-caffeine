import { ProductSort, createActor } from "@/backend";
import type {
  CategoryInput,
  CheckoutInput,
  OrderStatus,
  ProductFilter,
  ProductInput,
  UserProfile,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const DEFAULT_FILTER: ProductFilter = { inStockOnly: false, onSaleOnly: false };

// React Query hashes query keys with JSON.stringify, which throws on bigint.
// Build a plain serializable key from the typed filter while still passing the
// real ProductFilter (with bigint fields) to the backend call.
function serializeFilter(filter: ProductFilter) {
  return {
    categoryId: filter.categoryId?.toString(),
    search: filter.search,
    brand: filter.brand,
    minPrice: filter.minPrice?.toString(),
    maxPrice: filter.maxPrice?.toString(),
    minRating: filter.minRating,
    color: filter.color,
    size: filter.size,
    inStockOnly: filter.inStockOnly,
    onSaleOnly: filter.onSaleOnly,
  };
}

export function useProducts(
  filter: ProductFilter = DEFAULT_FILTER,
  sort: ProductSort = ProductSort.popular,
  page = 1,
  pageSize = 12,
) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["products", serializeFilter(filter), sort, page, pageSize],
    queryFn: async () => {
      if (!actor) return null;
      return actor.listProducts(filter, sort, BigInt(page), BigInt(pageSize));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProduct(id: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["product", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getProduct(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useSimilarProducts(id: bigint | null, limit = 4) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["similar-products", id?.toString(), limit],
    queryFn: async () => {
      if (!actor || id === null) return [];
      return actor.getSimilarProducts(id, BigInt(limit));
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function usePopularProducts(limit = 8) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["popular-products", limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPopularProducts(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useNewProducts(limit = 8) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["new-products", limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNewProducts(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDiscountedProducts(limit = 8) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["discounted-products", limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDiscountedProducts(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTopProducts(limit = 8) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["top-products", limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopProducts(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCategories() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBrands() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listBrands();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useReviews(productId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["reviews", productId?.toString()],
    queryFn: async () => {
      if (!actor || productId === null) return [];
      return actor.listReviews(productId);
    },
    enabled: !!actor && !isFetching && productId !== null,
  });
}

export function useFavorites() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFavorites();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCart() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCart();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOrders() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOrder(id: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["order", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getOrder(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["caller-profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerRole() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["caller-role"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDashboardStats() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllOrders() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["all-orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUsers() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddToCart() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      productId: bigint;
      quantity: number;
      color: string;
      size: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addToCart(
        input.productId,
        BigInt(input.quantity),
        input.color,
        input.size,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useUpdateCartItem() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { productId: bigint; quantity: number }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateCartItem(input.productId, BigInt(input.quantity));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useRemoveFromCart() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.removeFromCart(productId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useClearCart() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.clearCart();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useAddFavorite() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addFavorite(productId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useRemoveFavorite() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.removeFavorite(productId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useCheckout() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CheckoutInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.checkout(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useSaveProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["caller-profile"] });
    },
  });
}

export function useCreateProduct() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createProduct(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: bigint; data: ProductInput }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateProduct(input.id, input.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteProduct(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useCreateCategory() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createCategory(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: bigint; data: CategoryInput }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateCategory(input.id, input.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteCategory(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: bigint; status: OrderStatus }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateOrderStatus(input.id, input.status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["all-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
