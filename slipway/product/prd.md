# Catalog Module: Product Requirements

## Problem

EcomOs is a working multi-tenant back-office platform — tenants,
subscriptions, roles/permissions, menus, feature flags — but has no
notion of a product. A tenant can log in and administer their account
today, but cannot describe, organize, or publish anything sellable, and
therefore cannot run a storefront. Any single, hardcoded product shape
(e.g. apparel-only fields) would force tenants outside that one
vertical into workarounds or a schema fork per domain.

## Target users

- **Tenant merchandisers/admins** — create, organize, and publish
  catalog data through the existing admin back-office (`ecom-os-fe`).
- **Storefront shoppers** — browse, filter, search, and view product
  detail on a tenant's public store, which reads this data through a
  read-only API. (The storefront application itself is a separate,
  not-yet-built consumer — see `tech-stack.md`.)

## Why this approach

Rather than modeling one vertical and forcing every tenant into it, the
catalog is built around a configurable attribute system: categories
carry an assignable set of fields, and products/variants carry values
against that set. A t-shirt, a sofa, a laptop, and a jar of pickles are
different *configurations* of the same schema, not different code
paths — consistent with how the rest of the platform already scopes
capability per tenant (feature flags, subscription-gated modules)
rather than per-deployment forks.

## Out of scope (product-wide)

- Cart, checkout, and payment processing
- Shipping-rate calculation / carrier integration (only shipping
  *inputs* — weight, dimensions — are in scope)
- Order management and post-purchase workflows
- Supplier / purchase-order / procurement workflows
- POS or other omnichannel inventory synchronization
- Marketing automation or a coupon engine (beyond the scheduled-sale
  pricing in Feature 6)
- B2B quote/contract negotiation workflows
- AI-generated or auto-translated product content

## Features

### 1. Category & Brand Taxonomy

**Problem:** Merchandisers need a way to organize products into
browsable groups and attach a manufacturer/label before any product
can be created.

**In scope:**
- Multiple independent category hierarchies (taxonomies) per tenant
- Parent/child categories with slug, name, description, image, SEO
  fields, and display order
- Brand directory: name, slug, logo, description, country of origin
- Assigning a product to one or more categories, with exactly one
  marked primary

**Out of scope:**
- Category-level promotions or merchandising rules
- Automatic category assignment / ML classification

**Acceptance criteria:**
1. A tenant admin can create a category tree at least three levels
   deep and reorder sibling categories.
