const fs = require("fs");
const path = require("path");
const MarkdownIt = require("markdown-it");
const puppeteer = require("puppeteer");

const CHAPTERS_DIR = path.join(__dirname, "chapters");
const OUTPUT_DIR = path.join(__dirname, "pdfs");
const MERMAID_PATH = require.resolve("mermaid/dist/mermaid.min.js");
const BACKGROUND_PATH = path.join(
  __dirname,
  "assets",
  "diagram-hospital-watermark.jpg",
);
const BACKGROUND_DATA_URL = `data:image/jpeg;base64,${fs
  .readFileSync(BACKGROUND_PATH)
  .toString("base64")}`;

const CHAPTERS = [
  { file: "chapter-3-system-analysis-design.md", title: "Chapter 3: System Analysis & Design" },
  { file: "chapter-4-implementation.md", title: "Chapter 4: Implementation" },
  { file: "chapter-5-testing-evaluation.md", title: "Chapter 5: Testing & Evaluation" },
  { file: "chapter-6-conclusion-recommendations.md", title: "Chapter 6: Conclusion & Recommendations" },
];

const CSS = `
  @page {
    margin: 25mm 20mm 25mm 20mm;
    @bottom-center {
      content: counter(page);
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 10px;
      color: #666;
    }
  }
  body {
    font-family: 'Segoe UI', 'Calibri', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a2e;
    max-width: 100%;
  }
  h1 {
    font-size: 22pt;
    color: #0f4c5c;
    border-bottom: 3px solid #0f4c5c;
    padding-bottom: 8px;
    page-break-before: always;
  }
  h1:first-of-type {
    page-break-before: avoid;
  }
  h2 {
    font-size: 16pt;
    color: #0f4c5c;
    margin-top: 24px;
    border-bottom: 1px solid #ccc;
    padding-bottom: 4px;
  }
  h3 {
    font-size: 13pt;
    color: #1a6985;
    margin-top: 18px;
  }
  h4 {
    font-size: 11pt;
    color: #333;
    margin-top: 14px;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    font-size: 9.5pt;
    page-break-inside: auto;
  }
  th {
    background-color: #0f4c5c;
    color: white;
    padding: 8px 10px;
    text-align: left;
    border: 1px solid #0f4c5c;
  }
  td {
    padding: 6px 10px;
    border: 1px solid #ddd;
    vertical-align: top;
  }
  tr:nth-child(even) {
    background-color: #f8f9fa;
  }
  tr {
    page-break-inside: avoid;
  }
  code {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 9.5pt;
    background-color: #f0f0f0;
    padding: 2px 5px;
    border-radius: 3px;
    color: #c0392b;
  }
  pre {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 12px;
    overflow-x: auto;
    page-break-inside: avoid;
  }
  pre code {
    background-color: transparent;
    padding: 0;
    color: #333;
  }
  blockquote {
    border-left: 4px solid #0f4c5c;
    margin: 12px 0;
    padding: 8px 16px;
    background-color: #f8f9fa;
    color: #555;
  }
  a {
    color: #1a6985;
    text-decoration: none;
  }
  ul, ol {
    padding-left: 24px;
  }
  li {
    margin-bottom: 4px;
  }
  hr {
    border: none;
    border-top: 1px solid #ccc;
    margin: 20px 0;
  }
  .mermaid {
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 90mm;
    max-height: 238mm;
    overflow: hidden;
    text-align: center;
    margin: 14px 0 20px;
    padding: 9mm 7mm;
    border: 1px solid #b8d8df;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.92);
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .mermaid::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: url("${BACKGROUND_DATA_URL}") center / cover no-repeat;
    opacity: 0.075;
    filter: grayscale(18%) saturate(0.75);
  }
  .mermaid svg {
    max-width: 100%;
    max-height: 220mm;
    width: auto;
    height: auto !important;
    display: block;
  }
`;

