# Storefront Configuration Module: Product Requirements

## Problem

EcomOs tenants have no way to configure how their (future)
customer-facing storefront is organized, branded, or curated. Today
navigation, site identity, featured products, and basic content pages
would all have to be hardcoded per tenant or built ad hoc once the
storefront frontend exists — there's no admin surface for any of it.

## Target users

Tenant admins/merchandisers who need to set up their storefront's
navigation, branding, and content ahead of (or independent from) when
the actual storefront frontend gets built, without engineering
involvement.

## Why this approach

Mirrors the WordPress admin model (menus, site identity, pages) most
tenant admins already have intuition for, while staying entirely
within the existing multi-tenant admin app and reusing the Catalog
module's existing data (Products, Categories, Taxonomies, Brands)
rather than duplicating it. The public read API a storefront frontend
would consume, and the storefront frontend itself, are deliberately
deferred until that project actually starts — the same call the
Catalog PRD made for its own Feature 9 (Public Storefront Catalog
API), so this work isn't built for a consumer that doesn't exist yet.

## Out of scope (product-wide)

- The customer-facing storefront frontend application itself (a
  separate, future project)
- A public/tenant-scoped read API for Branding, Content Pages, Hero
  Banner, or Collections (deferred to when that frontend project
  starts, or to a follow-up feature) — Feature 6 below narrows this
  boundary for menus and product listing specifically, the rest of
  this bullet still stands
- A full drag-and-drop homepage/page builder (the hero banner is one
  fixed section, not an arbitrary layout system)
- Rule-based or automatic product collections (e.g. auto-populated
  "Best Sellers") — collections are manually curated only
- Multi-language/localized content
- Custom CSS/JS injection or storefront theme/color customization
- Conditional/audience-based visibility rules on menus, pages, or
  banners (e.g. show only to logged-in shoppers)

## Features

### 1. Storefront Branding & Site Identity

**Problem:** A storefront needs basic identity — a favicon, logo,
name/tagline, and social links — configured once from the admin, not
hardcoded per tenant.

**In scope:**
- Upload/replace a favicon image
- Upload/replace a logo image
- Site title and tagline text fields
- Optional social media links (Facebook, Instagram, X/Twitter,
  YouTube, TikTok, LinkedIn)

**Out of scope:**
- Generating multiple favicon sizes/formats (apple-touch-icon, etc.)
  — a single uploaded image only
- Theme colors, fonts, or other visual customization

**Acceptance criteria:**
1. An admin can upload a favicon image and it's stored and retrievable
   via a URL.
2. An admin can upload a logo image, independently of the favicon.
3. An admin can set and edit a site title and tagline.
4. An admin can set any subset of the listed social links; none are
   required.
5. Re-uploading a favicon or logo replaces the previous one without
   leaving orphaned files referenced nowhere.

### 2. Content Pages

**Problem:** Every storefront needs a handful of static informational
pages (About, Contact, Terms, Privacy, Shipping/Returns) an admin can
write and edit without a code deploy.

**In scope:**
- Create/edit/delete a content page: title, URL slug, rich text body
- SEO fields (title, meta description), matching the pattern already
  used for Catalog products/categories
- Draft/Published state for a page

**Out of scope:**
- Page templates or layout variation — every page is the same
  title+body shape
- Versioning/revision history

**Acceptance criteria:**
1. An admin can create a page with a title, slug, and body content.
2. A page's slug is unique per tenant.
3. A page can be saved as a draft and published independently of
   creation.
4. Deleting a page removes it entirely — no soft-delete or version
   history requirement.
5. A page's SEO title/meta description can be set independently of
   its display title.

### 3. Product Showcases (Collections)

**Problem:** Admins want to curate named, ordered sets of existing
products (e.g. "Featured", "New Arrivals") to highlight on the future
storefront, without a rules/merchandising engine.

**In scope:**
- Create/edit/delete a named collection
- Add/remove/reorder products within a collection, sourced from
  existing Catalog products
- A product can belong to more than one collection

**Out of scope:**
- Automatic/rule-based membership (sales-based, recency-based, etc.)
- Per-collection scheduling (start/end dates)