2. A tenant can maintain more than one independent taxonomy (e.g. "by
   category" and "by room") at the same time.
3. A brand can be created, edited, and attached to a product.
4. A product can be listed under more than one category with exactly
   one marked as primary.
5. Deleting a category that still has products attached is blocked, or
   requires explicit reassignment first.

### 2. Core Product Record & Publishing

**Problem:** Merchandisers need a base product they can fill in,
preview, and publish, independent of how complex its variants or
attributes eventually get.

**In scope:**
- Create/edit a product: name, slug, descriptions, brand, category,
  SEO fields
- A single default sellable variant with SKU, barcode, price, currency
- Image/video gallery
- Lifecycle: Draft → Pending Review → Published → Archived/Discontinued
- Single-warehouse stock quantity

**Out of scope:**
- Multiple variants per product (Feature 4)
- Multiple warehouses (Feature 5)
- Scheduled or tiered pricing (Feature 6)

**Acceptance criteria:**
1. A product cannot be published without a name, price, and at least
   one image.
2. A product's status can move Draft → Pending Review → Published, and
   Published → Archived; a shopper never sees anything but Published.
3. Editing a published product does not unpublish it.
4. A product page shows in-stock/out-of-stock status based on
   quantity.
5. A product can be permanently deleted only from Draft or Archived
   status.

### 3. Configurable Attribute Sets

**Problem:** The same product form has to describe a t-shirt, a sofa,
a laptop, and a jar of pickles without a code change per vertical.

**In scope:**
- Attribute definitions: name, data type, unit, options,
  filterable/searchable flags
- Attribute groups and named attribute sets
- Binding an attribute set to a category as its default
- A product's edit form rendering the fields its set defines, with
  values validated per attribute's own rules

**Out of scope:**
- Retroactively re-validating already-published products when an
  attribute set changes
- AI-suggested attributes

**Acceptance criteria:**
1. An admin can define a new attribute (e.g. "Nutrition per 100g",
   numeric, with a unit) without a code deployment.
2. Assigning an attribute set to a category changes the fields shown
   when creating a product in that category.
3. A required attribute blocks publishing until it's filled in.
4. A Select/MultiSelect attribute's options (e.g. color swatches)
   appear as choices, not free text.
5. Two products in different categories with different attribute sets
   coexist without interfering with each other's forms.

### 4. Variants & Merchandising Extras

**Problem:** Many products aren't a single SKU — they come in sizes
and colors, get bundled, or need optional add-ons.

**In scope:**
- Marking specific attributes as variant-defining to generate a SKU
  matrix (e.g. Size × Color), each with its own price/stock/images
- Non-variant paid options (gift wrap, engraving) that don't fork a SKU
- Bundle/kit products composed of other products
- Related-product links: cross-sell, up-sell, accessory
- Category- or brand-scoped size charts

**Out of scope:**
- Automatic bundle-price optimization
- AI-generated related-product suggestions

**Acceptance criteria:**
1. Marking Size and Color as variant-defining generates one SKU row
   per combination, each independently priced and stocked.
2. An out-of-stock variant doesn't block other variants of the same
   product from selling.
3. A non-variant option (e.g. engraving) adds its price to the order
   line without creating a new SKU.
4. A bundle product lists its component products and a combined price.
5. A size chart attached to a category or brand appears on every
   product it applies to without being re-entered per product.

### 5. Multi-Location Inventory

**Problem:** Tenants fulfilling from more than one location need stock
tracked and reserved per location, not as one global number.

**In scope:**
- Multiple warehouses/locations per tenant
- Per-variant, per-warehouse stock with reserved quantity, reorder
  point, backorder/preorder flags
- Lot number and expiry date fields for perishables

**Out of scope:**
- Automated purchase-order/replenishment workflows
- Warehouse-to-warehouse transfer orders

**Acceptance criteria:**
1. The same variant can show different available quantities at two
   different warehouses.
2. A backorder-allowed variant stays purchasable at zero stock; a
   non-backorder variant does not.
3. Reserved quantity is excluded from what's shown as available.
4. A variant nearing its reorder point is flagged in the admin UI.
5. An expiry date on a stock lot is visible to the admin but never
   exposed to the storefront as a raw field.

### 6. Pricing, Tax & Scheduled Sales

**Problem:** The same SKU can need a different price by channel,
currency, quantity, or time window.

**In scope:**
- Tax classes attached to products
- Price-list overrides of a variant's base price by currency, channel,
  or customer group
- Quantity-tiered pricing
- Scheduled sale windows with automatic start/end

**Out of scope:**
- Real-time competitor price matching
- Dynamic/surge pricing

**Acceptance criteria:**
1. A variant sold in two currencies shows the correct price for each
   without duplicating the product.
2. A scheduled sale price is live only between its start and end time,
   automatically.
3. A quantity-tiered price applies once order quantity crosses its
   threshold.
4. A product's tax class is available wherever tax-inclusive price
   needs to be displayed (tax computation itself is a checkout
   concern; this feature only supplies the class).
5. Removing a price-list override reverts the variant to its base
   price without manual re-entry.

### 7. Digital Products

**Problem:** Not everything sold is physical — software, e-books,
firmware, and license keys need delivery, not shipping.

**In scope:**
- Marking a variant digital
- Attaching a downloadable file or license-key pool
- Download limit and link expiry

**Out of scope:**
- DRM enforcement
- Streaming delivery

**Acceptance criteria:**
1. A digital variant never carries a shipping weight/dimensions
   requirement.
2. A digital product's download link stops working after its expiry
   or download-limit is reached.
3. A digital and a physical variant can exist on the same product
   (e.g. a game with a physical disc and a digital key).

### 8. Localization & Reviews

**Problem:** Multi-region tenants need product content in more than
one language, and shoppers want to see other buyers' feedback.

**In scope:**
- Per-locale translation of name/description/SEO fields
- Customer star rating + written review with a moderation status
- A cached average rating shown on the product

**Out of scope:**
- Automated translation
- Review-fraud detection beyond a manual moderation queue

**Acceptance criteria:**
1. A shopper viewing the store in a second configured locale sees
   translated content where it exists, and falls back to the default
   locale where it doesn't.
2. A submitted review does not appear publicly until approved.
3. A product's displayed average rating updates when a new review is
   approved.

### 9. Public Storefront Catalog API

**Problem:** None of the above is usable by an actual store until
there's a public, fast, tenant-scoped way to read it.

**In scope:**
- A public read API serving only Published + purchasable variants
- Category/attribute/brand/price-range filtering and search
- Cached responses, invalidated on catalog changes

**Out of scope:**
- Cart, checkout, payments, order history (read-only catalog browsing
  only)

**Acceptance criteria:**
1. A Draft or Archived product never appears in any storefront
   response, regardless of caching state.
2. Filtering by an attribute marked filterable narrows results
   correctly; a non-filterable attribute isn't offered as a filter.
3. A price or stock change is reflected in the storefront within a
   defined freshness window (seconds, not the next deploy).
4. The API responds correctly when a tenant has zero products in a
   category (empty state, not an error).
5. Two tenants' catalogs never leak into each other's storefront
   responses.
