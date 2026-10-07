import Common "common";

module {
  public type Timestamp = Common.Timestamp;
  public type ProductId = Common.ProductId;
  public type OrderId = Common.OrderId;
  public type CategoryId = Common.CategoryId;
  public type ReviewId = Common.ReviewId;

  // ---- Catalog ----

  public type Category = {
    id : CategoryId;
    name : Text;
    slug : Text;
    icon : Text;
  };

  public type Product = {
    id : ProductId;
    name : Text;
    description : Text;
    categoryId : CategoryId;
    brand : Text;
    price : Nat;
    oldPrice : Nat;
    discount : Nat;
    rating : Float;
    reviewCount : Nat;
    inStock : Bool;
    stock : Nat;
    colors : [Text];
    sizes : [Text];
    images : [Text];
    specs : [(Text, Text)];
    isNew : Bool;
    isPopular : Bool;
    createdAt : Timestamp;
  };

  public type Review = {
    id : ReviewId;
    productId : ProductId;
    author : Text;
    rating : Nat;
    text : Text;
    createdAt : Timestamp;
  };

  // ---- Cart / favorites ----

  public type CartItem = {
    productId : ProductId;
    quantity : Nat;
    color : Text;
    size : Text;
  };

  public type FavoriteItem = {
    productId : ProductId;
    addedAt : Timestamp;
  };

  // ---- Orders ----

  public type DeliveryMethod = {
    #courier;
    #pickupPoint;
    #selfPickup;
  };

  public type OrderStatus = {
    #accepted;
    #assembling;
    #shipped;
    #delivered;
  };

  public type OrderItem = {
    productId : ProductId;
    name : Text;
    price : Nat;
    quantity : Nat;
    color : Text;
    size : Text;
    image : Text;
  };

  public type Order = {
    id : OrderId;
    user : Principal;
    firstName : Text;
    lastName : Text;
    phone : Text;
    city : Text;
    address : Text;
    comment : Text;
    delivery : DeliveryMethod;
    items : [OrderItem];
    subtotal : Nat;
    discount : Nat;
    deliveryCost : Nat;
    total : Nat;
    status : OrderStatus;
    createdAt : Timestamp;
  };

  // ---- Profile ----

  public type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
    city : Text;
    address : Text;
  };

  // ---- Query / filter inputs ----

  public type ProductSort = {
    #popular;
    #newest;
    #priceAsc;
    #priceDesc;
    #rating;
    #discount;
  };

  public type ProductFilter = {
    categoryId : ?CategoryId;
    minPrice : ?Nat;
    maxPrice : ?Nat;
    brand : ?Text;
    minRating : ?Float;
    color : ?Text;
    size : ?Text;
    inStockOnly : Bool;
    onSaleOnly : Bool;
    search : ?Text;
  };

  public type ProductPage = {
    items : [Product];
    total : Nat;
    page : Nat;
    pageSize : Nat;
  };

  // ---- Admin inputs ----

  public type ProductInput = {
    name : Text;
    description : Text;
    categoryId : CategoryId;
    brand : Text;
    price : Nat;
    oldPrice : Nat;
    discount : Nat;
    stock : Nat;
    inStock : Bool;
    colors : [Text];
    sizes : [Text];
    images : [Text];
    specs : [(Text, Text)];
    isNew : Bool;
    isPopular : Bool;
  };

  public type CategoryInput = {
    name : Text;
    slug : Text;
    icon : Text;
  };

  public type CheckoutInput = {
    firstName : Text;
    lastName : Text;
    phone : Text;
    city : Text;
    address : Text;
    comment : Text;
    delivery : DeliveryMethod;
  };

  public type DashboardStats = {
    orderCount : Nat;
    salesTotal : Nat;
    productCount : Nat;
    userCount : Nat;
    popularProducts : [Product];
    ordersByStatus : [(Text, Nat)];
    salesByDay : [(Text, Nat)];
  };
};
