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
- A public/tenant-scoped read API for a storefront to consume this
  configuration (deferred to when that frontend project starts)
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
