import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Char "mo:core/Char";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import StoreTypes "../types/store";

module {
  public let Types = StoreTypes;

  public type StoreState = {
    var nextProductId : Nat;
    var nextOrderId : Nat;
    var nextCategoryId : Nat;
    var nextReviewId : Nat;
  };

  public type StoreCollections = {
    products : Map.Map<Nat, StoreTypes.Product>;
    categories : Map.Map<Nat, StoreTypes.Category>;
    reviews : Map.Map<Nat, StoreTypes.Review>;
    carts : Map.Map<Principal, List.List<StoreTypes.CartItem>>;
    favorites : Map.Map<Principal, List.List<StoreTypes.FavoriteItem>>;
    orders : Map.Map<Nat, StoreTypes.Order>;
    profiles : Map.Map<Principal, StoreTypes.UserProfile>;
  };

  // ---- Helpers ----

  func containsText(xs : [Text], needle : Text) : Bool {
    xs.any(func x = x == needle);
  };

  // ASCII-only lowercase fold; sufficient for demo search matching.
  func lowerAscii(t : Text) : Text {
    t.map(func c = if (c.isUpper()) {
      (c.toNat32() + 32).toChar();
    } else {
      c;
    });
  };

  func textContains(haystack : Text, needle : Text) : Bool {
    haystack.contains(#text needle);
  };

  func matchesFilter(p : StoreTypes.Product, f : StoreTypes.ProductFilter) : Bool {
    let categoryOk = switch (f.categoryId) {
      case (?cid) { p.categoryId == cid };
      case null { true };
    };
    let minOk = switch (f.minPrice) {
      case (?min) { p.price >= min };
      case null { true };
    };
    let maxOk = switch (f.maxPrice) {
      case (?max) { p.price <= max };
      case null { true };
    };
    let brandOk = switch (f.brand) {
      case (?b) { p.brand == b };
      case null { true };
    };
    let ratingOk = switch (f.minRating) {
      case (?r) { p.rating >= r };
      case null { true };
    };
    let colorOk = switch (f.color) {
      case (?c) { containsText(p.colors, c) };
      case null { true };
    };
    let sizeOk = switch (f.size) {
      case (?s) { containsText(p.sizes, s) };
      case null { true };
    };
    let stockOk = (not f.inStockOnly) or p.inStock;
    let saleOk = (not f.onSaleOnly) or p.discount > 0;
    let searchOk = switch (f.search) {
      case (?q) {
        let term = lowerAscii(q);
        term == "" or textContains(lowerAscii(p.name), term) or textContains(lowerAscii(p.brand), term);
      };
      case null { true };
    };
    categoryOk and minOk and maxOk and brandOk and ratingOk and colorOk and sizeOk and stockOk and saleOk and searchOk;
  };

  func compareProducts(a : StoreTypes.Product, b : StoreTypes.Product, sort : StoreTypes.ProductSort) : { #less; #equal; #greater } {
    switch (sort) {
      case (#popular) {
        if (a.isPopular != b.isPopular) {
          if (a.isPopular) { #less } else { #greater };
        } else {
          Int.compare(b.reviewCount.toInt(), a.reviewCount.toInt());
        };
      };
      case (#newest) {
        if (a.isNew != b.isNew) {
          if (a.isNew) { #less } else { #greater };
        } else {
          Int.compare(b.createdAt, a.createdAt);
        };
      };
      case (#priceAsc) { Int.compare(a.price.toInt(), b.price.toInt()) };
      case (#priceDesc) { Int.compare(b.price.toInt(), a.price.toInt()) };
      case (#rating) { Float.compare(b.rating, a.rating) };
      case (#discount) { Int.compare(b.discount.toInt(), a.discount.toInt()) };
    };
  };

  func takeFirst<T>(items : [T], limit : Nat) : [T] {
    if (items.size() <= limit) { items } else {
      items.sliceToArray(0, limit.toInt());
    };
  };

  func allProducts(collections : StoreCollections) : [StoreTypes.Product] {
    collections.products.values().toArray();
  };

  func sortedProducts(collections : StoreCollections, sort : StoreTypes.ProductSort) : [StoreTypes.Product] {
    allProducts(collections).sort(func(a, b) = compareProducts(a, b, sort));
  };

  // ---- Catalog reads ----

  public func listProducts(
    collections : StoreCollections,
    filter : StoreTypes.ProductFilter,
    sort : StoreTypes.ProductSort,
    page : Nat,
    pageSize : Nat,
  ) : StoreTypes.ProductPage {
    let filtered = allProducts(collections).filter(func p = matchesFilter(p, filter));
    let sorted = filtered.sort(func(a, b) = compareProducts(a, b, sort));
    let total = sorted.size();
    let size = if (pageSize == 0) { 12 } else { pageSize };
    // `page` is 1-based (frontend passes 1 for the first page); clamp page 0 to the first page.
    let zeroBasedPage = if (page == 0) { 0 } else { page - 1 };
    let start = zeroBasedPage * size;
    let items = if (start >= total) { [] } else {
      let end = Nat.min(start + size, total);
      sorted.sliceToArray(start.toInt(), end.toInt());
    };
    { items; total; page; pageSize = size };
  };

  public func getProduct(collections : StoreCollections, id : Nat) : ?StoreTypes.Product {
    collections.products.get(id);
  };

  public func getSimilarProducts(collections : StoreCollections, id : Nat, limit : Nat) : [StoreTypes.Product] {
    switch (collections.products.get(id)) {
      case null { [] };
      case (?product) {
        let similar = allProducts(collections).filter(func p = p.id != id and p.categoryId == product.categoryId);
        takeFirst(similar, limit);
      };
    };
  };

  public func getPopularProducts(collections : StoreCollections, limit : Nat) : [StoreTypes.Product] {
    let popular = allProducts(collections).filter(func p = p.isPopular);
    takeFirst(popular.sort(func(a, b) = compareProducts(a, b, #popular)), limit);
  };

  public func getNewProducts(collections : StoreCollections, limit : Nat) : [StoreTypes.Product] {
    let fresh = allProducts(collections).filter(func p = p.isNew);
    takeFirst(fresh.sort(func(a, b) = compareProducts(a, b, #newest)), limit);
  };

  public func getDiscountedProducts(collections : StoreCollections, limit : Nat) : [StoreTypes.Product] {
    let discounted = allProducts(collections).filter(func p = p.discount > 0);
    takeFirst(discounted.sort(func(a, b) = compareProducts(a, b, #discount)), limit);
  };

  public func getTopProducts(collections : StoreCollections, limit : Nat) : [StoreTypes.Product] {
    takeFirst(sortedProducts(collections, #rating), limit);
  };

  public func listCategories(collections : StoreCollections) : [StoreTypes.Category] {
    collections.categories.values().toArray().sort(func(a, b) = Int.compare(a.id.toInt(), b.id.toInt()));
  };

  public func listBrands(collections : StoreCollections) : [Text] {
    let brands = Set.empty<Text>();
    for (p in collections.products.values()) {
      brands.add(p.brand);
    };
    brands.values().toArray().sort();
  };

  public func listReviews(collections : StoreCollections, productId : Nat) : [StoreTypes.Review] {
    collections.reviews.values().toArray()
      .filter(func r = r.productId == productId)
      .sort(func(a, b) = Int.compare(b.createdAt, a.createdAt));
  };

  // ---- Favorites ----

  public func listFavorites(collections : StoreCollections, user : Principal) : [StoreTypes.Product] {
    let items = collections.favorites.get(user) ?? List.empty<StoreTypes.FavoriteItem>();
    let result = List.empty<StoreTypes.Product>();
    for (fav in items.values()) {
      switch (collections.products.get(fav.productId)) {
        case (?p) { result.add(p) };
        case null {};
      };
    };
    result.toArray();
  };

  public func addFavorite(collections : StoreCollections, user : Principal, productId : Nat) : () {
    if (collections.products.get(productId) == null) { return };
    let items = switch (collections.favorites.get(user)) {
      case (?existing) { existing };
      case null {
        let fresh = List.empty<StoreTypes.FavoriteItem>();
        collections.favorites.add(user, fresh);
        fresh;
      };
    };
    if (items.find(func f = f.productId == productId) == null) {
      items.add({ productId; addedAt = Time.now() });
    };
  };

  public func removeFavorite(collections : StoreCollections, user : Principal, productId : Nat) : () {
    switch (collections.favorites.get(user)) {
      case null {};
      case (?items) {
        let kept = items.toArray().filter(func f = f.productId != productId);
        items.clear();
        for (f in kept.values()) { items.add(f) };
      };
    };
  };

  // ---- Cart ----

  public func getCart(collections : StoreCollections, user : Principal) : [StoreTypes.CartItem] {
    switch (collections.carts.get(user)) {
      case (?items) { items.toArray() };
      case null { [] };
    };
  };

  public func addToCart(
    collections : StoreCollections,
    user : Principal,
    productId : Nat,
    quantity : Nat,
    color : Text,
    size : Text,
  ) : () {
    if (collections.products.get(productId) == null) { return };
    let items = switch (collections.carts.get(user)) {
      case (?existing) { existing };
      case null {
        let fresh = List.empty<StoreTypes.CartItem>();
        collections.carts.add(user, fresh);
        fresh;
      };
    };
    switch (items.find(func i = i.productId == productId and i.color == color and i.size == size)) {
      case (?item) {
        let updated : StoreTypes.CartItem = {
          productId = item.productId;
          quantity = item.quantity + quantity;
          color = item.color;
          size = item.size;
        };
        let rebuilt = items.toArray().map(func i =
          if (i.productId == productId and i.color == color and i.size == size) { updated } else { i }
        );
        items.clear();
        for (i in rebuilt.values()) { items.add(i) };
      };
      case null { items.add({ productId; quantity; color; size }) };
    };
  };

  public func updateCartItem(
    collections : StoreCollections,
    user : Principal,
    productId : Nat,
    quantity : Nat,
  ) : () {
    switch (collections.carts.get(user)) {
      case null {};
      case (?items) {
        switch (items.find(func i = i.productId == productId)) {
          case (?item) {
            if (quantity == 0) {
              let kept = items.toArray().filter(func i = i.productId != productId);
              items.clear();
              for (i in kept.values()) { items.add(i) };
            } else {
              let updated : StoreTypes.CartItem = {
                productId = item.productId;
                quantity;
                color = item.color;
                size = item.size;
              };
              let rebuilt = items.toArray().map(func i =
                if (i.productId == productId) { updated } else { i }
              );
              items.clear();
              for (i in rebuilt.values()) { items.add(i) };
            };
          };
          case null {};
        };
      };
    };
  };

  public func removeFromCart(collections : StoreCollections, user : Principal, productId : Nat) : () {
    switch (collections.carts.get(user)) {
      case null {};
      case (?items) {
        let kept = items.toArray().filter(func i = i.productId != productId);
        items.clear();
        for (i in kept.values()) { items.add(i) };
      };
    };
  };

  public func clearCart(collections : StoreCollections, user : Principal) : () {
    switch (collections.carts.get(user)) {
      case null {};
      case (?items) { items.clear() };
    };
  };

  // ---- Orders ----

  func deliveryCostOf(delivery : StoreTypes.DeliveryMethod, subtotal : Nat) : Nat {
    switch (delivery) {
      case (#courier) { if (subtotal >= 5000) { 0 } else { 490 } };
      case (#pickupPoint) { if (subtotal >= 3000) { 0 } else { 290 } };
      case (#selfPickup) { 0 };
    };
  };

  public func checkout(
    state : StoreState,
    collections : StoreCollections,
    user : Principal,
    input : StoreTypes.CheckoutInput,
  ) : StoreTypes.Order {
    let cartItems = switch (collections.carts.get(user)) {
      case (?items) { items.toArray() };
      case null { [] };
    };
    let orderItems = List.empty<StoreTypes.OrderItem>();
    var subtotal = 0;
    var discountTotal = 0;
    for (item in cartItems.values()) {
      switch (collections.products.get(item.productId)) {
        case (?p) {
          let lineTotal = p.price * item.quantity;
          subtotal += lineTotal;
          if (p.oldPrice > p.price) {
            discountTotal += (p.oldPrice - p.price) * item.quantity;
          };
          orderItems.add({
            productId = p.id;
            name = p.name;
            price = p.price;
            quantity = item.quantity;
            color = item.color;
            size = item.size;
            image = if (p.images.size() > 0) { p.images[0] } else { "" };
          });
        };
        case null {};
      };
    };
    let deliveryCost = deliveryCostOf(input.delivery, subtotal);
    let total = subtotal + deliveryCost;
    let id = state.nextOrderId;
    state.nextOrderId := id + 1;
    let order : StoreTypes.Order = {
      id;
      user;
      firstName = input.firstName;
      lastName = input.lastName;
      phone = input.phone;
      city = input.city;
      address = input.address;
      comment = input.comment;
      delivery = input.delivery;
      items = orderItems.toArray();
      subtotal;
      discount = discountTotal;
      deliveryCost;
      total;
      status = #accepted;
      createdAt = Time.now();
    };
    collections.orders.add(id, order);
    clearCart(collections, user);
    order;
  };

  public func listOrders(collections : StoreCollections, user : Principal) : [StoreTypes.Order] {
    collections.orders.values().toArray()
      .filter(func o = Principal.equal(o.user, user))
      .sort(func(a, b) = Int.compare(b.createdAt, a.createdAt));
  };

  public func getOrder(collections : StoreCollections, user : Principal, id : Nat) : ?StoreTypes.Order {
    switch (collections.orders.get(id)) {
      case (?order) { if (Principal.equal(order.user, user)) { ?order } else { null } };
      case null { null };
    };
  };

  // ---- Profile ----

  public func getProfile(collections : StoreCollections, user : Principal) : ?StoreTypes.UserProfile {
    collections.profiles.get(user);
  };

  public func saveProfile(collections : StoreCollections, user : Principal, profile : StoreTypes.UserProfile) : () {
    collections.profiles.add(user, profile);
  };

  // ---- Admin ----

  func productFromInput(id : Nat, input : StoreTypes.ProductInput, createdAt : Int) : StoreTypes.Product {
    {
      id;
      name = input.name;
      description = input.description;
      categoryId = input.categoryId;
      brand = input.brand;
      price = input.price;
      oldPrice = input.oldPrice;
      discount = input.discount;
      rating = 0.0;
      reviewCount = 0;
      inStock = input.inStock;
      stock = input.stock;
      colors = input.colors;
      sizes = input.sizes;
      images = input.images;
      specs = input.specs;
      isNew = input.isNew;
      isPopular = input.isPopular;
      createdAt;
    };
  };

  public func createProduct(state : StoreState, collections : StoreCollections, input : StoreTypes.ProductInput) : StoreTypes.Product {
    let id = state.nextProductId;
    state.nextProductId := id + 1;
    let product = productFromInput(id, input, Time.now());
    collections.products.add(id, product);
    product;
  };

  public func updateProduct(collections : StoreCollections, id : Nat, input : StoreTypes.ProductInput) : ?StoreTypes.Product {
    switch (collections.products.get(id)) {
      case null { null };
      case (?existing) {
        let updated : StoreTypes.Product = {
          id;
          name = input.name;
          description = input.description;
          categoryId = input.categoryId;
          brand = input.brand;
          price = input.price;
          oldPrice = input.oldPrice;
          discount = input.discount;
          rating = existing.rating;
          reviewCount = existing.reviewCount;
          inStock = input.inStock;
          stock = input.stock;
          colors = input.colors;
          sizes = input.sizes;
          images = input.images;
          specs = input.specs;
          isNew = input.isNew;
          isPopular = input.isPopular;
          createdAt = existing.createdAt;
        };
        collections.products.add(id, updated);
        ?updated;
      };
    };
  };

  public func deleteProduct(collections : StoreCollections, id : Nat) : Bool {
    switch (collections.products.get(id)) {
      case null { false };
      case (?_) {
        collections.products.remove(id);
        true;
      };
    };
  };

  public func createCategory(state : StoreState, collections : StoreCollections, input : StoreTypes.CategoryInput) : StoreTypes.Category {
    let id = state.nextCategoryId;
    state.nextCategoryId := id + 1;
    let category : StoreTypes.Category = { id; name = input.name; slug = input.slug; icon = input.icon };
    collections.categories.add(id, category);
    category;
  };

  public func updateCategory(collections : StoreCollections, id : Nat, input : StoreTypes.CategoryInput) : ?StoreTypes.Category {
    switch (collections.categories.get(id)) {
      case null { null };
      case (?_) {
        let updated : StoreTypes.Category = { id; name = input.name; slug = input.slug; icon = input.icon };
        collections.categories.add(id, updated);
        ?updated;
      };
    };
  };

  public func deleteCategory(collections : StoreCollections, id : Nat) : Bool {
    switch (collections.categories.get(id)) {
      case null { false };
      case (?_) {
        collections.categories.remove(id);
        true;
      };
    };
  };

  public func listAllOrders(collections : StoreCollections) : [StoreTypes.Order] {
    collections.orders.values().toArray().sort(func(a, b) = Int.compare(b.createdAt, a.createdAt));
  };

  public func updateOrderStatus(collections : StoreCollections, id : Nat, status : StoreTypes.OrderStatus) : ?StoreTypes.Order {
    switch (collections.orders.get(id)) {
      case null { null };
      case (?order) {
        let updated : StoreTypes.Order = { order with status };
        collections.orders.add(id, updated);
        ?updated;
      };
    };
  };

  public func listUsers(collections : StoreCollections) : [(Principal, StoreTypes.UserProfile)] {
    collections.profiles.entries().toArray();
  };

  public func getDashboardStats(collections : StoreCollections) : StoreTypes.DashboardStats {
    let orders = collections.orders.values().toArray();
    var salesTotal = 0;
    for (o in orders.values()) { salesTotal += o.total };

    let statusCounts = Map.empty<Text, Nat>();
    for (o in orders.values()) {
      let key = switch (o.status) {
        case (#accepted) { "Принят" };
        case (#assembling) { "Собирается" };
        case (#shipped) { "Отправлен" };
        case (#delivered) { "Доставлен" };
      };
      statusCounts.add(key, (statusCounts.get(key) ?? 0) + 1);
    };

    let salesByDay = Map.empty<Text, Nat>();
    for (o in orders.values()) {
      let day = (o.createdAt / 86_400_000_000_000).toText();
      salesByDay.add(day, (salesByDay.get(day) ?? 0) + o.total);
    };

    let popular = allProducts(collections).filter(func p = p.isPopular);
    let popularSorted = popular.sort(func(a, b) = compareProducts(a, b, #popular));

    {
      orderCount = orders.size();
      salesTotal;
      productCount = collections.products.size();
      userCount = collections.profiles.size();
      popularProducts = takeFirst(popularSorted, 5);
      ordersByStatus = statusCounts.entries().toArray();
      salesByDay = salesByDay.entries().toArray();
    };
  };

  // ---- Seed data ----

  public func seed(state : StoreState, collections : StoreCollections) : () {
    if (collections.products.size() > 0) { return };

    let now = Time.now();
    let day : Int = 86_400_000_000_000;

    let categoryDefs : [(Text, Text, Text)] = [
      ("Электроника", "electronics", "🎧"),
      ("Смартфоны", "smartphones", "📱"),
      ("Ноутбуки", "laptops", "💻"),
      ("Одежда", "clothing", "👕"),
      ("Обувь", "shoes", "👟"),
      ("Аксессуары", "accessories", "⌚"),
      ("Товары для дома", "home", "🏠"),
      ("Спорт", "sport", "🏋️"),
      ("Красота", "beauty", "💄"),
      ("Детские товары", "kids", "🧸"),
    ];

    var catId = 0;
    for ((name, slug, icon) in categoryDefs.values()) {
      collections.categories.add(catId, { id = catId; name; slug; icon });
      catId += 1;
    };
    state.nextCategoryId := catId;

    // (name, categoryId, brand, price, oldPrice, discount, rating, reviewCount,
    //  stock, colors, sizes, isNew, isPopular, description, specs)
    let defs : [(Text, Nat, Text, Nat, Nat, Nat, Float, Nat, Nat, [Text], [Text], Bool, Bool, Text, [(Text, Text)])] = [
      ("Беспроводные наушники Aurora Pro", 0, "Aurora", 12990, 17990, 28, 4.8, 342, 45, ["Чёрный", "Белый"], [], true, true, "Активное шумоподавление, 40 часов автономности и кристально чистый звук.", [("Тип", "Накладные"), ("Bluetooth", "5.3"), ("Автономность", "40 ч")]),
      ("Умная колонка Echo Home", 0, "Nova", 7990, 9990, 20, 4.6, 218, 60, ["Серый", "Синий"], [], false, true, "Голосовой помощник, управление умным домом и качественный звук 360°.", [("Мощность", "30 Вт"), ("Wi-Fi", "Да"), ("Гарантия", "2 года")]),
      ("Портативная колонка Wave Mini", 0, "Wave", 3490, 4990, 30, 4.5, 156, 120, ["Красный", "Чёрный"], [], true, false, "Влагозащита IPX7, 12 часов работы и компактный корпус.", [("Защита", "IPX7"), ("Автономность", "12 ч")]),
      ("Фотоаппарат SnapShot X", 0, "Lumen", 45990, 54990, 16, 4.7, 89, 18, ["Чёрный"], [], false, true, "Матрица 24 Мп, 4K-видео и оптическая стабилизация.", [("Матрица", "24 Мп"), ("Видео", "4K")]),
      ("Телевизор Vision 55\"", 0, "Vision", 54990, 69990, 21, 4.6, 132, 22, ["Чёрный"], [], false, false, "4K QLED экран, Smart TV и встроенный голосовой поиск.", [("Диагональ", "55\""), ("Разрешение", "4K")]),
      ("Планшет Tab Air 11", 0, "Nova", 32990, 39990, 18, 4.7, 204, 35, ["Серебристый", "Серый"], [], true, true, "11-дюймовый дисплей, 128 ГБ памяти и поддержка стилуса.", [("Экран", "11\""), ("Память", "128 ГБ")]),

      ("Смартфон Nova X12", 1, "Nova", 69990, 84990, 18, 4.9, 512, 40, ["Чёрный", "Синий", "Зелёный"], ["128 ГБ", "256 ГБ"], true, true, "Флагманский процессор, тройная камера 108 Мп и быстрая зарядка 65 Вт.", [("Экран", "6.7\""), ("Камера", "108 Мп"), ("Батарея", "5000 мАч")]),
      ("Смартфон Aurora Lite", 1, "Aurora", 24990, 29990, 17, 4.5, 388, 75, ["Белый", "Голубой"], ["64 ГБ", "128 ГБ"], false, true, "Лёгкий корпус, яркий AMOLED-экран и надёжная батарея на весь день.", [("Экран", "6.4\""), ("Батарея", "4500 мАч")]),
      ("Смартфон Pixel One 5G", 1, "Lumen", 44990, 52990, 15, 4.7, 276, 50, ["Чёрный", "Красный"], ["128 ГБ", "256 ГБ"], true, false, "Поддержка 5G, чистая система и отличные ночные снимки.", [("Сеть", "5G"), ("Камера", "64 Мп")]),
      ("Смартфон Compact Mini", 1, "Wave", 18990, 22990, 17, 4.3, 145, 90, ["Розовый", "Чёрный"], ["64 ГБ"], false, false, "Компактный корпус, удобный одной рукой, и ёмкая батарея.", [("Экран", "5.8\""), ("Вес", "148 г")]),
      ("Смартфон Titan Max", 1, "Titan", 89990, 109990, 18, 4.8, 198, 25, ["Титан", "Чёрный"], ["256 ГБ", "512 ГБ"], true, true, "Премиальный корпус, экран 120 Гц и профессиональная камера.", [("Экран", "6.8\""), ("Частота", "120 Гц")]),

      ("Ноутбук UltraBook 14", 2, "Nova", 79990, 94990, 16, 4.8, 231, 30, ["Серебристый", "Серый"], [], true, true, "Тонкий корпус, 16 ГБ ОЗУ и 512 ГБ SSD для работы и учёбы.", [("Процессор", "Core i7"), ("ОЗУ", "16 ГБ"), ("SSD", "512 ГБ")]),
      ("Ноутбук GameForce 16", 2, "Titan", 139990, 169990, 18, 4.7, 167, 15, ["Чёрный"], [], false, true, "Игровая видеокарта, экран 165 Гц и продвинутое охлаждение.", [("Видеокарта", "RTX"), ("Экран", "165 Гц")]),
      ("Ноутбук AirSlim 13", 2, "Aurora", 59990, 69990, 14, 4.6, 189, 42, ["Золотистый", "Серебристый"], [], false, false, "Ультратонкий ноутбук весом 1.1 кг с автономностью до 15 часов.", [("Вес", "1.1 кг"), ("Автономность", "15 ч")]),
      ("Ноутбук ProStudio 15", 2, "Lumen", 119990, 139990, 14, 4.8, 98, 20, ["Серый"], [], true, false, "Дисплей 4K для дизайнеров и мощный процессор для рендеринга.", [("Дисплей", "4K"), ("ОЗУ", "32 ГБ")]),
      ("Ноутбук Student 15", 2, "Wave", 39990, 47990, 17, 4.4, 312, 65, ["Чёрный", "Синий"], [], false, false, "Надёжный ноутбук для учёбы с большим экраном и быстрым SSD.", [("Экран", "15.6\""), ("SSD", "256 ГБ")]),

      ("Футболка Basic Cotton", 3, "Urban", 1490, 1990, 25, 4.5, 421, 200, ["Белый", "Чёрный", "Серый"], ["S", "M", "L", "XL"], false, true, "100% хлопок, свободный крой и приятная к телу ткань.", [("Материал", "Хлопок 100%"), ("Крой", "Свободный")]),
      ("Худи Oversize Street", 3, "Urban", 3990, 5490, 27, 4.7, 287, 130, ["Чёрный", "Бежевый"], ["M", "L", "XL"], true, true, "Тёплое худи оверсайз с мягким флисом внутри.", [("Материал", "Футер"), ("Сезон", "Осень/Зима")]),
      ("Джинсы Slim Fit", 3, "Denim Co", 4990, 6490, 23, 4.6, 198, 110, ["Синий", "Чёрный"], ["28", "30", "32", "34"], false, false, "Классические джинсы с эластаном для комфортной посадки.", [("Материал", "Деним"), ("Посадка", "Slim")]),
      ("Куртка Windproof", 3, "North", 8990, 11990, 25, 4.8, 156, 70, ["Чёрный", "Хаки"], ["M", "L", "XL"], true, true, "Ветрозащитная куртка с водоотталкивающим покрытием.", [("Защита", "Ветро/водостойкая"), ("Сезон", "Демисезон")]),
      ("Платье Summer Breeze", 3, "Bella", 5490, 6990, 21, 4.7, 134, 85, ["Красный", "Синий"], ["S", "M", "L"], false, false, "Лёгкое летнее платье из дышащей ткани.", [("Материал", "Вискоза"), ("Длина", "Миди")]),

      ("Кроссовки RunFast", 4, "Stride", 7990, 9990, 20, 4.8, 356, 95, ["Белый", "Чёрный"], ["39", "40", "41", "42", "43"], true, true, "Амортизирующая подошва и дышащий верх для бега.", [("Подошва", "EVA"), ("Назначение", "Бег")]),
      ("Ботинки Leather Classic", 4, "North", 11990, 14990, 20, 4.7, 178, 60, ["Коричневый", "Чёрный"], ["40", "41", "42", "43", "44"], false, true, "Натуральная кожа и прочная подошва для города.", [("Материал", "Кожа"), ("Сезон", "Осень/Зима")]),
      ("Кеды Canvas Street", 4, "Urban", 3990, 4990, 20, 4.5, 264, 140, ["Белый", "Красный"], ["38", "39", "40", "41", "42"], false, false, "Лёгкие кеды из плотного текстиля на каждый день.", [("Материал", "Текстиль"), ("Подошва", "Резина")]),
      ("Сандалии Summer Walk", 4, "Stride", 2990, 3990, 25, 4.4, 112, 100, ["Бежевый", "Чёрный"], ["38", "39", "40", "41"], true, false, "Удобные сандалии с регулируемыми ремешками.", [("Материал", "Эко-кожа"), ("Сезон", "Лето")]),
      ("Кроссовки Trail Pro", 4, "Titan", 9990, 12990, 23, 4.8, 143, 55, ["Серый", "Зелёный"], ["40", "41", "42", "43", "44"], true, true, "Трейловые кроссовки с усиленным протектором.", [("Протектор", "Усиленный"), ("Назначение", "Трейл")]),

      ("Часы Smart Watch S2", 5, "Nova", 15990, 19990, 20, 4.7, 289, 65, ["Чёрный", "Серебристый"], [], true, true, "AMOLED-экран, мониторинг здоровья и 10 дней автономности.", [("Экран", "AMOLED"), ("Автономность", "10 дней")]),
      ("Солнцезащитные очки Aviator", 5, "Lumen", 4990, 6490, 23, 4.6, 167, 120, ["Чёрный", "Золотистый"], [], false, false, "UV400 защита и классическая форма авиатор.", [("Защита", "UV400"), ("Оправа", "Металл")]),
      ("Рюкзак Urban 25L", 5, "Urban", 3990, 4990, 20, 4.7, 234, 150, ["Чёрный", "Серый"], [], false, true, "Вместительный рюкзак с отделением для ноутбука.", [("Объём", "25 л"), ("Ноутбук", "до 15.6\"")]),
      ("Кошелёк Leather Slim", 5, "North", 2490, 3290, 24, 4.5, 145, 180, ["Коричневый", "Чёрный"], [], false, false, "Тонкий кожаный кошелёк с RFID-защитой.", [("Материал", "Кожа"), ("Защита", "RFID")]),
      ("Ремень Classic", 5, "North", 1990, 2490, 20, 4.4, 98, 200, ["Чёрный", "Коричневый"], ["M", "L"], false, false, "Классический ремень из натуральной кожи.", [("Материал", "Кожа"), ("Пряжка", "Металл")]),

      ("Кофемашина Barista Home", 6, "Nova", 24990, 29990, 17, 4.8, 176, 40, ["Серебристый", "Чёрный"], [], true, true, "Автоматическая кофемашина с капучинатором и 15 барами.", [("Давление", "15 бар"), ("Резервуар", "1.8 л")]),
      ("Робот-пылесос CleanBot", 6, "Nova", 19990, 25990, 23, 4.7, 243, 55, ["Белый", "Чёрный"], [], false, true, "Навигация LiDAR, влажная уборка и управление со смартфона.", [("Навигация", "LiDAR"), ("Уборка", "Сухая/влажная")]),
      ("Блендер PowerMix", 6, "Wave", 4990, 6490, 23, 4.5, 189, 110, ["Серебристый"], [], false, false, "Мощный блендер 1200 Вт со стеклянной чашей.", [("Мощность", "1200 Вт"), ("Чаша", "Стекло")]),
      ("Увлажнитель AirCare", 6, "Aurora", 3990, 4990, 20, 4.6, 156, 130, ["Белый"], [], true, false, "Увлажнитель с подсветкой и ультразвуковой технологией.", [("Объём", "4 л"), ("Технология", "Ультразвук")]),
      ("Набор посуды Chef 12", 6, "Chef", 8990, 11990, 25, 4.7, 132, 70, ["Серый"], [], false, false, "12 предметов с антипригарным покрытием.", [("Предметов", "12"), ("Покрытие", "Антипригарное")]),

      ("Гантели разборные 20 кг", 7, "Titan", 6990, 8990, 22, 4.8, 198, 60, ["Чёрный"], [], false, true, "Разборные гантели с прочным покрытием и замками.", [("Вес", "20 кг"), ("Покрытие", "Неопрен")]),
      ("Коврик для йоги Pro", 7, "Zen", 2490, 3290, 24, 4.7, 276, 160, ["Фиолетовый", "Синий"], [], true, false, "Нескользящий коврик толщиной 6 мм для йоги и фитнеса.", [("Толщина", "6 мм"), ("Материал", "TPE")]),
      ("Скакалка Speed Rope", 7, "Stride", 1290, 1690, 24, 4.5, 143, 220, ["Чёрный", "Красный"], [], false, false, "Скоростная скакалка с подшипниками и регулируемой длиной.", [("Подшипники", "Да"), ("Длина", "Регулируемая")]),
      ("Велотренажёр HomeFit", 7, "Titan", 34990, 42990, 19, 4.6, 87, 18, ["Чёрный"], [], true, true, "Магнитный велотренажёр с 8 уровнями нагрузки.", [("Нагрузка", "8 уровней"), ("Дисплей", "LCD")]),
      ("Бутылка для воды 1 л", 7, "Zen", 990, 1290, 23, 4.4, 312, 300, ["Синий", "Зелёный"], [], false, false, "Спортивная бутылка без BPA с герметичной крышкой.", [("Объём", "1 л"), ("Материал", "Tritan")]),

      ("Крем для лица Hydra", 8, "Bella", 2990, 3990, 25, 4.8, 234, 140, ["Белый"], [], true, true, "Увлажняющий крем с гиалуроновой кислотой.", [("Объём", "50 мл"), ("Тип кожи", "Все типы")]),
      ("Парфюм Floral Dream", 8, "Bella", 5990, 7990, 25, 4.7, 178, 90, ["Розовый"], [], false, true, "Цветочный аромат с нотами жасмина и пиона.", [("Объём", "50 мл"), ("Семейство", "Цветочные")]),
      ("Набор кистей Makeup 12", 8, "Bella", 3490, 4490, 22, 4.6, 156, 110, ["Розовый", "Чёрный"], [], false, false, "12 профессиональных кистей с мягким ворсом.", [("Предметов", "12"), ("Ворс", "Синтетика")]),
      ("Шампунь Repair Care", 8, "Aurora", 1490, 1990, 25, 4.5, 289, 200, ["Белый"], [], false, false, "Восстанавливающий шампунь для повреждённых волос.", [("Объём", "400 мл"), ("Тип волос", "Повреждённые")]),
      ("Маска для лица Glow", 8, "Bella", 990, 1390, 29, 4.6, 198, 250, ["Зелёный"], [], true, false, "Тканевая маска с витамином C для сияния кожи.", [("Тип", "Тканевая"), ("Эффект", "Сияние")]),

      ("Конструктор City Blocks", 9, "PlayGo", 3990, 4990, 20, 4.8, 167, 120, ["Разноцветный"], [], false, true, "Развивающий конструктор из 250 деталей.", [("Деталей", "250"), ("Возраст", "5+")]),
      ("Мягкая игрушка Bear", 9, "PlayGo", 1990, 2490, 20, 4.7, 234, 180, ["Коричневый"], [], true, false, "Плюшевый медведь из гипоаллергенных материалов.", [("Высота", "40 см"), ("Материал", "Плюш")]),
      ("Коляска Comfort Ride", 9, "BabyCare", 24990, 29990, 17, 4.7, 98, 30, ["Серый", "Синий"], [], false, true, "Лёгкая коляска-трансформер с амортизацией.", [("Тип", "Трансформер"), ("Вес", "8 кг")]),
      ("Набор для рисования Art", 9, "PlayGo", 2490, 3290, 24, 4.6, 145, 160, ["Разноцветный"], [], true, false, "Набор из 86 предметов для юных художников.", [("Предметов", "86"), ("Возраст", "3+")]),
      ("Развивающий коврик Play", 9, "BabyCare", 3490, 4490, 22, 4.5, 112, 95, ["Разноцветный"], [], false, false, "Музыкальный коврик с дугами и игрушками.", [("Размер", "90x90 см"), ("Возраст", "0+")]),
    ];

    var productId = 0;
    for ((name, categoryId, brand, price, oldPrice, discount, rating, reviewCount, stock, colors, sizes, isNew, isPopular, description, specs) in defs.values()) {
      let images = [
        "https://picsum.photos/seed/product" # productId.toText() # "a/800/800",
        "https://picsum.photos/seed/product" # productId.toText() # "b/800/800",
        "https://picsum.photos/seed/product" # productId.toText() # "c/800/800",
      ];
      collections.products.add(productId, {
        id = productId;
        name;
        description;
        categoryId;
        brand;
        price;
        oldPrice;
        discount;
        rating;
        reviewCount;
        inStock = stock > 0;
        stock;
        colors;
        sizes;
        images;
        specs;
        isNew;
        isPopular;
        createdAt = now - (productId.toInt() * day);
      });
      productId += 1;
    };
    state.nextProductId := productId;

    let reviewAuthors = ["Анна К.", "Дмитрий С.", "Елена В.", "Игорь П.", "Мария Л.", "Сергей Н.", "Ольга Т.", "Павел Р."];
    let reviewTexts = [
      "Отличное качество, полностью соответствует описанию. Рекомендую!",
      "Быстрая доставка, товар упакован аккуратно. Всем доволен.",
      "Хорошее соотношение цены и качества. Буду заказывать ещё.",
      "Пользуюсь уже месяц — работает отлично, никаких нареканий.",
      "Красивый и удобный, именно то, что искал.",
      "Немного отличается от фото, но в целом доволен покупкой.",
    ];

    var reviewId = 0;
    for (p in collections.products.values()) {
      let count = Nat.min(p.reviewCount, 4);
      var i = 0;
      while (i < count) {
        let author = reviewAuthors[(p.id + i) % reviewAuthors.size()];
        let text = reviewTexts[(p.id + i) % reviewTexts.size()];
        let rating = if (i == 0) { 5 } else if (i == 1) { 4 } else if (i == 2) { 5 } else { 4 };
        collections.reviews.add(reviewId, {
          id = reviewId;
          productId = p.id;
          author;
          rating;
          text;
          createdAt = now - ((reviewId.toInt() + 1) * day);
        });
        reviewId += 1;
        i += 1;
      };
    };
    state.nextReviewId := reviewId;

    // Demo orders so the admin dashboard is never empty.
    let demoUser = Principal.fromText("2vxsx-fae");
    let demoStatuses : [StoreTypes.OrderStatus] = [#delivered, #shipped, #assembling, #accepted, #delivered, #shipped];
    var orderId = 0;
    for (status in demoStatuses.values()) {
      let firstProduct = collections.products.get(orderId % productId);
      switch (firstProduct) {
        case (?p) {
          let qty = 1 + (orderId % 2);
          let subtotal = p.price * qty;
          let deliveryCost = if (orderId % 3 == 0) { 0 } else { 490 };
          collections.orders.add(orderId, {
            id = orderId;
            user = demoUser;
            firstName = "Демо";
            lastName = "Покупатель";
            phone = "+7 900 000-00-00";
            city = "Москва";
            address = "ул. Примерная, д. 1";
            comment = "";
            delivery = #courier;
            items = [{
              productId = p.id;
              name = p.name;
              price = p.price;
              quantity = qty;
              color = if (p.colors.size() > 0) { p.colors[0] } else { "" };
              size = if (p.sizes.size() > 0) { p.sizes[0] } else { "" };
              image = if (p.images.size() > 0) { p.images[0] } else { "" };
            }];
            subtotal;
            discount = 0;
            deliveryCost;
            total = subtotal + deliveryCost;
            status;
            createdAt = now - ((orderId.toInt() + 1) * day);
          });
          orderId += 1;
        };
        case null {};
      };
    };
    state.nextOrderId := orderId;
  };
};
