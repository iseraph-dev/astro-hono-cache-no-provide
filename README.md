# `cache()` never calls `provideCache`

`astro@7.4.0-beta.1`, `@astrojs/cloudflare@15.0.0-beta.1` (`next` @ `3cf4719924`).

`render()` inside `handleRequest` calls `provideCache(state)` before `handleCache`. `cache()` from `astro/hono` calls `handleCache` only. `cacheCloudflare()` has `setHeaders` and `invalidate`, and no `onRequest`. `state.resolve('cache')` is `undefined`, and `applyCacheHeaders` evaluates `Symbol.for('astro:cache:apply') in undefined`.

`astro dev` runs the worker entrypoint. That entrypoint does not call `App.render`.

## Observed

`GET /` is HTTP 500. The dev log contains `TypeError: Cannot use 'in' operator to search for 'Symbol(astro:cache:apply)' in undefined`. The body is not the page HTML.

## Control

`cf()` followed by `astro()` calls `provideCache` and returns the page. The page does not call `Astro.cache`. No route rule is required. Setting the cache provider is enough.
