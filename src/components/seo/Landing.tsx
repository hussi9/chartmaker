// The three search landings: real copy, a live example of that look, one way in.
import { useEffect } from "react";
import { Link, useNavigate, type LinkProps } from "@tanstack/react-router";
import { useTopBar } from "../shell/TopBar";
import { useDoc } from "../../store/document";
import { Chart } from "../../chart/render/Chart";
import { PLOTS } from "../../chart/plots";
import { CHART_TYPES, defaultSpec, type ChartType } from "../../chart/types";
import { routeMetadata, GUIDE_ROUTES, type PublishedRoute } from "../../lib/routeMetadata";
import { searchContent } from "../../lib/searchContent";
import { Button } from "../common/Button";

const to = (p: string) => p as LinkProps["to"];

// The other published tool pages, for a small cross-links row on each one
// (internal linking between the SEO landing pages — none existed before).
// Copy is reused verbatim from routeMetadata; nothing new is written here.
const TOOL_ROUTES: PublishedRoute[] = [
  "/pie-chart-maker",
  "/bar-graph-maker",
  "/line-graph-maker",
  "/convert-excel-to-chart",
];

export interface LandingProps {
  route: PublishedRoute;
  type: ChartType;
  steps: string[];
  intakeFirst?: boolean;
}

export function Landing({
  route,
  type,
  steps,
  intakeFirst,
}: LandingProps): React.JSX.Element {
  const navigate = useNavigate();
  const meta = routeMetadata[route];
  const def = PLOTS[type];
  const example = defaultSpec({
    type,
    data: def.sample.map((r) => ({ ...r })),
    text: { title: def.name, subtitle: def.blurb, source: "sample data" },
  });

  useEffect(() => {
    useTopBar.getState().set({ crumb: meta.heading });
    return () => useTopBar.getState().set({ crumb: undefined });
  }, [meta.heading]);

  const start = () => {
    if (intakeFirst) {
      void navigate({ to: to("/new") } as never);
      return;
    }
    const id = useDoc.getState().newDoc({
      type,
      data: def.sample.map((r) => ({ ...r })),
      text: { title: def.name, source: "sample data" },
    });
    void navigate({ to: to("/edit/$id"), params: { id } } as never);
  };

  return (
    <div className="cg-page cg-landing">
      <span className="cg-lbl">
        ChartGenie · free, no account, saved in this browser
      </span>
      <h1 className="cg-h1" style={{ fontSize: 40, maxWidth: "20ch" }}>
        {meta.heading}
      </h1>
      <p className="cg-landing-lead">{meta.description}</p>
      <div className="cg-landing-grid">
        <div
          className="cg-card cg-landing-example"
          aria-label={`Example ${def.name.toLowerCase()}`}
        >
          <Chart spec={example} static />
          <div className="cg-lookcard-foot">
            <span className="cg-mono cg-hint">
              {def.name.toLowerCase()} · sample data
            </span>
            <Button variant="primary" size="sm" onClick={start}>
              {intakeFirst ? "Paste your rows" : "Start with this chart"}
            </Button>
          </div>
        </div>
        <ol className="cg-landing-steps">
          {steps.map((s, i) => (
            <li key={i}>
              <span className="cg-landing-step-n">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
      {(searchContent[route].sections ?? []).length > 0 ? (
        <article
          aria-label="Guide"
          className="cg-landing-guide"
          style={{ marginTop: 24, display: "grid", gap: 20, maxWidth: "70ch" }}
        >
          {searchContent[route].sections!.map(({ heading, paragraphs }) => (
            <section key={heading}>
              <h2 style={{ fontSize: 22, margin: "0 0 8px" }}>{heading}</h2>
              {paragraphs.map((p) => (
                <p key={p} style={{ margin: "0 0 10px" }}>
                  {p}
                </p>
              ))}
            </section>
          ))}
          {searchContent[route].cta ? (
            <Link to={to(searchContent[route].cta!.href)} className="cg-linkbtn">
              {searchContent[route].cta!.label} →
            </Link>
          ) : null}
        </article>
      ) : null}
      <p className="cg-hint" style={{ fontSize: 13 }}>
        {CHART_TYPES.length} chart looks, four post sizes (X, LinkedIn, Story,
        Deck), PNG and SVG export, and a share link that unfurls as a card.
        Everything runs in your browser; charts are autosaved in this browser.
      </p>
      <section
        aria-label="Chart questions"
        className="cg-landing-faq"
        style={{ marginTop: 24, display: "grid", gap: 16, maxWidth: "70ch" }}
      >
        {searchContent[route].questions.map(({ question, answer }) => (
          <div key={question}>
            <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>{question}</h2>
            <p style={{ margin: 0 }}>{answer}</p>
          </div>
        ))}
      </section>
      <Link to={to("/?templates=1")} className="cg-linkbtn">
        See every look →
      </Link>
      {(() => {
        const otherTools = TOOL_ROUTES.filter((r) => r !== route);
        return otherTools.length > 0 ? (
          <nav className="cg-landing-related" aria-label="Other chart tools">
            <span className="cg-lbl">Also on ChartGenie</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {otherTools.map((r) => (
                <Link key={r} to={to(r)} className="cg-linkbtn">
                  {routeMetadata[r].heading} →
                </Link>
              ))}
            </div>
          </nav>
        ) : null;
      })()}
      {(() => {
        const guides = GUIDE_ROUTES.filter((r) => r !== route);
        return (
          <nav className="cg-landing-related" aria-label="ChartGenie guides">
            <span className="cg-lbl">Guides</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {guides.map((r) => (
                <Link key={r} to={to(r)} className="cg-linkbtn">
                  {routeMetadata[r].heading} →
                </Link>
              ))}
            </div>
          </nav>
        );
      })()}
    </div>
  );
}
