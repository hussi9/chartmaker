import { describe, expect, it } from "vitest";
import {
  breadcrumbItems,
  breadcrumbLd,
  buildSitemapXml,
  sharedGraphNodes,
  structuredDataGraph,
  webPageLd,
  SITE_URL,
  SITEMAP_ENTRIES,
} from "./seo";
import { routeMetadata } from "./routeMetadata";

describe("breadcrumbItems / breadcrumbLd", () => {
  it("home has no breadcrumb trail", () => {
    expect(breadcrumbItems("/")).toEqual([]);
    expect(breadcrumbLd("/")).toBeNull();
  });

  it("a tool route breadcrumbs Home > its own heading, in order", () => {
    const items = breadcrumbItems("/pie-chart-maker");
    expect(items).toEqual([
      { name: "Home", url: `${SITE_URL}/` },
      {
        name: routeMetadata["/pie-chart-maker"].heading,
        url: `${SITE_URL}/pie-chart-maker`,
      },
    ]);
  });

  it("breadcrumbLd emits a schema.org BreadcrumbList with 1-based positions", () => {
    const ld = breadcrumbLd("/bar-graph-maker") as {
      "@type": string;
      itemListElement: { position: number; name: string; item: string }[];
    };
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement).toHaveLength(2);
    expect(ld.itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${SITE_URL}/`,
    });
    expect(ld.itemListElement[1]).toMatchObject({
      "@type": "ListItem",
      position: 2,
      item: `${SITE_URL}/bar-graph-maker`,
    });
  });

  it("every non-home published route gets a distinct breadcrumb", () => {
    for (const path of Object.keys(
      routeMetadata,
    ) as (keyof typeof routeMetadata)[]) {
      if (path === "/") continue;
      expect(breadcrumbLd(path)).not.toBeNull();
    }
  });
});

describe("webPageLd", () => {
  it("identifies THIS page with its own url/@id, title and description — not the homepage", () => {
    const page = webPageLd("/convert-excel-to-chart");
    expect(page["@id"]).toBe(`${SITE_URL}/convert-excel-to-chart#webpage`);
    expect(page.url).toBe(`${SITE_URL}/convert-excel-to-chart`);
    expect(page.name).toBe(routeMetadata["/convert-excel-to-chart"].title);
    expect(page.description).toBe(
      routeMetadata["/convert-excel-to-chart"].description,
    );
    expect(page.isPartOf).toEqual({ "@id": `${SITE_URL}/#app` });
    expect(page.breadcrumb).toEqual({
      "@id": `${SITE_URL}/convert-excel-to-chart#breadcrumb`,
    });
  });

  it("the home WebPage node has no breadcrumb reference", () => {
    const page = webPageLd("/");
    expect(page.breadcrumb).toBeUndefined();
    expect(page["@id"]).toBe(`${SITE_URL}/#webpage`);
  });
});

describe("sharedGraphNodes", () => {
  it("the WebApplication and Organization nodes keep the app-wide @id/url regardless of which page asks for them", () => {
    const [app, org] = sharedGraphNodes();
    expect(app).toMatchObject({
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      url: `${SITE_URL}/`,
    });
    expect(org).toMatchObject({
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
    });
  });

  it("is identical no matter which route asked (these two nodes are meant to repeat)", () => {
    expect(sharedGraphNodes()).toEqual(sharedGraphNodes());
  });
});