function buildHtml(mdContent, title) {
  const md = new MarkdownIt({
    html: true,
    breaks: false,
    linkify: true,
  });

  const defaultFence = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, index, options, env, renderer) => {
    const token = tokens[index];
    const language = token.info.trim().split(/\s+/)[0];

    if (language === "mermaid") {
      return `<div class="mermaid">${md.utils.escapeHtml(token.content)}</div>`;
    }

    return defaultFence(tokens, index, options, env, renderer);
  };

  let html = md.render(mdContent);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${CSS}</style>
</head>
<body>
${html}
</body>
</html>`;
}

async function generatePdfs() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  for (const chapter of CHAPTERS) {
    const mdPath = path.join(CHAPTERS_DIR, chapter.file);
    if (!fs.existsSync(mdPath)) {
      console.warn(`  SKIP: ${chapter.file} not found`);
      continue;
    }

    console.log(`Processing: ${chapter.title}`);
    const mdContent = fs.readFileSync(mdPath, "utf8");
    const html = buildHtml(mdContent, chapter.title);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 120000 });

    const mermaidCount = await page.$$eval(".mermaid", (nodes) => nodes.length);
    if (mermaidCount) {
      await page.addScriptTag({ path: MERMAID_PATH });
      await page.evaluate(async () => {
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "loose",
          themeVariables: {
            background: "#ffffff",
            primaryColor: "#e7f8f7",
            primaryTextColor: "#123247",
            primaryBorderColor: "#0f8f95",
            secondaryColor: "#edf5ff",
            secondaryTextColor: "#123247",
            secondaryBorderColor: "#2f78c4",
            tertiaryColor: "#f8fafc",
            tertiaryTextColor: "#123247",
            tertiaryBorderColor: "#94a3b8",
            lineColor: "#45647a",
            textColor: "#123247",
            mainBkg: "#e7f8f7",
            nodeBorder: "#0f8f95",
            clusterBkg: "#f8fbfd",
            clusterBorder: "#a8c7d5",
            actorBkg: "#e7f8f7",
            actorBorder: "#0f8f95",
            actorTextColor: "#123247",
            signalColor: "#164e63",
            signalTextColor: "#123247",
            noteBkgColor: "#fff8dd",
            noteBorderColor: "#d4a72c",
            noteTextColor: "#473b14",
            fontFamily: "Segoe UI, Arial, sans-serif",
            fontSize: "14px",
          },
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
            curve: "basis",
            nodeSpacing: 34,
            rankSpacing: 42,
            wrappingWidth: 150,
          },
          sequence: {
            useMaxWidth: false,
            actorMargin: 50,
            boxMargin: 10,
            messageMargin: 28,
          },
          er: { useMaxWidth: false, diagramPadding: 12 },
        });
        await mermaid.run({ querySelector: ".mermaid" });
      });
    }

    // Wait for mermaid to render all diagrams
    await page.waitForFunction(
      () => {
        const els = document.querySelectorAll(".mermaid svg");
        const total = document.querySelectorAll(".mermaid").length;
        return total === 0 || els.length >= total;
      },
      { timeout: 60000 }
    );

    // Extra wait for diagram rendering to settle
    await new Promise((r) => setTimeout(r, 3000));

    const pdfPath = path.join(OUTPUT_DIR, chapter.file.replace(".md", ".pdf"));
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "25mm", bottom: "25mm", left: "20mm", right: "20mm" },
      displayHeaderFooter: true,
      headerTemplate: `<div style="width:100%; font-family:'Segoe UI',Arial,sans-serif; font-size:8px; color:#999; padding:0 20mm; text-align:center;">WaitLess Digital Queue Management System</div>`,
      footerTemplate: `<div style="width:100%; font-family:'Segoe UI',Arial,sans-serif; font-size:8px; color:#999; padding:0 20mm; text-align:center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
    });

    await page.close();
    console.log(`  DONE: ${path.basename(pdfPath)}`);
  }

  await browser.close();
  console.log("\nAll PDFs generated in: " + OUTPUT_DIR);
}

generatePdfs().catch((err) => {
  console.error("Error generating PDFs:", err);
  process.exit(1);
});
