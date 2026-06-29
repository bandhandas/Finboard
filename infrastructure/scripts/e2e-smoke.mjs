#!/usr/bin/env node
/**
 * E2E smoke test — requires running stack (pnpm dev or docker compose).
 * Flow: health → signup → signin → profile
 */
const gateway = process.env.GATEWAY_URL || "http://127.0.0.1:4000";
const phone = `+9199${Date.now().toString().slice(-8)}`;
const email = `e2e-${Date.now()}@finboard.test`;
const password = "Password@123";

async function request(path, options = {}) {
  const response = await fetch(`${gateway}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log(`E2E smoke against ${gateway}`);

  const health = await request("/health");
  assert(health.status === 200, `Gateway health failed: ${health.status}`);
  console.log("✓ Gateway health");

  const signup = await request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E User",
      email,
      phone,
      password
    })
  });
  assert(signup.status === 201, `Signup failed: ${signup.status} ${JSON.stringify(signup.body)}`);
  console.log("✓ Signup");

  const signin = await request("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({ phone, password })
  });
  assert(signin.status === 200, `Signin failed: ${signin.status}`);
  const token = signin.body.token;
  assert(token, "Missing auth token");
  console.log("✓ Signin");

  const profile = await request("/api/profile/me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert(profile.status === 200, `Profile failed: ${profile.status}`);
  console.log("✓ Profile");

  console.log("\nE2E smoke passed.");
}

main().catch((error) => {
  console.error("\nE2E smoke failed:", error.message);
  process.exit(1);
});
