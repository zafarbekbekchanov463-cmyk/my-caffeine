mixin () {
  /// Returns the backend API documentation as static Markdown.
  public query func getApiDoc() : async Text {
    "# Интернет-магазин — Backend API\n\n" #
    "Backend-канистра демонстрационного интернет-магазина: каталог товаров и категорий, отзывы, избранное, корзина, заказы, профили пользователей и админ-панель со статистикой.\n\n" #
    "## Аутентификация и авторизация\n\n" #
    "- Все методы, принимающие `{ caller }`, используют principal вызывающего. Анонимный вызов получает анонимный principal.\n" #
    "- Публичные методы каталога (`listProducts`, `getProduct`, `getSimilarProducts`, `getPopularProducts`, `getNewProducts`, `getDiscountedProducts`, `getTopProducts`, `listCategories`, `listBrands`, `listReviews`) доступны любому вызывающему, включая анонимного.\n" #
    "- Методы корзины, избранного, заказов и профиля (`getCart`, `addToCart`, `updateCartItem`, `removeFromCart`, `clearCart`, `listFavorites`, `addFavorite`, `removeFavorite`, `checkout`, `listOrders`, `getOrder`, `getCallerUserProfile`, `saveCallerUserProfile`, `getUserProfile`) работают с principal вызывающего. Данные одного пользователя недоступны другому: `getOrder` и `getUserProfile` проверяют владельца и возвращают `null` или трапают при чужом principal.\n" #
    "- Админ-методы (`createProduct`, `updateProduct`, `deleteProduct`, `createCategory`, `updateCategory`, `deleteCategory`, `listAllOrders`, `updateOrderStatus`, `listUsers`, `getDashboardStats`) требуют роль администратора. Не-админ получает трап `Unauthorized: admin access required`.\n" #
    "- Роль администратора назначается через систему авторизации (`caffeineai-authorization`). Первый инициализатор получает роль администратора; последующие вызывающие — обычную роль.\n" #
    "- Фронтенд приложения закрепляет derivation origin Internet Identity, публикуемый по `/.well-known/ii-derivation-origin`. Агент, уже имеющий авторизацию Internet Identity пользователя, выводит правильный per-app principal относительно этого origin (например `icp identity link web <name> --app <host>`). Такая делегация действует с полномочиями пользователя в этом приложении до истечения срока.\n" #
    "- Регистрация происходит только при входе через фронтенд приложения. Principal, который никогда не входил через фронтенд, не зарегистрирован, даже если принадлежит владельцу приложения; principal, выведенный относительно другого origin, отличается от зарегистрированного.\n\n" #
    "## Единицы и кодирование\n\n" #
    "- `Timestamp` — `Int`, наносекунды с начала эпохи (как `Time.now()`).\n" #
    "- `ProductId`, `OrderId`, `CategoryId`, `ReviewId` — `Nat`.\n" #
    "- Цены (`price`, `oldPrice`, `subtotal`, `discount`, `deliveryCost`, `total`) — целые числа в минимальных денежных единицах (демонстрационные рубли).\n" #
    "- `rating` — `Float` (например `4.8`); `Review.rating` — `Nat` (1–5).\n" #
    "- `discount` — процент скидки (`Nat`, 0–100).\n" #
    "- `images` — массив URL-строк; `specs` — массив пар `(Text, Text)` (характеристика, значение).\n" #
    "- `delivery` — вариант `#courier` | `#pickupPoint` | `#selfPickup`.\n" #
    "- `status` — вариант `#accepted` | `#assembling` | `#shipped` | `#delivered` (Принят → Собирается → Отправлен → Доставлен).\n" #
    "- `ProductFilter` использует опциональные поля (`?CategoryId`, `?Nat`, `?Text`, `?Float`) — `null` означает «без ограничения».\n\n" #
    "## Жизненный цикл и опрос\n\n" #
    "- Каталог наполняется демонстрационными данными при первой установке канистры (идемпотентно: повторный вызов `seed` ничего не делает, если товары уже есть).\n" #
    "- Статус заказа меняется только администратором через `updateOrderStatus`; клиент опрашивает `listOrders` / `getOrder` для отображения актуального статуса.\n" #
    "- `getDashboardStats` возвращает агрегаты (`ordersByStatus`, `salesByDay`) для графиков админ-панели.\n\n" #
    "## Безопасность повторных вызовов и идемпотентность\n\n" #
    "- `addToCart` аддитивен: повторный вызов с той же комбинацией `productId`/`color`/`size` увеличивает количество. Для установки точного количества используйте `updateCartItem`.\n" #
    "- `updateCartItem` с `quantity = 0` удаляет позицию.\n" #
    "- `addFavorite` идемпотентен (повторное добавление не создаёт дубликат); `removeFavorite` идемпотентен.\n" #
    "- `checkout` не идемпотентен: каждый вызов создаёт новый заказ с новым номером и очищает корзину. Повторный вызов при пустой корзине создаёт заказ с пустым списком позиций и нулевой суммой.\n" #
    "- `createProduct` / `createCategory` создают новую запись при каждом вызове; для изменения используйте `updateProduct` / `updateCategory`.\n" #
    "- `deleteProduct` / `deleteCategory` возвращают `Bool` (`false`, если записи не было).\n\n" #
    "## Ошибки, лимиты и особенности\n\n" #
    "- Админ-методы трапают с `Unauthorized: admin access required` для не-админов.\n" #
    "- `getUserProfile` трапает с `Unauthorized: can only read your own profile`, если вызывающий не владелец и не админ.\n" #
    "- `getOrder` возвращает `null` для чужого или несуществующего заказа (не трапает).\n" #
    "- `getProduct`, `getSimilarProducts`, `getOrder`, `getUserProfile` возвращают `null` / пустой массив для отсутствующих данных.\n" #
    "- `listProducts` пагинируется: `page` — номер страницы с единицы (первая страница — `1`; `page = 0` трактуется как первая страница), `pageSize = 0` означает размер по умолчанию (12).\n" #
    "- Оплата демонстрационная: реальные данные банковских карт не принимаются и не сохраняются.\n" #
    "- Данные хранятся в стабильном состоянии канистры и сохраняются между обновлениями через цепочку миграций.\n";
  };
};
