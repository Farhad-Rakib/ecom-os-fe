# Task Group 08: Localization

## Features covered

8. Localization & Reviews (localization half — split from the reviews half because they share no data model or user flow; see Task Group 09 for reviews)

## Tasks

- Domain entities: `ProductTranslation`, `CategoryTranslation`
- `?locale=` support on existing read endpoints, with default-locale fallback
- Locale-tab UI in `ProductEditorPage.tsx` and `CategoriesPage.tsx`
- No new permission — translation editing rides the same permission as editing the entity itself

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET/PUT | `/api/v1/products/{id}/translations/{localeCode}` | `{ name, shortDescription, description, seoTitle, seoDescription }` | `ApiResponse<ProductTranslation>` |
| GET/PUT | `/api/v1/categories/{id}/translations/{localeCode}` | `{ name, description, seoTitle, seoDescription }` | `ApiResponse<CategoryTranslation>` |

Existing `GET /api/v1/products`, `GET /api/v1/products/{id}`, `GET /api/v1/categories*` (Task Groups 01–02) accept an added `?locale=` query param, returning translated fields when a row exists and falling back to the default-locale fields when it doesn't (AC1).

## FE pages/components

- `ProductEditorPage.tsx` gains a locale switcher (tabs) that re-points the Basic Info/SEO fields at the selected locale's translation, showing default-locale content as placeholder text when the translation is empty.
- `CategoriesPage.tsx` (Task Group 01) gains the same locale-tab pattern for name/description.

## DB design

Depends on Task Group 02 (`products`) and Task Group 01 (`categories`).

- `product_translations` (id, product_id → products, locale_code, name, short_description, description, seo_title, seo_description); unique `(product_id, locale_code)`
- `category_translations` (id, category_id → categories, locale_code, name, description, seo_title, seo_description); unique `(category_id, locale_code)`

Brand and `AttributeOption` label translation follow the identical pattern but are deferred (see below) — not named in the PRD's acceptance criteria.

## QA checklist

- Editing locale B's translation never touches locale A's (default) content.
- A request for an unconfigured locale code falls back to default-locale content rather than erroring — verified here at the data/API level; exercised end-to-end once Task Group 10 exists.
- Removing a translation row reverts that locale's display to the default-locale fallback, not to a blank field.

## Blocking open questions

- **"A second configured locale" (PRD AC1) implies a tenant-level list of enabled locales, which doesn't exist anywhere in EcomOs today** — confirmed by search, there's no locale/culture concept in the backend at all. This group needs a `TenantLocale` concept (or a new field on an existing settings entity) defining which locales a tenant has turned on, before "falls back when a locale isn't configured" is even meaningful to test. Must be resolved — either scoped into this group or split out — before implementation.

## Deferred / safe-to-resolve-during-implementation

- Brand and `AttributeOption` label translation — same shape as this group, deferred to a follow-up pass since the PRD's acceptance criteria only named product/category content.
