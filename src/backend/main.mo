import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import OQL "mo:caffeineai-oql";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import FloatValue "mo:caffeineai-oql/FloatValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import StoreLib "lib/store";
import StoreApi "mixins/store-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  let storeState : StoreLib.StoreState;
  let products : Map.Map<Nat, StoreLib.Types.Product>;
  let categories : Map.Map<Nat, StoreLib.Types.Category>;
  let reviews : Map.Map<Nat, StoreLib.Types.Review>;
  let carts : Map.Map<Principal, List.List<StoreLib.Types.CartItem>>;
  let favorites : Map.Map<Principal, List.List<StoreLib.Types.FavoriteItem>>;
  let orders : Map.Map<Nat, StoreLib.Types.Order>;
  let profiles : Map.Map<Principal, StoreLib.Types.UserProfile>;

  transient let collections : StoreLib.StoreCollections = {
    products;
    categories;
    reviews;
    carts;
    favorites;
    orders;
    profiles;
  };

  include StoreApi(accessControlState, storeState, collections);
  include ApiDocMixin();
  include Expose({
    entities = [
      OQL.Entity.manual<StoreLib.Types.Product>("products", func () = products.values(), "Product", "id")
        .sample({
          id = 0; name = ""; description = ""; categoryId = 0; brand = "";
          price = 0; oldPrice = 0; discount = 0; rating = 0.0; reviewCount = 0;
          inStock = false; stock = 0; colors = []; sizes = []; images = [];
          specs = []; isNew = false; isPopular = false; createdAt = 0;
        })
        .payload("id", func p = p.id)
        .payload("name", func p = p.name)
        .payload("description", func p = p.description)
        .payload("categoryId", func p = p.categoryId)
        .payload("brand", func p = p.brand)
        .payload("price", func p = p.price)
        .payload("oldPrice", func p = p.oldPrice)
        .payload("discount", func p = p.discount)
        .payload("rating", func p = p.rating)
        .payload("reviewCount", func p = p.reviewCount)
        .payload("inStock", func p = p.inStock)
        .payload("stock", func p = p.stock)
        .payload("isNew", func p = p.isNew)
        .payload("isPopular", func p = p.isPopular)
        .payload("createdAt", func p = p.createdAt)
        .public_()
        .build(),
      OQL.Entity.manual<StoreLib.Types.Category>("categories", func () = categories.values(), "Category", "id")
        .sample({ id = 0; name = ""; slug = ""; icon = "" })
        .payload("id", func c = c.id)
        .payload("name", func c = c.name)
        .payload("slug", func c = c.slug)
        .payload("icon", func c = c.icon)
        .public_()
        .build(),
      OQL.Entity.manual<StoreLib.Types.Review>("reviews", func () = reviews.values(), "Review", "id")
        .sample({ id = 0; productId = 0; author = ""; rating = 0; text = ""; createdAt = 0 })
        .payload("id", func r = r.id)
        .payload("productId", func r = r.productId)
        .payload("author", func r = r.author)
        .payload("rating", func r = r.rating)
        .payload("text", func r = r.text)
        .payload("createdAt", func r = r.createdAt)
        .public_()
        .build(),
      OQL.Entity.manual<StoreLib.Types.Order>("orders", func () = orders.values(), "Order", "id")
        .sample({
          id = 0; user = Principal.fromText("aaaaa-aa"); firstName = ""; lastName = "";
          phone = ""; city = ""; address = ""; comment = ""; delivery = #courier;
          items = []; subtotal = 0; discount = 0; deliveryCost = 0; total = 0;
          status = #accepted; createdAt = 0;
        })
        .payload("id", func o = o.id)
        .payload("user", func o = o.user)
        .payload("firstName", func o = o.firstName)
        .payload("lastName", func o = o.lastName)
        .payload("phone", func o = o.phone)
        .payload("city", func o = o.city)
        .payload("address", func o = o.address)
        .payload("comment", func o = o.comment)
        .payload("delivery", func o = switch (o.delivery) {
          case (#courier) "courier";
          case (#pickupPoint) "pickupPoint";
          case (#selfPickup) "selfPickup";
        })
        .payload("subtotal", func o = o.subtotal)
        .payload("discount", func o = o.discount)
        .payload("deliveryCost", func o = o.deliveryCost)
        .payload("total", func o = o.total)
        .payload("status", func o = switch (o.status) {
          case (#accepted) "accepted";
          case (#assembling) "assembling";
          case (#shipped) "shipped";
          case (#delivered) "delivered";
        })
        .payload("createdAt", func o = o.createdAt)
        .ownedBy("user")
        .controllerOrScoped()
        .build(),
      OQL.Entity.manual<(Principal, StoreLib.Types.UserProfile)>("profiles", func () = profiles.entries(), "UserProfile", "user")
        .sample((Principal.fromText("aaaaa-aa"), { name = ""; email = ""; phone = ""; city = ""; address = "" }))
        .payload("user", func ((p, _)) = p)
        .payload("name", func ((_, u)) = u.name)
        .payload("email", func ((_, u)) = u.email)
        .payload("phone", func ((_, u)) = u.phone)
        .payload("city", func ((_, u)) = u.city)
        .payload("address", func ((_, u)) = u.address)
        .ownedBy("user")
        .controllerOrScoped()
        .build(),
    ];
  });

  // Populate the demo catalog on first install. Idempotent: no-op once seeded.
  StoreLib.seed(storeState, collections);
};
