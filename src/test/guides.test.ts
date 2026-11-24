import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  routeMetadata,
  GUIDE_ROUTES,
  isPublishedRoute,
} from "../lib/routeMetadata";
import { searchContent, initialPageContent } from "../lib/searchContent";
import { SITEMAP_ENTRIES, structuredDataGraph } from "../lib/seo";
import { PUBLIC_ROUTES } from "../lib/gtag";

const GUIDES = [
  "/chart-for-linkedin-post",
  "/export-chart-as-svg",
  "/chart-maker-no-signup",
] as const;
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const bodyWords = (path: (typeof GUIDES)[number]) => {
  const c = searchContent[path];
  const sections = c.sections ?? [];
  return (
    words(c.answer) +
    sections.reduce(
      (n, s) =>
        n + words(s.heading) + s.paragraphs.reduce((m, p) => m + words(p), 0),
      0,
    )
  );
};

describe("niche guides", () => {
  it("registers exactly the three guides", () => {
    expect([...GUIDE_ROUTES]).toEqual([...GUIDES]);
    for (const g of GUIDES) expect(isPublishedRoute(g)).toBe(true);
  });

  for (const g of GUIDES) {
    describe(g, () => {
      it("has its own title, description and heading", () => {
        const m = routeMetadata[g];
        expect(m.title.length).toBeGreaterThan(20);
        expect(m.title.length).toBeLessThanOrEqual(65);
        expect(m.description.length).toBeGreaterThan(80);
        expect(m.description.length).toBeLessThanOrEqual(165);
        expect(m.heading.length).toBeGreaterThan(10);
      });

      it("carries a real guide body of 450+ words with 3 FAQs", () => {
        expect(bodyWords(g)).toBeGreaterThanOrEqual(450);
        expect(searchContent[g].questions).toHaveLength(3);
        expect(searchContent[g].sections?.length).toBeGreaterThanOrEqual(4);
      });

      it("links to its tool page and puts the body in crawler HTML", () => {
        const cta = searchContent[g].cta;
        expect(cta?.href).toMatch(/^\/[a-z-]+$/);
        expect(isPublishedRoute(cta!.href)).toBe(true);
        const html = initialPageContent(g);
        expect(html).toContain(`href="${cta!.href}"`);
        for (const s of searchContent[g].sections ?? [])
          expect(html).toContain(s.heading.replace(/&/g, "&amp;"));
      });

      it("is in the sitemap, measurement allowlist, llms.txt and Vercel rewrites", () => {
        expect(SITEMAP_ENTRIES.map((e) => e.path)).toContain(g);
        expect(PUBLIC_ROUTES as readonly string[]).toContain(g);
        expect(readFileSync("public/llms.txt", "utf8")).toContain(
          `https://chartgenie.xyz${g}`,
        );
        const rewrites = JSON.parse(
          readFileSync("vercel.json", "utf8"),
        ).rewrites;
        expect(rewrites).toContainEqual({
          source: g,
          destination: `${g}/index.html`,
        });
      });

      it("emits WebPage, FAQPage and breadcrumb JSON-LD", () => {
        const types = structuredDataGraph(g)["@graph"].map((n) => n["@type"]);
        expect(types).toContain("WebPage");
        expect(types).toContain("FAQPage");
        expect(types).toContain("BreadcrumbList");
      });
    });
  }

  it("keeps the local-processing promise: no upload claims", () => {
    for (const g of GUIDES) {
      const text = JSON.stringify(searchContent[g]).toLowerCase();
      expect(text).not.toMatch(
        /uploaded to our|we store your|our servers store/,
      );
      expect(text).toMatch(/browser/);
    }
  });

  it("does not promise XLSX import (the product copies cells or CSV only)", () => {
    const text = JSON.stringify(
      searchContent["/chart-maker-no-signup"],
    ).toLowerCase();
    expect(text).toMatch(/xlsx/);
    expect(text).toMatch(/does not import|doesn.t import|not import/);
  });
});
