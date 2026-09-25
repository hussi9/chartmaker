import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, ShieldCheck, Zap, Bot, CheckCircle2 } from 'lucide-react';

export const SeoAeoSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I generate a pie chart or bar graph with ChartGenie.xyz?',
      a: 'Simply paste your data from Excel, Google Sheets, or a CSV file directly into our Omni-Importer, or select a preset template. You can also use our AI Prompt generator to describe your data in natural language. Your chart updates in real-time instantly.'
    },
    {
      q: 'Can I export lossless vector SVG or 4K Retina PNG images for free?',
      a: 'Yes! ChartGenie allows free downloads of high-resolution Retina 2x PNGs, 4K Print 300 DPI PNGs, and scalable vector SVG files that can be edited in Figma or Adobe Illustrator without losing quality.'
    },
    {
      q: 'Is my confidential spreadsheet data secure and private?',
      a: 'javascript-side 100% client-side execution ensures your data never leaves your browser. No data is stored on remote servers or shared with third parties.'
    },
    {
      q: 'How do I embed interactive charts into my blog or web application?',
      a: 'Click "Export Chart" and select "Copy Code" under the Interactive iFrame Web Embed section. Paste the snippet directly into your WordPress, Ghost, Webflow, or HTML website.'
    },
    {
      q: 'What chart formats are supported by ChartGenie.xyz?',
      a: 'ChartGenie supports 2D Pie Charts, 3D Elevation Donuts, Vertical Bar Graphs, Horizontal Bar Charts, Stacked Bar Charts, Line Charts, Area Charts, and Radar Performance Matrices.'
    }
  ];

  // AEO & SEO JSON-LD Schemas
  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://chartgenie.xyz/#webapp',
        'url': 'https://chartgenie.xyz/',
        'name': 'ChartGenie.xyz',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'All',
        'browserRequirements': 'Requires HTML5 and JavaScript',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': '4.95',
          'reviewCount': '2840'
        },
        'description': 'Free AI-powered online chart and graph generator. Create publication-ready pie charts, bar graphs, line charts, and radar graphs with instant vector SVG and 4K Retina export.'
      },
      {
        '@type': 'HowTo',
        'name': 'How to Create a Professional Chart Online in 3 Steps',
        'description': 'Step-by-step guide to generating custom pie charts and bar graphs with vector SVG export.',
        'step': [
          {
            '@type': 'HowToStep',
            'position': 1,
            'name': 'Input Data or AI Prompt',
            'text': 'Copy and paste rows from Excel/CSV or type a natural language prompt in ChartGenie.'
          },
          {
            '@type': 'HowToStep',
            'position': 2,
            'name': 'Customize Theme & Type',
            'text': 'Select a color palette (Neon Cyber, Vercel Slate, Stripe Finance) and choose your chart type.'
          },
          {
            '@type': 'HowToStep',
            'position': 3,
            'name': 'Export Vector SVG or 4K PNG',
            'text': 'Click Export to download lossless vector SVG files or copy high-resolution PNGs to system clipboard.'
          }
        ]
      },
      {
        '@type': 'FAQPage',
        'mainEntity': faqs.map((faq) => ({
          '@type': 'Question',
          'name': faq.q,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.a
          }
        }))
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'https://chartgenie.xyz/'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Pie Chart Maker',
            'item': 'https://chartgenie.xyz/pie-chart-maker'
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': 'Bar Graph Generator',
            'item': 'https://chartgenie.xyz/bar-graph-maker'
          }
        ]
      }
    ]
  };

  return (
    <section style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border-glass)' }}>
      {/* Inject JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />

      {/* AEO (Answer Engine Optimization) Direct Answer Box */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px', borderLeft: '4px solid var(--primary-glow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Bot size={22} color="#06b6d4" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Quick Answer Summary (AI & Search Engines)
          </h3>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          <strong>ChartGenie.xyz</strong> is a free, privacy-first web application for creating customizable data visualizations (Pie Charts, Bar Graphs, Line Curves, Donut Charts, Radar Matrices) directly in the browser. It supports zero-signup data pasting from Excel/CSV, natural language AI prompts, 8 design color themes, lossless vector SVG downloads, and 4K Retina PNG exports.
        </p>
      </div>

      {/* Feature Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Zap size={26} color="#06b6d4" />
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Sub-Second Instant Engine</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Instant client-side rendering</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Sparkles size={26} color="#a855f7" />
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Vector SVG & 4K Retina</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Editable in Figma & Illustrator</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <ShieldCheck size={26} color="#10b981" />
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>100% Client Privacy</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Data stays local in browser memory</p>
          </div>
        </div>
      </div>

      {/* Structured Comparison Table for AI Search Crawlers */}
      <article className="glass-panel" style={{ padding: '28px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', color: '#f8fafc' }}>
          Comparison: ChartGenie.xyz vs Legacy Charting Tools
        </h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', color: '#94a3b8' }}>
                <th style={{ padding: '10px 12px' }}>Feature Specification</th>
                <th style={{ padding: '10px 12px' }}>ChartGenie.xyz</th>
                <th style={{ padding: '10px 12px' }}>Legacy Utilities</th>
              </tr>
            </thead>
            <tbody style={{ color: 'var(--text-muted)' }}>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>Clipboard Table Ingestion (Cmd+V)</td>
                <td style={{ padding: '10px 12px', color: '#10b981', fontWeight: 700 }}><CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Automatic</td>
                <td style={{ padding: '10px 12px' }}>Manual Typing</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>Vector SVG Export</td>
                <td style={{ padding: '10px 12px', color: '#10b981', fontWeight: 700 }}><CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Free Lossless SVG</td>
                <td style={{ padding: '10px 12px' }}>Paywalled or 72 DPI PNG</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>AI Prompt-to-Chart Generator</td>
                <td style={{ padding: '10px 12px', color: '#10b981', fontWeight: 700 }}><CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Included</td>
                <td style={{ padding: '10px 12px' }}>None</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>Data Privacy & Security</td>
                <td style={{ padding: '10px 12px', color: '#10b981', fontWeight: 700 }}><CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> 100% Client-Side</td>
                <td style={{ padding: '10px 12px' }}>Server Storage</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      {/* FAQ Accordion */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <HelpCircle size={22} color="#6366f1" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Frequently Asked Questions</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden'
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp size={18} color="#a5b4fc" /> : <ChevronDown size={18} color="#64748b" />}
              </button>
              {openFaq === idx && (
                <div style={{ padding: '0 18px 16px 18px', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
