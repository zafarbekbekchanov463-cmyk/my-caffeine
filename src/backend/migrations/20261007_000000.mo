import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type Timestamp = Int;
  type ProductId = Nat;
  type OrderId = Nat;
  type CategoryId = Nat;
  type ReviewId = Nat;

  type Category = {
    id : CategoryId;
    name : Text;
    slug : Text;
    icon : Text;
  };

  type Product = {
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

  type Review = {
    id : ReviewId;
    productId : ProductId;
    author : Text;
    rating : Nat;
    text : Text;
    createdAt : Timestamp;
  };

  type CartItem = {
    productId : ProductId;
    quantity : Nat;
    color : Text;
    size : Text;
  };

  type FavoriteItem = {
    productId : ProductId;
    addedAt : Timestamp;
  };

  type DeliveryMethod = {
    #courier;
    #pickupPoint;
    #selfPickup;
  };

  type OrderStatus = {
    #accepted;
    #assembling;
    #shipped;
    #delivered;
  };

  type OrderItem = {
    productId : ProductId;
    name : Text;
    price : Nat;
    quantity : Nat;
    color : Text;
    size : Text;
    image : Text;
  };

  type Order = {
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

  type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
    city : Text;
    address : Text;
  };

  type StoreState = {
    var nextProductId : Nat;
    var nextOrderId : Nat;
    var nextCategoryId : Nat;
    var nextReviewId : Nat;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    storeState : StoreState;
    products : Map.Map<Nat, Product>;
    categories : Map.Map<Nat, Category>;
    reviews : Map.Map<Nat, Review>;
    carts : Map.Map<Principal, List.List<CartItem>>;
    favorites : Map.Map<Principal, List.List<FavoriteItem>>;
    orders : Map.Map<Nat, Order>;
    profiles : Map.Map<Principal, UserProfile>;
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      storeState = {
        var nextProductId = 0;
        var nextOrderId = 0;
        var nextCategoryId = 0;
        var nextReviewId = 0;
      };
      products = Map.empty();
      categories = Map.empty();
      reviews = Map.empty();
      carts = Map.empty();
      favorites = Map.empty();
      orders = Map.empty();
      profiles = Map.empty();
    };
  };
};
