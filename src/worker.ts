import { Hono } from 'hono';
import { cache, pages } from 'astro/hono';
import { cf } from '@astrojs/cloudflare/hono';

// Same shape as the Cloudflare hono snippet, reduced to the cache stage.
// `astro()` would call provideCache() before handleCache(). `cache()` does not.
const app = new Hono();

app.use(cf());
app.use(cache());
app.use(pages());

export default app;