**Acceptance criteria:**
1. An admin can create a collection with a name and add existing
   catalog products to it.
2. Products within a collection can be reordered and the order
   persists.
3. Removing a product from a collection does not delete the product
   itself.
4. The same product can belong to multiple different collections at
   once.
5. Deleting a collection does not delete its member products.

### 4. Homepage Hero Banner

**Problem:** Storefronts conventionally lead with a single promotional
banner; admins need to set its image, text, and link without a page
builder.

**In scope:**
- A single banner: image, headline text, optional subtext, and a
  call-to-action link
- The CTA link can target a Category, a Product, a Collection
  (Feature 3), or a custom URL

**Out of scope:**
- Multiple or rotating banners / a carousel
- Arbitrary homepage section arrangement (a page builder — out of
  scope product-wide)

**Acceptance criteria:**
1. An admin can set a banner image, headline, and CTA link in one
   place.
2. The CTA link can be configured to point at a Category, a Product,
   a Collection, or an arbitrary URL, storing which kind plus the
   specific target.
3. Subtext and the CTA link are optional; only the image and headline
   are required.
4. Exactly one hero banner configuration exists per tenant — not a
   list.

### 5. Navigation Menus

**Problem:** Admins need to build header/nav and footer menus the way
they would in WordPress — an ordered, optionally-nested tree of items,
each pointing at something meaningful.

**In scope:**
- Two menu locations: primary/header navigation and footer navigation
- Each menu is an ordered tree of items; a parent item can have child
  items (dropdown-style nav)
- Each menu item has a label and a link target: a Category, a
  Taxonomy, a Product, a Brand, a Collection (Feature 3), a Content
  Page (Feature 2), or a custom URL
- Reordering items, including moving an item between nesting levels

**Out of scope:**
- More than two menu locations (e.g. a separate mobile-only menu) —
  extendable later, not built now
- Icons or images per menu item
- Conditional/audience-based visibility rules (product-wide exclusion,
  see above)

**Acceptance criteria:**
1. An admin can create items in the header menu and the footer menu
   independently of each other.
2. A menu item can be configured to link to a Category, a Taxonomy, a
   Product, a Brand, a Collection, a Content Page, or a custom URL,
   storing which kind plus the specific target.
3. A menu item can be nested one level under another item, producing
   a dropdown-capable structure.
4. Reordering items — among siblings, or moving one to a different
   parent — persists.
5. Deleting a category, product, brand, taxonomy, page, or collection
   that a menu item currently references does not leave the admin app
   in a broken state (the affected item is handled gracefully, not
   left silently pointing at nothing with no admin-visible signal).

### 6. Public Storefront Read API — Menus & Product Listing

**Problem:** A future, anonymous, customer-facing storefront frontend
needs to read this tenant's navigation menu and product catalog to
render pages, but every existing read endpoint (menus, products)
requires an authenticated admin session and a permission policy.
There is currently no way for an unauthenticated consumer to fetch
"what's in the header/footer menu" or "browse/search this tenant's
products" at all — this feature builds that missing read surface.

**In scope:**
- A public, unauthenticated (no login, no API key) read API,
  tenant-scoped via the request's Host header against the tenant's
  registered storefront domain — not via an authenticated session or
  the existing `X-Tenant-Id` header
- Read access to header and footer navigation menu items, with each
  item's link target resolved inline to a renderable name and URL,
  not just its raw target type/id
- Read access to a paginated, filterable product listing: filter by
  category, by brand, and by a name/search match
- Read access to a single product's public detail by slug
- Only Published products are ever returned; Draft/PendingReview/
  Archived products are excluded from both listing and detail lookups
- A menu item whose link target has since been deleted does not break
  the response — it is omitted or flagged, not left pointing at
  nothing with no signal (same guarantee the existing admin API
  already gives)

**Out of scope:**
- Public endpoints for Branding, Content Pages, Hero Banner, or
  Collections — this feature covers menus and product listing only;
  a public surface for the rest is a candidate follow-up feature, not
  part of this one
- Any write/mutation capability — this is read-only; the existing
  authenticated admin API remains the only way to change anything
