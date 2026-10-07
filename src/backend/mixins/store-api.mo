import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/store";
import StoreLib "../lib/store";

mixin (
  accessControlState : AccessControl.AccessControlState,
  storeState : StoreLib.StoreState,
  collections : StoreLib.StoreCollections,
) {
  func requireAdmin(caller : Principal) : () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin access required");
    };
  };

  // ---- Catalog ----

  public query func listProducts(
    filter : Types.ProductFilter,
    sort : Types.ProductSort,
    page : Nat,
    pageSize : Nat,
  ) : async Types.ProductPage {
    StoreLib.listProducts(collections, filter, sort, page, pageSize);
  };

  public query func getProduct(id : Nat) : async ?Types.Product {
    StoreLib.getProduct(collections, id);
  };

  public query func getSimilarProducts(id : Nat, limit : Nat) : async [Types.Product] {
    StoreLib.getSimilarProducts(collections, id, limit);
  };

  public query func getPopularProducts(limit : Nat) : async [Types.Product] {
    StoreLib.getPopularProducts(collections, limit);
  };

  public query func getNewProducts(limit : Nat) : async [Types.Product] {
    StoreLib.getNewProducts(collections, limit);
  };

  public query func getDiscountedProducts(limit : Nat) : async [Types.Product] {
    StoreLib.getDiscountedProducts(collections, limit);
  };

  public query func getTopProducts(limit : Nat) : async [Types.Product] {
    StoreLib.getTopProducts(collections, limit);
  };

  public query func listCategories() : async [Types.Category] {
    StoreLib.listCategories(collections);
  };

  public query func listBrands() : async [Text] {
    StoreLib.listBrands(collections);
  };

  public query func listReviews(productId : Nat) : async [Types.Review] {
    StoreLib.listReviews(collections, productId);
  };

  // ---- Favorites ----

  public query ({ caller }) func listFavorites() : async [Types.Product] {
    StoreLib.listFavorites(collections, caller);
  };

  public shared ({ caller }) func addFavorite(productId : Nat) : async () {
    StoreLib.addFavorite(collections, caller, productId);
  };

  public shared ({ caller }) func removeFavorite(productId : Nat) : async () {
    StoreLib.removeFavorite(collections, caller, productId);
  };

  // ---- Cart ----

  public query ({ caller }) func getCart() : async [Types.CartItem] {
    StoreLib.getCart(collections, caller);
  };

  public shared ({ caller }) func addToCart(
    productId : Nat,
    quantity : Nat,
    color : Text,
    size : Text,
  ) : async () {
    StoreLib.addToCart(collections, caller, productId, quantity, color, size);
  };

  public shared ({ caller }) func updateCartItem(productId : Nat, quantity : Nat) : async () {
    StoreLib.updateCartItem(collections, caller, productId, quantity);
  };

  public shared ({ caller }) func removeFromCart(productId : Nat) : async () {
    StoreLib.removeFromCart(collections, caller, productId);
  };

  public shared ({ caller }) func clearCart() : async () {
    StoreLib.clearCart(collections, caller);
  };

  // ---- Orders ----

  public shared ({ caller }) func checkout(input : Types.CheckoutInput) : async Types.Order {
    StoreLib.checkout(storeState, collections, caller, input);
  };

  public query ({ caller }) func listOrders() : async [Types.Order] {
    StoreLib.listOrders(collections, caller);
  };

  public query ({ caller }) func getOrder(id : Nat) : async ?Types.Order {
    StoreLib.getOrder(collections, caller, id);
  };

  // ---- Profile ----

  public query ({ caller }) func getCallerUserProfile() : async ?Types.UserProfile {
    StoreLib.getProfile(collections, caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : Types.UserProfile) : async () {
    StoreLib.saveProfile(collections, caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?Types.UserProfile {
    if (not (Principal.equal(caller, user) or AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: can only read your own profile");
    };
    StoreLib.getProfile(collections, user);
  };

  // ---- Admin ----

  public shared ({ caller }) func createProduct(input : Types.ProductInput) : async Types.Product {
    requireAdmin(caller);
    StoreLib.createProduct(storeState, collections, input);
  };

  public shared ({ caller }) func updateProduct(id : Nat, input : Types.ProductInput) : async ?Types.Product {
    requireAdmin(caller);
    StoreLib.updateProduct(collections, id, input);
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async Bool {
    requireAdmin(caller);
    StoreLib.deleteProduct(collections, id);
  };

  public shared ({ caller }) func createCategory(input : Types.CategoryInput) : async Types.Category {
    requireAdmin(caller);
    StoreLib.createCategory(storeState, collections, input);
  };

  public shared ({ caller }) func updateCategory(id : Nat, input : Types.CategoryInput) : async ?Types.Category {
    requireAdmin(caller);
    StoreLib.updateCategory(collections, id, input);
  };

  public shared ({ caller }) func deleteCategory(id : Nat) : async Bool {
    requireAdmin(caller);
    StoreLib.deleteCategory(collections, id);
  };

  public query ({ caller }) func listAllOrders() : async [Types.Order] {
    requireAdmin(caller);
    StoreLib.listAllOrders(collections);
  };

  public shared ({ caller }) func updateOrderStatus(id : Nat, status : Types.OrderStatus) : async ?Types.Order {
    requireAdmin(caller);
    StoreLib.updateOrderStatus(collections, id, status);
  };

  public query ({ caller }) func listUsers() : async [(Principal, Types.UserProfile)] {
    requireAdmin(caller);
    StoreLib.listUsers(collections);
  };

  public query ({ caller }) func getDashboardStats() : async Types.DashboardStats {
    requireAdmin(caller);
    StoreLib.getDashboardStats(collections);
  };
};
