// One-time Stripe setup: creates the three subscription products/prices and a
// production webhook endpoint, then prints the env values to add.
// Run: node --env-file=.env.local scripts/stripe-setup.mjs
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const BASE = "https://www.webcove.io";

const PLANS = [
  { key: "BASIC", name: "Webcove Basic", price: 1500 },
  { key: "PRO", name: "Webcove Pro", price: 2500 },
  { key: "AGENCY", name: "Webcove Agency", price: 8000 },
];

const out = {};

// Reuse existing products (by name) so re-running doesn't duplicate.
const existing = await stripe.products.list({ limit: 100, active: true });

for (const p of PLANS) {
  let product = existing.data.find((x) => x.name === p.name);
  if (!product) {
    product = await stripe.products.create({ name: p.name });
  }
  // Reuse a matching recurring price if one already exists.
  const prices = await stripe.prices.list({ product: product.id, limit: 100 });
  let price = prices.data.find(
    (x) =>
      x.active &&
      x.unit_amount === p.price &&
      x.recurring?.interval === "month" &&
      x.currency === "usd"
  );
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: p.price,
      currency: "usd",
      recurring: { interval: "month" },
    });
  }
  out[`STRIPE_PRICE_${p.key}`] = price.id;
  console.log(`${p.name}: ${price.id}`);
}

// Create (or reuse) the production webhook endpoint.
const url = `${BASE}/api/webhooks/stripe`;
const hooks = await stripe.webhookEndpoints.list({ limit: 100 });
let hook = hooks.data.find((h) => h.url === url);
const events = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
];
if (!hook) {
  hook = await stripe.webhookEndpoints.create({ url, enabled_events: events });
  out.STRIPE_WEBHOOK_SECRET = hook.secret; // only returned on creation
  console.log(`Webhook created: ${hook.id}`);
} else {
  console.log(`Webhook already exists: ${hook.id} (secret not re-shown)`);
}

console.log("\n--- ENV VALUES ---");
for (const [k, v] of Object.entries(out)) console.log(`${k}=${v}`);
