# Catalog Module: Product Requirements

## Problem

EcomOs is a working multi-tenant back-office platform — tenants,
subscriptions, roles/permissions, menus, feature flags — but has no
notion of a product. A tenant can log in and administer their account
today, but cannot describe, organize, or configure anything sellable.
Any single, hardcoded product shape (e.g. apparel-only fields) would
force tenants outside that one vertical into workarounds or a schema
fork per domain.

**Scope note (narrowed 2026-08-06):** this PRD covers *product
management and configuration* only — the data model and admin
workflows for defining what a product is (its taxonomy, its fields,
its SKUs/variants) and publishing it. Adjacent commerce concerns
(stock/inventory, pricing/tax, translation, reviews, and the public
read API) were originally scoped as part of this same PRD but have
been descoped to be planned and owned separately — see "Descoped from
this PRD" below. Where those areas already have shipped code (Task
Group 05 — Multi-Location Inventory), that implementation is
unaffected; only this document's forward-looking scope changed.

## Target users

- **Tenant merchandisers/admins** — create, organize, and configure
  catalog data through the existing admin back-office (`ecom-os-fe`):
  taxonomy, brands, product records, attribute schemas, and variant
  SKU generation.

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
- Marketing automation or a coupon engine
- B2B quote/contract negotiation workflows
- AI-generated or auto-translated product content
- Multi-location inventory / stock reservation (already implemented
  under the original scope as Task Group 05; now owned outside this
  PRD going forward — see "Descoped from this PRD")
- Pricing overrides, tax computation, and scheduled sales
- Content localization/translation
- Customer reviews & ratings
- The public storefront/read API

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

**Out of scope:**
- Multiple variants per product (Feature 4)
- Stock/inventory tracking (descoped — see "Descoped from this PRD")
- Scheduled or tiered pricing (descoped — see "Descoped from this PRD")

**Acceptance criteria:**
1. A product cannot be published without a name, price, and at least
   one image.
2. A product's status can move Draft → Pending Review → Published, and
   Published → Archived; a shopper never sees anything but Published.
3. Editing a published product does not unpublish it.
4. A product can be permanently deleted only from Draft or Archived
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

### 4. Variant SKU Generation

**Problem:** Many products aren't a single SKU — they come in sizes
and colors that each need their own SKU, price, and identity.

**In scope:**
- Marking specific attributes as variant-defining to generate a SKU
  matrix (e.g. Size × Color), each combination its own SKU with its
  own price/status

**Out of scope (narrowed 2026-08-06 — delivered under the original
broader scope, now considered a separate merchandising concern, not
core product configuration):**
- Non-variant paid options (gift wrap, engraving)
- Bundle/kit products composed of other products
- Related-product links (cross-sell, up-sell, accessory)
- Category- or brand-scoped size charts
- Per-variant stock (descoped — see "Descoped from this PRD")

**Acceptance criteria:**
1. Marking Size and Color as variant-defining generates one SKU row
   per combination, each independently identified and priced.
2. Generating variants twice with an overlapping selection doesn't
   duplicate existing SKU rows.

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

## Descoped from this PRD (2026-08-06)

These were originally scoped as Features 5, 6, 8, and 9 of this same
PRD and are numbered here for traceability with existing code
comments, `decisions.md` entries, and task-group files that cite them
by number. They are no longer part of this document's forward-looking
scope and should be planned under their own module/PRD if picked back
up.

- **5. Multi-Location Inventory** — warehouses, per-variant/per-warehouse
  stock, reservations, reorder points, backorder/preorder, lot/expiry
  tracking. **Already implemented** (Task Group 05, both repos) under
  the original scope; the code is unaffected by this descoping — see
  `slipway/reports/task-group-05/developer-report.md`. Stock display
  and purchasability now live entirely in that implementation, not in
  this PRD's Feature 2/4 acceptance criteria (trimmed above
  accordingly).
- **6. Pricing, Tax & Scheduled Sales** — tax classes, price-list
  overrides by currency/channel/customer group, quantity-tiered
  pricing, scheduled sale windows. Not yet implemented.
- **8. Localization & Reviews** — per-locale translation of product
  content; customer star ratings and written reviews with moderation.
  Not yet implemented.
- **9. Public Storefront Catalog API** — the public, tenant-scoped,
  cached read API a storefront would consume. Not yet implemented.
