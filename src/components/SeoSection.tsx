import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export const SeoSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I generate a pie chart or bar graph with ChartGenie.xyz?',
      a: 'Simply paste your data from Excel, Google Sheets, or a CSV file directly into our Omni-Importer, or select a preset template. You can also use our AI Prompt generator to describe your data in natural language. Your chart updates in real-time instantly.'
    },
    {
      q: 'Can I export lossless vector SVG or 4K Retina PNG images?',
      a: 'Yes! ChartGenie allows free downloads of high-resolution Retina 2x PNGs, 4K Print 300 DPI PNGs, and scalable vector SVG files that can be edited in Figma or Adobe Illustrator without losing quality.'
    },
    {
      q: 'Is my data secure and private?',
      a: 'Absolutely. All chart rendering and data parsing happen 100% locally in your web browser. Your confidential spreadsheet data never leaves your device or gets saved on external servers.'
    },
    {
      q: 'How do I embed interactive charts into my blog or website?',
      a: 'Click the "Export Chart" button in the top navigation bar and select "Copy Code" under the Interactive iFrame Web Embed section. Paste the snippet into your HTML or CMS editor.'
    }
  ];

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        'name': 'ChartGenie.xyz',
        'operatingSystem': 'All',
        'applicationCategory': 'BusinessApplication',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': '4.9',
          'reviewCount': '1420'
        },
        'description': 'Free AI-powered online chart and graph generator. Create publication-ready pie charts, bar graphs, and line charts with instant vector SVG export.'
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
      }
    ]
  };

  return (
    <section style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border-glass)' }}>
      {/* Inject JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Trust Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '36px' }}>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Zap size={24} color="#06b6d4" />
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Sub-Second Speed</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Instant rendering without signup</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sparkles size={24} color="#a855f7" />
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Vector SVG & Retina 4K</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Publication-quality exports</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={24} color="#10b981" />
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>100% Client-Side Privacy</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Your data stays on your device</p>
          </div>
        </div>
      </div>

      {/* SEO Article */}
      <article className="glass-panel" style={{ padding: '28px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: '#f8fafc' }}>
          The Next-Generation Online Chart & Graph Generator
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '14px' }}>
          ChartGenie.xyz is a free, web-based data visualization suite designed for students, business analysts, researchers, and content creators. Whether you need a quick pie chart for a presentation, a stacked bar graph for a sales report, or a smooth line chart for an academic paper, ChartGenie delivers publication-ready visual assets in seconds.
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Unlike traditional charting tools that require complex software installations or account registration, ChartGenie features zero-friction clipboard importing and AI-assisted data formatting. Simply copy rows from Google Sheets or Excel and paste them directly to generate interactive visuals with customizable color palettes, 3D elevation effects, and scalable vector SVG exports.
        </p>
      </article>

      {/* FAQ Accordion */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <HelpCircle size={22} color="#6366f1" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Frequently Asked Questions</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                  fontSize: '0.9rem',
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
                <div style={{ padding: '0 18px 16px 18px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
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
