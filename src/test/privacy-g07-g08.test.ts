// @vitest-environment node
// G-07: the privacy page must describe the shipped consent default (analytics on by default,
// ad signals never). G-08: Vercel monitoring must receive the route pattern, never a concrete
// local chart id from /edit/<id>.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { CONSENT_DEFAULTS, PUBLIC_ROUTES, vercelRoute } from "../lib/gtag";

const read = (p: string) =>
  readFileSync(resolve(__dirname, "../..", p), "utf8");
function at(pathname: string, search = "", hash = "") {
  (globalThis as unknown as Record<string, unknown>).window = {
    location: { hostname: "chartgenie.xyz", pathname, search, hash },
  };
}

it("G-08: Vercel route mapper reports /edit/$id, never the chart id", () => {
  at("/edit/k3f9a2");
  expect(vercelRoute("/edit/k3f9a2")).toBe("/edit/$id");
  at("/pie-chart-maker");
  expect(vercelRoute("/pie-chart-maker")).toBe("/pie-chart-maker");
  at("/line-graph-maker");
  expect(vercelRoute("/line-graph-maker")).toBe("/line-graph-maker");
  at("/admin");
  expect(vercelRoute("/admin")).toBeNull();
  at("/charts", "?q=1");
  expect(vercelRoute("/charts")).toBeNull();
  at("/charts");
  expect(vercelRoute("/other")).toBeNull();
  expect(read("src/components/MeasurementConsent.tsx")).toMatch(
    /route: vercelRoute/,
  );
});

it("every live tool page is an allowlisted measurement route", () => {
  for (const p of [
    "/pie-chart-maker",
    "/bar-graph-maker",
    "/line-graph-maker",
    "/convert-excel-to-chart",
  ])
    expect(PUBLIC_ROUTES as readonly string[]).toContain(p);
});

it("G-07: privacy page matches the shipped consent default", () => {
  expect(CONSENT_DEFAULTS.analytics_storage).toBe("granted");
  const page = read("public/privacy.html");
  expect(page).not.toMatch(/start denied/);
  expect(page).not.toMatch(/only after an explicit allow/);
  expect(page).toMatch(/on by default/);
  expect(page).toMatch(/Advertising signals stay denied and are never enabled/);
  expect(page).toMatch(/concrete chart ids mapped to their route pattern/);
});
