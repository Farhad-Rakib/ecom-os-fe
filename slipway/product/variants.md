# Architecture Variants

| Slug | Label | Notes |
|---|---|---|
| default | Order, Cart & Checkout Management | single architecture — see slipway/product/default/tech-stack.md |
| cart-wishlist-prd | Cart & Wishlist Management | split out from `default` so Cart+Wishlist can ship independently of Checkout/Payment/Shipping/Tax — see slipway/product/cart-wishlist-prd/tech-stack.md |
| order-management-prd | Order Management | split out from `default` so the Order entity/status-lifecycle/admin views can ship independently of Checkout/Payment/Shipping/Tax — see slipway/product/order-management-prd/tech-stack.md |
| store-sync-prd | External Store Sync | new product, not a `default` split — admin control surface (connect/disconnect, status, manual sync) for the already-implemented backend sync engine — see slipway/product/store-sync-prd/tech-stack.md |
