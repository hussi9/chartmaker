import { useState } from 'react';

const faqs = [
  {
    question: 'How do I make a chart from numbers?',
    answer: 'Enter rows in the data panel, paste rows from a spreadsheet, or use Smart Parser for label and value pairs. Review the values before exporting.'
  },
  {
    question: 'What can I export?',
    answer: 'Download PNG at 1x, 2x, or 4x pixel scale, or export SVG. The SVG is generated from the chart display and may contain embedded raster content.'
  },
  {
    question: 'Where are saved charts stored?',
    answer: 'My Charts uses this browser’s local storage. Export a JSON backup if you need to keep a copy. Analytics runs on the site; chart titles, labels, values, and prompt text are not sent in analytics events.'
  },
  {
    question: 'Can I publish an interactive chart?',
    answer: 'You can copy a link containing chart state in its URL fragment or export an image. Hosted chart publishing is not available.'
  }
];

export function SeoAeoSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section className="product-info" aria-label="ChartGenie guide">
      <h2>Make a chart from your own numbers</h2>
      <p>Paste spreadsheet rows, enter values directly, or preview label and value pairs with Smart Parser. Choose a chart type and download a PNG or SVG for your post, slide, or report.</p>
      <div className="product-info-faqs">
        {faqs.map((faq, index) => (
          <div key={faq.question} className="product-info-faq">
            <button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}>{faq.question}</button>
            {openFaq === index && <p>{faq.answer}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
