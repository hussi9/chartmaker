// Long-form how-to guides. Every claim here is something the app does today
// (sizes, crop overlays, post-ready checks, export set, autosave, no XLSX import);
// change the product and this text together, and keep the local-processing promise true.
export interface GuideSection {
  heading: string;
  paragraphs: string[];
}
export interface GuideContent {
  answer: string;
  sections: GuideSection[];
  cta: { href: string; label: string };
  questions: { question: string; answer: string }[];
}

export const GUIDE_CONTENT = {
  "/chart-for-linkedin-post": {
    answer:
      "To make a chart for a LinkedIn post, put your numbers into ChartGenie, choose the square 1080 by 1080 size, fix anything the post-ready checks flag, and export a PNG. Add the alt text and caption from the export set when you post. Everything runs in your browser and no account is needed.",
    cta: { href: "/bar-graph-maker", label: "Start with a bar graph" },
    sections: [
      {
        heading: "Pick the size before you design anything",
        paragraphs: [
          "A chart that looks fine on a laptop can fall apart in a phone feed, so choose the post size first. ChartGenie has four: 16:9 for X and the web at 1600 by 900, 1:1 for LinkedIn at 1080 by 1080, 9:16 for Stories at 1080 by 1920, and 4:3 for slides at 1600 by 1200.",
          "For a LinkedIn feed post, start with the 1:1 square. It uses more of a phone screen than a wide image and it is not trimmed. The 16:9 size also shows whole. The tall 9:16 size is the one to avoid for a feed post: the crop overlay in ChartGenie marks roughly the top and bottom 15% of it as an area that can be cut off, based on LinkedIn’s own help page on image sizes.",
        ],
      },
      {
        heading: "Start from your numbers",
        paragraphs: [
          "Copy two columns from Excel, Google Sheets or Numbers, a label column and a number column, and paste them into the Paste numbers box. ChartGenie shows the rows it detected and the unit it found (plain number, percent, dollars, or thousands and millions) so you can correct a misread before anything is drawn. You can also type a sentence such as “Revenue grew from 12k in January to 34k in June”, or drop a CSV file.",
          "Then look at the three suggested chart looks. They are ranked from the shape of your data: dates suggest a line, parts of a whole suggest a donut, two values suggest a before-and-after. Pick the one that makes your single point obvious. A LinkedIn chart works best when it says one thing, so state that thing in the title, for example “Support tickets fell 38% in six months”, rather than a label such as “Tickets”.",
        ],
      },
      {
        heading: "Make it readable at phone size",
        paragraphs: [
          "Most people will see your chart as a thumbnail. ChartGenie runs post-ready checks on the chart as it is drawn: whether label text has enough contrast against its background, whether the smallest text is still legible at the smallest export, whether anything sits inside a platform crop zone, and whether alt text is present. Fix every flag before you export.",
          "Three habits help more than any setting. Keep to about six categories or fewer. Shorten labels until they fit on one line. Remove gridlines and legends you do not need, and write values directly on the bars or slices.",
        ],
      },
      {
        heading: "Write the alt text and the caption",
        paragraphs: [
          "Alt text describes the chart for people using a screen reader, and it is also a good test of whether your point is clear. State the type of chart, what it compares and the main result. ChartGenie drafts alt text from your data, checks that it is present, and includes it as alt-text.txt in the export set, so you can edit it and paste it in.",
          "The caption is drafted on your device from facts computed out of your rows (the largest value, a share, a change over time) in three tones, and you can edit it freely. If your browser includes a built-in language model, ChartGenie can use it to reword the caption, still without sending anything to a server.",
        ],
      },
      {
        heading: "Export and post",
        paragraphs: [
          "Export a PNG for the post. PNG files are rendered at twice the nominal size by default, so lines and text stay sharp. If you want everything at once, use the export set: one click renders PNG and SVG for every size you choose and adds caption.txt and alt-text.txt in a zip. In LinkedIn, attach the PNG, paste the alt text into the image’s alt text field and paste your caption into the post.",
          "Your chart is autosaved in this browser, so next month you can open it, replace the numbers and export again. The Series feature is built for this: it asks for next period’s values and shows last period faded behind them.",
        ],
      },
    ],
    questions: [
      {
        question: "What size should a LinkedIn chart image be?",
        answer:
          "Use the 1:1 square at 1080 by 1080 pixels. The 16:9 landscape size also shows whole in the feed. Avoid tall 9:16 images for feed posts because the top and bottom can be cropped.",
      },
      {
        question: "Should I export a LinkedIn chart as PNG or SVG?",
        answer:
          "Export PNG for the post, because social feeds generally accept raster images rather than SVG. Keep the SVG for slides, print or editing in a design tool.",
      },
      {
        question: "Do I need an account to make a chart for LinkedIn?",
        answer:
          "No. You can paste numbers, build the chart and export the PNG, alt text and caption without signing in. Charts are saved in your own browser, so export a JSON backup if you want to keep them elsewhere.",
      },
    ],
  },
  "/export-chart-as-svg": {
    answer:
      "To export a chart as SVG in ChartGenie, build the chart from your numbers, choose a size, open Export and pick SVG. The file is a real vector graphic with the fonts embedded, so it stays sharp at any size and looks the same on a computer without those fonts. Everything is generated in your browser.",
    cta: { href: "/line-graph-maker", label: "Start with a line graph" },
    sections: [
      {
        heading: "What is inside the SVG file",
        paragraphs: [
          "SVG stands for scalable vector graphics. Instead of a grid of pixels, the file describes the chart as shapes and text, so you can make it as small as a thumbnail or as large as a poster without blur. A ChartGenie SVG is built that way directly from your chart, not a pixel image wrapped in an SVG tag.",
          "The three typefaces ChartGenie uses for charts (Bricolage Grotesque, Geist and Geist Mono) are embedded in the file. That matters because a plain SVG that points at a font name falls back to whatever the viewer has installed, and the labels change shape. With the fonts embedded, the chart looks the same on a colleague’s laptop and in a printer’s software.",
        ],
      },
      {
        heading: "When SVG is the better choice",
        paragraphs: [
          "Choose SVG when the chart will be resized or reused: slides that will be projected, a report or poster that will be printed, a page on your own website, or a design file where you want to change a colour or move a label. Design tools such as Figma, Illustrator and Inkscape open SVG files, and so do web browsers.",
          "A vector file is also compact for a simple chart, which helps when you embed it in a page, and you can recolour or restyle it in a design tool without redrawing it.",
        ],
      },
      {
        heading: "When PNG is the better choice",
        paragraphs: [
          "Choose PNG for a social post or any place that expects a picture file. Social networks generally take PNG or JPEG images rather than SVG, and many email programs do not display SVG at all. ChartGenie renders PNG at twice the nominal size by default so a post looks crisp on high-density screens.",
          "If you are not sure, export both. The export set renders PNG and SVG for every size you pick and puts them in one zip with a caption file and an alt-text file.",
        ],
      },
      {
        heading: "How to export, step by step",
        paragraphs: [
          "Paste or type your numbers and check the detected rows. Choose a chart look, then choose the post size, because the size sets the shape of the drawing area. Open Export, choose SVG and download the file. No sign-in is needed and nothing is uploaded: the file is produced on your device.",
          "To change the chart afterwards, go back to the editor, edit the rows or the look, and export again. Charts are autosaved in this browser, so you can return to the same chart later.",
        ],
      },
      {
        heading: "Check the file before you send it",
        paragraphs: [
          "Open the downloaded SVG in a browser tab to confirm the labels and colours, then drop it into your slide or design file. If you are placing it on a slide, scale it by dragging a corner so the proportions stay fixed. If a program refuses the file, export a PNG instead and keep the SVG for tools that accept it.",
        ],
      },
    ],
    questions: [
      {
        question: "Is the SVG a real vector file?",
        answer:
          "Yes. ChartGenie draws the chart as vector shapes and text, and embeds its three fonts in the file, so it scales without blur and keeps its typefaces on other computers.",
      },
      {
        question: "Can I upload an SVG chart to LinkedIn or Instagram?",
        answer:
          "Social feeds generally want PNG or JPEG rather than SVG. Export a PNG for the post and keep the SVG for slides, print and design tools.",
      },
      {
        question: "Is my chart sent to a server when I export?",
        answer:
          "No. The SVG is produced in your browser from the chart you are editing. Your charts are saved in this browser and nothing is stored on a ChartGenie server.",
      },
    ],
  },
  "/chart-maker-no-signup": {
    answer:
      "ChartGenie is a chart maker you can use without an account. Paste numbers or a CSV, check the detected rows, choose a chart look and download a PNG or SVG. Your charts are saved in your own browser, so there is nothing to log in to, and you can export a JSON backup to keep them elsewhere.",
    cta: {
      href: "/convert-excel-to-chart",
      label: "Paste rows from a spreadsheet",
    },
    sections: [
      {
        heading: "What no signup means here",
        paragraphs: [
          "You do not create an account, confirm an email or log in to make a chart or to download it. The editor and every chart look are open as soon as the page loads, and the exported PNG or SVG file is yours to use.",
          "The trade-off is that your work lives in the browser you used. That is a design choice rather than a limit: because charts are saved on your own device, there is no server copy of your numbers.",
        ],
      },
      {
        heading: "From numbers to chart in three moves",
        paragraphs: [
          "First, get the numbers in. Copy a label column and a number column from Excel, Google Sheets or Numbers and paste them into the Paste numbers box, type a sentence such as “USA 87, Italy 20”, or drop a CSV file onto the page. You can also add a photo of a printed table; the picture is read on your device and is never sent anywhere.",
          "Second, check what was detected. ChartGenie lists the rows it found, with the unit it recognised (plain numbers, percent, dollars, or thousands and millions), and lets you correct a row before charting. Third, pick one of the three suggested looks or any of the 19 chart looks, then export PNG or SVG at the post size you need.",
        ],
      },
      {
        heading: "Where your chart is saved",
        paragraphs: [
          "Charts are autosaved in this browser as you edit, and the My charts page lists them with thumbnails. That storage belongs to the browser profile. It will not follow you to another device, and it is cleared if you clear site data or use a private window.",
          "To keep a chart safe, export a JSON backup from the app and restore it later, on the same or another computer. For anything important, also keep the exported PNG or SVG file.",
        ],
      },
      {
        heading: "Sharing without an account",
        paragraphs: [
          "A share link carries the whole chart inside the link, so you can send it to someone who has no account either. A preview card is drawn when the link is requested and nothing is stored on a server. A Remix with your numbers button opens the same look with blank values, so the person who gets the link can build their own version.",
        ],
      },
      {
        heading: "What it does not do",
        paragraphs: [
          "ChartGenie does not import XLSX workbooks, formulas or multiple sheets: copy the cells you want, or export a CSV, from your spreadsheet. A pasted chart is a snapshot and does not update when the spreadsheet changes. There is no shared team workspace, because the chart lives in one browser. If you need those things, a spreadsheet’s own chart tool or a team product is a better fit; if you want a clean image of a few numbers quickly, this is built for that.",
        ],
      },
    ],
    questions: [
      {
        question: "Do I need an account to download my chart?",
        answer:
          "No. You can build a chart and download the PNG or SVG without signing in. Charts are saved in your browser, so export a JSON backup if you want to keep them elsewhere.",
      },
      {
        question: "Where are my charts stored if there is no account?",
        answer:
          "In your own browser, on your own device. They do not follow you to another device and are removed if you clear site data, so keep a JSON backup or the exported image.",
      },
      {
        question: "Can I upload an Excel workbook?",
        answer:
          "ChartGenie does not import XLSX workbooks. Copy the cells from the sheet and paste them in, or export a CSV and drop the file onto the page.",
      },
    ],
  },
} satisfies Record<string, GuideContent>;
