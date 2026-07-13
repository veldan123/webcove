// Seeds a demo site + pages for a given user email, so the workspace preview
// can be demonstrated without calling the Anthropic API.
// Run: node --env-file=.env.local scripts/seed-demo.mjs <email>
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/seed-demo.mjs <email>");
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
const user = list.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(`No user with email ${email}`);
  process.exit(1);
}

const theme = {
  primaryColor: "#6f4e37",
  accentColor: "#c8a06a",
  backgroundColor: "#fffaf5",
  textColor: "#2b2320",
  fontFamily: "sans",
};

const slug = "brew-haven-demo-" + Math.random().toString(36).slice(2, 7);

const { data: site, error: siteErr } = await admin
  .from("sites")
  .insert({
    owner_id: user.id,
    slug,
    business_name: "Brew Haven",
    business_type: "Independent coffee shop",
    business_description:
      "A cozy neighborhood coffee shop serving specialty espresso, fresh pastries, and a warm place to work or catch up.",
    contact_info: { phone: "(555) 012-3456", email: "hello@brewhaven.test", address: "14 Maple Street, Portland" },
    generated_content: { theme },
    published: false,
  })
  .select("id")
  .single();

if (siteErr) {
  console.error("site insert error:", siteErr.message);
  process.exit(1);
}

const pages = [
  {
    site_id: site.id,
    slug: "home",
    title: "Home",
    order: 0,
    content: {
      sections: [
        { type: "hero", headline: "Your neighborhood coffee, done right.", subheadline: "Specialty espresso, fresh pastries, and a warm seat waiting for you on Maple Street.", ctaText: "See the menu" },
        { type: "features", heading: "Why Brew Haven", items: [
          { title: "Single-origin beans", description: "Roasted locally and pulled fresh for every cup." },
          { title: "Baked daily", description: "Croissants and cakes made in-house each morning." },
          { title: "Work-friendly", description: "Fast Wi-Fi, plenty of outlets, and no rush." },
        ]},
        { type: "cta", heading: "First coffee's on us", body: "Show this page on your first visit for a free house espresso.", buttonText: "Visit us today" },
      ],
    },
  },
  {
    site_id: site.id,
    slug: "about",
    title: "About",
    order: 1,
    content: {
      sections: [
        { type: "about", heading: "Our story", body: "Brew Haven started in 2019 with a simple idea: great coffee should feel like home. We source our beans from small farms, roast in small batches, and treat every regular like family." },
        { type: "testimonials", heading: "What locals say", items: [
          { quote: "The best flat white in Portland, hands down.", author: "Maya R." },
          { quote: "My second office. The baristas know my order.", author: "Devin K." },
        ]},
      ],
    },
  },
  {
    site_id: site.id,
    slug: "menu",
    title: "Menu",
    order: 2,
    content: {
      sections: [
        { type: "services", heading: "On the menu", items: [
          { title: "Espresso & Milk", description: "Espresso, cortado, flat white, latte, cappuccino." },
          { title: "Filter & Cold", description: "Pour-over, batch brew, cold brew, iced latte." },
          { title: "Bakery", description: "Croissants, banana bread, seasonal cakes, cookies." },
        ]},
      ],
    },
  },
  {
    site_id: site.id,
    slug: "contact",
    title: "Contact",
    order: 3,
    content: {
      sections: [
        { type: "contact", heading: "Come say hi", body: "Open 7am–5pm, seven days a week.", phone: "(555) 012-3456", email: "hello@brewhaven.test", address: "14 Maple Street, Portland" },
      ],
    },
  },
];

const { error: pagesErr } = await admin.from("pages").insert(pages);
if (pagesErr) {
  console.error("pages insert error:", pagesErr.message);
  await admin.from("sites").delete().eq("id", site.id);
  process.exit(1);
}

console.log("SITE_ID=" + site.id);
console.log("SLUG=" + slug);