describe("structuredDataGraph", () => {
  it("includes a FAQPage node on every route, since the landing renders that Q&A visibly", () => {
    for (const path of Object.keys(
      routeMetadata,
    ) as (keyof typeof routeMetadata)[]) {
      const graph = structuredDataGraph(path);
      expect(
        graph["@graph"].filter((node) => node["@type"] === "FAQPage"),
      ).toHaveLength(1);
    }
  });

  it("home graph is WebApplication + Organization + WebPage + FAQPage, no BreadcrumbList", () => {
    const graph = structuredDataGraph("/");
    const types = graph["@graph"].map((n) => n["@type"]);
    expect(types).toEqual([
      "WebApplication",
      "Organization",
      "WebPage",
      "FAQPage",
    ]);
  });

  it("a tool page graph adds its own WebPage, FAQPage and a BreadcrumbList on top of the shared nodes", () => {
    const graph = structuredDataGraph("/pie-chart-maker");
    const types = graph["@graph"].map((n) => n["@type"]);
    expect(types).toEqual([
      "WebApplication",
      "Organization",
      "WebPage",
      "FAQPage",
      "BreadcrumbList",
    ]);
  });

  it("is valid, parseable JSON via structuredDataScript for every published route", async () => {
    const { structuredDataScript } = await import("./seo");
    for (const path of Object.keys(
      routeMetadata,
    ) as (keyof typeof routeMetadata)[]) {
      expect(() => JSON.parse(structuredDataScript(path))).not.toThrow();
    }
  });
});

describe("buildSitemapXml", () => {
  it("falls back to today when a route has no known lastmod", () => {
    const xml = buildSitemapXml({}, "2026-09-27");
    expect(xml).toContain("<lastmod>2026-09-27</lastmod>");
    expect((xml.match(/<lastmod>2026-09-27<\/lastmod>/g) ?? []).length).toBe(SITEMAP_ENTRIES.length);
  });

  it("uses a real per-route lastmod when one is given", () => {
    const xml = buildSitemapXml(
      { "/pie-chart-maker": "2026-09-10" },
      "2026-09-27",
    );
    expect(xml).toContain(
      "<loc>https://chartgenie.xyz/pie-chart-maker</loc>\n    <lastmod>2026-09-10</lastmod>",
    );
    // every other route still falls back to today
    expect((xml.match(/<lastmod>2026-09-27<\/lastmod>/g) ?? []).length).toBe(SITEMAP_ENTRIES.length - 1);
  });

  it("ignores a malformed lastmod (defends against a bad git date) rather than emitting invalid XML content", () => {
    const xml = buildSitemapXml({ "/": "not-a-date" }, "2026-09-27");
    expect(xml).toContain(
      "<loc>https://chartgenie.xyz/</loc>\n    <lastmod>2026-09-27</lastmod>",
    );
  });

  it("lists every published route (5 pages and 3 guides) with the original priorities for the pages", () => {
    const xml = buildSitemapXml({}, "2026-09-27");
    expect(xml).toContain(
      "<loc>https://chartgenie.xyz/</loc>\n    <lastmod>2026-09-27</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>",
    );
    expect(xml).toContain(
      "<changefreq>weekly</changefreq>\n    <priority>0.9</priority>",
    );
    expect(xml).toContain("<priority>0.8</priority>");
    expect(xml).toContain("<changefreq>monthly</changefreq>\n    <priority>0.7</priority>");
    expect(xml.match(/<url>/g)).toHaveLength(8);
    expect(xml.match(/<url>/g)).toHaveLength(Object.keys(routeMetadata).length);
  });

  it("is well-formed enough to parse as XML", () => {
    const xml = buildSitemapXml({}, "2026-09-27");
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.querySelectorAll("url")).toHaveLength(8);
  });
});

describe("faqLd matches the visible Q&A", () => {
  it("mirrors the same questions and answers the landing renders, on every published route", async () => {
    const { searchContent } = await import("./searchContent");
    const { faqLd } = await import("./seo");
    for (const path of Object.keys(
      routeMetadata,
    ) as (keyof typeof routeMetadata)[]) {
      const faq = faqLd(path) as {
        "@type": string;
        mainEntity: { name: string; acceptedAnswer: { text: string } }[];
      };
      expect(faq["@type"]).toBe("FAQPage");
      expect(
        faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]),
      ).toEqual(
        searchContent[path].questions.map(({ question, answer }) => [
          question,
          answer,
        ]),
      );
    }
  });

  it("is included in the structured-data graph", () => {
    const types = structuredDataGraph("/line-graph-maker")["@graph"].map(
      (n) => n["@type"],
    );
    expect(types).toContain("FAQPage");
  });
});
