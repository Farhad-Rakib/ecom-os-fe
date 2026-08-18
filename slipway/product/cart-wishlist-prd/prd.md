# Cart & Wishlist Management: Product Requirements

## Problem

Shoppers need two related but distinct ways to hold onto products
before buying: a **Cart** (what they intend to purchase right now) and
a **Wishlist** (what they're interested in for later, with no purchase
intent yet). Neither exists on the platform today.

## Target users

End customers (shoppers) on a tenant's storefront — **not this repo's
scope**; see the new, separate Next.js storefront application
(mirrored from the `default` variant's own scope split).

## Why this approach

Mirrored from `ecom-os-be`'s PRD for this variant — see that repo's
`prd.md` for the full reasoning, including the deliberately unresolved
overlap with the `default` variant's Feature 3 (Shopping Cart). This
repo (`ecom-os-fe`, the authenticated admin back-office) has **no
scope at all** in this variant: both Cart and Wishlist are
product-wide excluded from having any admin UI, and every
customer-facing surface belongs to the not-yet-created storefront
application instead.

## Out of scope (product-wide)

Same as `ecom-os-be`'s PRD for this variant — see that repo. This repo
additionally has zero scope for either feature.

## Features

### 1. Shopping Cart

**In scope (this repo):** None.

**Acceptance criteria:** N/A for this repo.

### 2. Wishlist

**In scope (this repo):** None.

**Acceptance criteria:** N/A for this repo.
