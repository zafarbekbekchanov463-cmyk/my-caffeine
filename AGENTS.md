# Project Guidance

## User Preferences

- Современный минималистичный оригинальный дизайн, не копирующий существующие компании
- Качественные изображения товаров и красивые карточки товаров
- Плавные анимации, современные шрифты, аккуратные тени, скруглённые элементы, профессиональная цветовая палитра, hover-эффекты
- Не перегружать сайт анимациями
- Все основные функции работают в демонстрационном режиме
- Оплата демонстрационная, реальные данные банковских карт не сохраняются

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- Backend listProducts treats `page` as 1-based (zeroBasedPage = page - 1); the frontend passes 1 for the first page. Keep the pagination convention aligned at one boundary.
- React Query hashes query keys with JSON.stringify, which throws on bigint; derive a serializable key (stringify bigint filter fields) while passing the real typed filter to the backend.
- TanStack Router validateSearch must whitelist every key a page reads via useSearch; unlisted keys are dropped, so extended filters silently fail to persist.
- Admin product edit forms must round-trip colors/sizes/specs/isPopular/isNew through the form state, or saving an edit silently wipes variant options.
- Tailwind color tokens must be declared in tailwind.config.js; CSS variables alone do not generate utility classes.
- Under Enhanced Migration, derived collections bundles must be `transient let`; module re-export is `public let Types = OtherModule;`; OQL manual-mode chains need a top-level `import Entity` and matching <Type>Value imports, and every entity needs .sample(...).
- Frontend delivery-cost display should call a shared helper mirroring the backend deliveryCostOf rather than re-deriving thresholds per page.
- Guard BigInt(routeParam) with try/catch so a non-numeric route param renders the not-found state instead of crashing during render.
