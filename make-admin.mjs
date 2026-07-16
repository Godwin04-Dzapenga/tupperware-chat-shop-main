/**
 * make-admin.mjs
 * Run this once to grant admin role to your account.
 * Usage:  node make-admin.mjs your@email.com
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ueujzbxagqboqleuvvmz.supabase.co";

// ⚠️  Paste your Supabase SERVICE ROLE key below (Settings → API → service_role).
//    This key is secret — never commit it. Delete this file after running.
const SERVICE_ROLE_KEY = "PASTE_YOUR_SERVICE_ROLE_KEY_HERE";

const email = process.argv[2];

if (!email) {
  console.error("❌  Usage: node make-admin.mjs your@email.com");
  process.exit(1);
}

if (SERVICE_ROLE_KEY === "PASTE_YOUR_SERVICE_ROLE_KEY_HERE") {
  console.error(
    "❌  Please open make-admin.mjs and paste your Supabase SERVICE ROLE key.\n" +
    "   Find it at: https://supabase.com/dashboard/project/ueujzbxagqboqleuvvmz/settings/api"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log(`\n🔍  Looking up user: ${email} …`);

  // Find the user by email using admin API
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) { console.error("❌  Error listing users:", listErr.message); process.exit(1); }

  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(`❌  No account found for ${email}. Make sure you have signed up first.`);
    process.exit(1);
  }

  console.log(`✅  Found user: ${user.email} (ID: ${user.id})`);
  console.log(`🔧  Granting admin role …`);

  // Insert into user_roles using service role (bypasses RLS)
  const { error: insertErr } = await supabase
    .from("user_roles")
    .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });

  if (insertErr) {
    console.error("❌  Failed to grant admin:", insertErr.message);
    process.exit(1);
  }

  console.log(`\n🎉  Success! ${email} is now an admin.`);
  console.log(`   Sign out and sign back in, then visit /admin.\n`);
}

run().catch((err) => { console.error("Unexpected error:", err); process.exit(1); });