- Cart, checkout, pricing/promotions, personalization, or
  search-relevance tuning beyond a basic name match
- Rate limiting or issuing API keys/tokens for third-party consumers
- The storefront frontend application itself — still deferred, per
  this PRD's existing product-wide scope boundary
- Changes to the existing authenticated admin endpoints
  (`ProductsController`, `StorefrontMenusController`, etc.) — this is
  a new, additive surface, not a replacement or modification of those

**Acceptance criteria:**
1. An anonymous request (no `Authorization` header) with a `Host`
   header matching a tenant's registered storefront domain returns
   that tenant's header (or footer) menu items, each including a
   resolved, renderable name and URL for its link target rather than
   just a raw type and id.
2. A menu item whose link target has since been deleted is handled
   gracefully in the response (omitted or explicitly flagged) rather
   than causing an error or appearing as a dead link with no signal.
3. An anonymous request to the product listing endpoint returns only
   Published products for the resolved tenant, and supports
   pagination.
4. The product listing endpoint supports filtering by category and by
   brand, usable independently or together.
5. The product listing endpoint supports a name/search-text filter.
6. An anonymous request for a single product's detail by slug returns
   full public-facing product detail when that product is Published,
   and a not-found response when the slug doesn't exist for that
   tenant or the product isn't Published.
7. A request whose `Host` header does not resolve to any tenant's
   registered domain is rejected with a clear error, not silently
   defaulted to some tenant or an unhandled server error.
8. Data belonging to one tenant is never returned for a request that
   resolves to a different tenant, verified the same way this
   platform verifies tenant isolation elsewhere.
9. None of the existing authenticated admin endpoints for products or
   menus change behavior as a result of this feature.

### 7. Multi-Banner Hero Carousel & Public Storefront Read API — Branding, Hero Banners & Brand Directory

**Problem:** Feature 6 opened an anonymous, Host-resolved read surface
for menus and products, but explicitly excluded Branding and Hero
Banner — a real storefront frontend also needs to read the tenant's
site identity (name, logo, social links) and homepage hero banner(s)
without an authenticated session, and needs a way to list the brands
it carries (for a "brands we stock" style display) using data the
Catalog module already has (`Brand.LogoUrl`). Separately, the
already-shipped Hero Banner admin feature (Task Group 14) models
exactly one banner per tenant — but a real storefront homepage needs a
rotating set of banner slides, not one static image. A single-row
model can't express that, so this feature also changes Hero Banner
itself from "the one banner" to an ordered list of banners, before
exposing it publicly. Mirrored from `ecom-os-be`'s PRD — this repo's
share of the work is the admin UI for the new list model.

**In scope:**
- Update the admin Hero Banner UI (`HeroBannerPage.tsx`, Task Group
  14) from a single-resource content/image upsert form to a list view
  with create/edit/delete and reorder (up/down, matching this
  project's established reorder-button convention over drag-and-drop
  — see Task Group 15's precedent), driven by the backend's new
  list-shaped Hero Banner API.
- No other FE change is implied by this feature — the public read
  endpoints (Branding, hero banners, Brand Directory) are consumed by
  the still-deferred storefront frontend, not this admin app.

**Out of scope:**
- Everything Feature 6 already excluded for this repo (this feature
  adds no new backend-only surface to this repo's scope) — the public
  API itself, its Contracts/CQRS plumbing, and the Hero Banner
  single-to-list domain/migration work all live in `ecom-os-be`.
- Slide autoplay timing, transition style, or any other
  presentation/animation behavior in a future storefront frontend —
  not this admin app's concern.
- Any change to Branding's or Brands' existing admin UI.

**Acceptance criteria:**
1. An admin can create, edit, delete, and reorder multiple hero
   banners for a tenant in `HeroBannerPage.tsx` (a list, not a single
   upsert form), each with an image, headline, subtext, and CTA
   target — reusing the existing `LinkTargetPicker` component (Task
   Group 14) unchanged.
2. A tenant that already had one hero banner configured before this
   feature sees that banner as the first item of their new list after
   the change — no data or configuration is lost from the admin's
   point of view.
3. `tsc`/`vite build` are clean; no other admin page's behavior
   changes as a result of this feature.
