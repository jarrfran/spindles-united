# Club Store on Squarespace

## Install

Create a regular Squarespace page at `/store`. In a full-width section with no extra padding, add a Code Block in HTML mode containing:

```html
<div data-su="store"></div>
```

Keep the existing global Spindles loader and footer. `squarespace-store-div.html` contains the same block. Preview: `https://jarrfran.github.io/spindles-united/preview-store.html`.

`/store` was installed and verified on October 26, 2026. The homepage promo and footer now link to `/store`, and shared `ui.js` routes the desktop/mobile Squarespace header Store links there in the same tab. In Squarespace settings, the stored header URL may still read the old domain; it can also be changed to `/store` for consistency. The Shopify storefront redirect remains pending Shopify admin access.

## Commerce connection

`store-api.js` uses Shopify's **public tokenless Storefront API**, version 2026-10, at `https://spindlesunited.store/api/2026-10/graphql.json`. It needs no Admin API credentials or secret tokens. Products must be published to Shopify's Online Store to appear through this connection. The API currently returns 16 products. The catalogue is queried on each visit, individual products on opening, and the cart on opening, returning to the tab, and before checkout. No saved catalogue or invented stock is displayed on API failure.

Products, descriptions, photos, prices, options, availability, and orders remain managed in Shopify. Prices display in the store's base currency; country/address, shipping, tax, discounts, payment and final stock checks happen in Shopify checkout. Current customized kits still link to the existing Icarus club shop and use its separate checkout.

Product links use `/store?product=HANDLE`; no separate Squarespace page is needed for every product. Cart IDs are stored only in the visitor's browser under `su-shopify-cart-v1`, never in GitHub or analytics. Closing the browser does not intentionally clear the cart. Expired carts are reset when Shopify returns null; connection errors retain the cart ID and ask the shopper to retry. Checkout URLs come from Shopify and are validated before redirecting. No credit-card details are collected by the custom storefront.

## Send old storefront visitors to Squarespace

Do this **only after `/store` is installed and checkout is tested**. Keep `spindlesunited.store` connected to Shopify so its API, checkout and account URLs still work. Do not forward the entire domain at DNS/registrar level.

`shopify/storefront-redirect.liquid` is an optional theme snippet to paste immediately after `<head>` in a duplicate of the Shopify theme, then preview before publishing. It redirects theme homepage, collection, product and search views to the new storefront, preserving product handles and search queries. Cart, checkout, policies, customer accounts, order pages, API endpoints and theme preview sessions are excluded. It is a browser redirect, not a server-side 301; the underlying Shopify storefront remains present. A stricter server redirect requires additional hosting/routing work.

Keep a backup of the Shopify theme before applying the snippet. Remove it to restore the existing storefront. No Shopify theme, domain, payment or plan changes are made by publishing the GitHub code alone.

## Maintenance

The shared loader lazily loads `store.css`, `store-api.js`, and `store.js` only on the store block. The preview uses the same code and live products. Review Shopify's API version support annually and test product options, sold-out states, cart persistence, quantity changes, removal, and checkout after commerce changes.
