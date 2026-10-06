const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { pathToFileURL } = require("url");
const MarkdownIt = require("markdown-it");
const puppeteer = require("puppeteer");

const ROOT = __dirname;
const CHAPTERS_DIR = path.join(ROOT, "chapters");
const BUILD_DIR = path.join(ROOT, ".complete-build");
const OUTPUT_DIR = path.join(ROOT, "pdfs");
const MERMAID_PATH = require.resolve("mermaid/dist/mermaid.min.js");
const FINALIZER_PATH = path.join(ROOT, "finalize-documentation.py");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "WaitLess-Final-Project-Documentation.pdf");
const LOGO_PATH = path.join(
  ROOT,
  "..",
  "WAITLESS",
  "frontend",
  "src",
  "assets",
  "waitlesslogo-cropped.png",
);
const BACKGROUND_PATH = path.join(ROOT, "assets", "diagram-hospital-watermark.jpg");
const PATIENT_GUIDE_HTML_PATH = path.join(ROOT, "..", "WAITLESS", "docs", "WaitLess-User-Guide.html");
const STAFF_GUIDE_HTML_PATH = path.join(ROOT, "..", "WAITLESS", "docs", "WaitLess-Staff-Guide.html");

const imageDataUrl = (filePath, mimeType) =>
  `data:${mimeType};base64,${fs.readFileSync(filePath).toString("base64")}`;

const LOGO_DATA_URL = imageDataUrl(LOGO_PATH, "image/png");
const BACKGROUND_DATA_URL = imageDataUrl(BACKGROUND_PATH, "image/jpeg");

const md = new MarkdownIt({
  html: true,
  breaks: false,
  linkify: true,
  typographer: true,
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

const CSS = `
  @page { size: A4; margin: 20mm 18mm 22mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Calibri", "Segoe UI", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #182837;
    background: #ffffff;
  }
  p { margin: 0 0 10px; text-align: justify; orphans: 3; widows: 3; }
  h1, h2, h3, h4 { font-family: "Segoe UI", Arial, sans-serif; page-break-after: avoid; }
  h1 {
    margin: 0 0 18px;
    padding: 0 0 10px;
    color: #0b6272;
    border-bottom: 3px solid #10a6b3;
    font-size: 22pt;
    line-height: 1.16;
  }
  h2 {
    margin: 24px 0 10px;
    padding-bottom: 4px;
    color: #0b6272;
    border-bottom: 1px solid #c6dce1;
    font-size: 15.5pt;
    line-height: 1.22;
  }
  h3 { margin: 18px 0 8px; color: #167287; font-size: 12.5pt; }
  h4 { margin: 14px 0 7px; color: #27495c; font-size: 11.2pt; }
  a { color: #0a7587; text-decoration: none; }
  strong { color: #132f40; }
  ul, ol { margin: 7px 0 11px; padding-left: 24px; }
  li { margin: 0 0 4px; }
  blockquote {
    margin: 12px 0;
    padding: 10px 14px;
    border-left: 4px solid #10a6b3;
    background: #edf8fa;
    color: #385565;
  }
  code {
    padding: 1px 4px;
    border-radius: 3px;
    background: #edf2f5;
    color: #9e3c34;
    font-family: Consolas, "Courier New", monospace;
    font-size: 9.2pt;
  }
  pre {
    margin: 12px 0;
    padding: 12px;
    overflow: hidden;
    border: 1px solid #cddce2;
    border-radius: 5px;
    background: #f5f8fa;
    font-size: 8.7pt;
    line-height: 1.35;
    white-space: pre-wrap;
    page-break-inside: avoid;
  }
  pre code { padding: 0; background: transparent; color: #243746; }
  table {
    width: 100%;
    margin: 7px 0 15px;
    border-collapse: collapse;
    font-size: 8.6pt;
    line-height: 1.3;
  }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th {
    padding: 6px 7px;
    border: 1px solid #0b6272;
    background: #0b6272;
    color: #ffffff;
    text-align: left;
  }
  td {
    padding: 5px 7px;
    border: 1px solid #cbd8de;
    vertical-align: top;
  }
  tbody tr:nth-child(even) { background: #f5f9fa; }
  hr { margin: 18px 0; border: 0; border-top: 1px solid #cddce2; }
  .page-marker {
    display: block;
    width: auto;
    height: 2px;
    overflow: hidden;
    color: #ffffff;
    font-size: 1px;
    line-height: 2px;
  }
  .figure-caption, .table-caption {
    margin: 5px 0 10px;
    color: #36596a;
    font-size: 9pt;
    font-style: italic;
    text-align: center;
    page-break-before: avoid;
  }
  .table-caption { margin: 12px 0 4px; text-align: left; }
  .mermaid {
    position: relative;
    isolation: isolate;
    display: flex;
    min-height: 70mm;
    max-height: 210mm;
    margin: 12px 0 4px;
    padding: 7mm 6mm;
    overflow: hidden;
    align-items: center;
    justify-content: center;
    border: 1px solid #b8d8df;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.94);
    page-break-inside: avoid;
  }
  .mermaid::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: url("${BACKGROUND_DATA_URL}") center / cover no-repeat;
    opacity: 0.06;
    filter: grayscale(18%) saturate(0.75);
  }
  .mermaid svg { display: block; width: auto; max-width: 100%; height: auto !important; max-height: 194mm; }
  .chapter-body > h1:first-of-type { page-break-before: avoid; }
  .front-page {
    min-height: 245mm;
    padding-top: 7mm;
    page-break-after: always;
  }
  .front-page h1, .front-page h2 { text-align: left; }
  .title-page {
    position: relative;
    display: flex;
    min-height: 250mm;
    padding: 12mm 8mm 8mm;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    text-align: center;
  }
  .title-page::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -2;
    background: linear-gradient(155deg, #edfafa 0%, #ffffff 48%, #edf4fb 100%);
  }
  .title-page::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 6mm;
    z-index: -1;
    background: linear-gradient(90deg, #0b8795, #2f7edf);
  }
  .title-page .project-logo { width: 62mm; max-height: 26mm; margin: 0 auto 14mm; object-fit: contain; }
  .title-page h1 {
    max-width: 160mm;
    margin: 0 auto 6mm;
    padding: 0;
    border: 0;
    color: #0b3e58;
    font-size: 25pt;
    line-height: 1.17;
    text-align: center;
  }
  .title-page p { text-align: center; }
  .title-page table { width: 130mm; margin: 7mm auto; font-size: 9.5pt; }
  .title-page blockquote { border: 0; background: transparent; font-style: italic; }
  .front-list { page-break-before: always; }
  .front-list h1 { margin-bottom: 12px; }
  .contents-list { width: 100%; border-collapse: collapse; font-size: 9.3pt; }
  .contents-list td { padding: 3px 4px; border: 0; background: #ffffff; }
  .contents-list .entry-level-2 td:first-child { padding-left: 15px; color: #405e6e; }
  .contents-list .entry-level-1 td:first-child { padding-top: 7px; color: #0b6272; font-weight: 700; }
  .contents-list td:last-child { width: 15mm; text-align: right; font-variant-numeric: tabular-nums; }
  .list-note { color: #5d7480; font-size: 9pt; }
  .section-kicker {
    margin-bottom: 5mm;
    color: #0b8795;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
`;

const MERMAID_CONFIG = {
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
    fontSize: "13px",
  },
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true,
    curve: "basis",
    nodeSpacing: 30,
    rankSpacing: 38,
    wrappingWidth: 145,
  },
  sequence: { useMaxWidth: false, actorMargin: 42, boxMargin: 8, messageMargin: 24 },
  er: { useMaxWidth: false, diagramPadding: 10 },
};

function readMarkdown(fileName) {
  return normalizeText(fs.readFileSync(path.join(CHAPTERS_DIR, fileName), "utf8"));
}

function normalizeText(value) {
  const replacements = new Map([
    ["â€“", "–"],
    ["â€”", "—"],
    ["â€™", "’"],
    ["â€œ", "“"],
    ["â€", "”"],
    ["â†’", "→"],
    ["â†", "←"],
    ["â†‘", "↑"],
    ["â†“", "↓"],
    ["â‰¤", "≤"],
    ["â‰¥", "≥"],
    ["Ã—", "×"],
    ["â”œâ”€â”€", "+--"],
    ["â””â”€â”€", "`--"],
    ["â”‚", "|"],
    ["â”€", "-"],
    ["Â", ""],
  ]);

  let normalized = value;
  for (const [from, to] of replacements) normalized = normalized.split(from).join(to);
  return normalized;
}

function cleanInline(value) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanCaptionTitle(value) {
  return value.replace(/^\d+(?:\.\d+)*\s+/, "").trim();
}

function combineChapterFour() {
  let design = readMarkdown("chapter-3-system-analysis-design.md");
  let implementation = readMarkdown("chapter-4-implementation.md");

  design = design.replace(/^# Chapter 3:[^\n]*\n+/m, "");
  design = design.replace(/^## 3\.1 Introduction[\s\S]*?(?=^## 3\.2 )/m, "");
  design = design.replace(/^## 3\.10 Summary[\s\S]*$/m, "");
  design = design.replace(/^(#{2,4}\s+)3\.(\d+)((?:\.\d+)*)/gm, (_, prefix, major, tail) => {
    return `${prefix}4.${Number(major) - 1}${tail}`;
  });

  implementation = implementation.replace(/^# Chapter 4:[^\n]*\n+/m, "");
  implementation = implementation.replace(/^## 4\.1 Introduction[\s\S]*?(?=^## 4\.2 )/m, "");
  implementation = implementation.replace(
    /^(#{2,4}\s+)4\.(\d+)((?:\.\d+)*)/gm,
    (_, prefix, major, tail) => `${prefix}4.${Number(major) + 8}${tail}`,
  );

  const introduction = `# Chapter 4: System Design and Implementation

## 4.0 Introduction

This chapter translates the requirements identified in Chapters 1 and 2, and the methodology described in Chapter 3, into the design and implementation of the WaitLess prototype. It first presents the requirements, use cases, architecture, data structures, process flows, interface approach, and security model. It then explains how those decisions were implemented in the frontend, backend, storage, real-time update, notification, reporting, and deployment layers. The chapter deliberately distinguishes a feature represented in the prototype from a control that still requires production configuration or hospital acceptance.

`;

  const implementationPlan = `
## 4.9 Implementation Plan and Milestones

Implementation followed an incremental sequence so that each stage left a demonstrable patient-flow path. The first milestone established registration and ticket creation. The second added triage and priority-aware queue movement. The third introduced staff dashboards, public boards, and real-time updates. The fourth expanded notifications, patient self-service, departmental workflows, reporting, and administration. The final milestone concentrated on security corrections, controlled walkthroughs, documentation, and packaging. The detailed research and development sequence appears in Section 3.10, while the remaining deployment controls are listed in Appendix C.

`;

  return `${introduction}${design.trim()}\n${implementationPlan}${implementation.trim()}\n`;
}

function buildSections() {
  return [
    { key: "chapter-1", prefix: "1", fileName: "chapter-1-introduction.md", title: "Chapter 1: Introduction" },
    { key: "chapter-2", prefix: "2", fileName: "chapter-2-literature-review.md", title: "Chapter 2: Literature Review" },
    { key: "chapter-3", prefix: "3", fileName: "chapter-3-methodology.md", title: "Chapter 3: Methodology" },
    { key: "chapter-4", prefix: "4", content: combineChapterFour(), title: "Chapter 4: System Design and Implementation" },
    { key: "chapter-5", prefix: "5", fileName: "chapter-5-testing-evaluation.md", title: "Chapter 5: Presentation of Results" },
    { key: "chapter-6", prefix: "6", fileName: "chapter-6-conclusion-recommendations.md", title: "Chapter 6: Summary, Maintenance and Recommendations" },
    { key: "references", prefix: "R", fileName: "references.md", title: "References" },
    { key: "appendices", prefix: "A", fileName: "appendices.md", title: "Appendices" },
  ].map((section) => ({
    ...section,
    content: section.content ?? readMarkdown(section.fileName),
    pdfPath: path.join(BUILD_DIR, `${section.key}.pdf`),
  }));
}

function annotateMarkdown(content, section, counters) {
  const lines = content.split(/\r?\n/);
  const output = [];
  let activeHeading = section.title;
  let inFence = false;
  let mermaidFence = false;
  let pendingFigure = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const heading = /^(#{1,4})\s+(.+?)\s*$/.exec(line);

    if (!inFence && heading) {
      activeHeading = cleanInline(heading[2]);
      if (heading[1].length <= 2) {
        const marker = `WLH${String(++counters.heading).padStart(4, "0")}`;
        counters.headings.push({ marker, level: heading[1].length, title: activeHeading, section: section.key });
        output.push(`<span class="page-marker">${marker}</span>`);
      }
    }

    const nextLine = lines[index + 1] ?? "";
    const isTableStart =
      !inFence &&
      /^\s*\|.+\|\s*$/.test(line) &&
      /^\s*\|?\s*:?-{3,}/.test(nextLine);

    if (isTableStart) {
      const number = ++counters.tableByPrefix[section.prefix];
      const label = `Table ${section.prefix}.${number}`;
      const marker = `WLT${String(++counters.table).padStart(4, "0")}`;
      const captionTitle = cleanCaptionTitle(activeHeading);
      counters.tables.push({ marker, label, title: captionTitle, section: section.key });
      output.push(`<span class="page-marker">${marker}</span>`);
      output.push(`<div class="table-caption">${label}: ${captionTitle}</div>`);
      output.push("");
    }

    if (!inFence && line.trim() === "```mermaid") {
      const number = ++counters.figureByPrefix[section.prefix];
      const label = `Figure ${section.prefix}.${number}`;
      const marker = `WLF${String(++counters.figure).padStart(4, "0")}`;
      pendingFigure = {
        marker,
        label,
        title: cleanCaptionTitle(activeHeading),
        section: section.key,
      };
      counters.figures.push(pendingFigure);
      output.push(`<span class="page-marker">${marker}</span>`);
      inFence = true;
      mermaidFence = true;
      output.push(line);
      continue;
    }

    if (!inFence && /^```/.test(line.trim())) {
      inFence = true;
      mermaidFence = false;
      output.push(line);
      continue;
    }

    if (inFence && line.trim() === "```") {
      output.push(line);
      inFence = false;
      if (mermaidFence && pendingFigure) {
        output.push(`<div class="figure-caption">${pendingFigure.label}: ${pendingFigure.title}</div>`);
      }
      mermaidFence = false;
      pendingFigure = null;
      continue;
    }

    output.push(line);
  }

  return output.join("\n");
}

function pageShell(body, title, bodyClass = "chapter-body") {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${md.utils.escapeHtml(title)}</title>
      <style>${CSS}</style>
    </head>
    <body class="${bodyClass}">${body}</body>
  </html>`;
}

async function renderPdf(browser, html, outputPath) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 120000 });

  const mermaidCount = await page.$$eval(".mermaid", (nodes) => nodes.length);
  if (mermaidCount) {
    await page.addScriptTag({ path: MERMAID_PATH });
    await page.evaluate(async (config) => {
      mermaid.initialize(config);
      await mermaid.run({ querySelector: ".mermaid" });
    }, MERMAID_CONFIG);
    await page.waitForFunction(
      () => document.querySelectorAll(".mermaid svg").length === document.querySelectorAll(".mermaid").length,
      { timeout: 90000 },
    );
  }

  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await new Promise((resolve) => setTimeout(resolve, 600));

  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", right: "18mm", bottom: "22mm", left: "18mm" },
    preferCSSPageSize: true,
  });
  await page.close();
}

async function renderHtmlFilePdf(browser, htmlPath, outputPath) {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0", timeout: 120000 });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all(
      [...document.images].map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              image.addEventListener("load", resolve, { once: true });
              image.addEventListener("error", resolve, { once: true });
            }),
      ),
    );
  });
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  await page.close();
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function runPython(args) {
  const result = spawnSync("python", [FINALIZER_PATH, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`Documentation finalizer failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout.trim();
}

function splitFrontMatter(frontMarkdown) {
  const parts = frontMarkdown.split(/(?=^##\s+)/m);
  const opening = parts.shift();
  const sections = new Map();
  for (const part of parts) {
    const match = /^##\s+([^\n]+)/.exec(part);
    if (match) sections.set(cleanInline(match[1]), part);
  }
  return { opening, sections };
}

function entriesTable(entries, kind = "contents") {
  if (!entries.length) return "<p class=\"list-note\">No entries were generated.</p>";
  return `<table class="contents-list"><tbody>${entries
    .map((entry) => {
      const title = kind === "contents" ? entry.title : `${entry.label}: ${entry.title}`;
      const rowClass = kind === "contents" ? `entry-level-${entry.level}` : "entry-level-2";
      return `<tr class="${rowClass}"><td>${md.utils.escapeHtml(title)}</td><td>${entry.logicalPage}</td></tr>`;
    })
    .join("")}</tbody></table>`;
}

function frontHtml(frontMarkdown, indexData) {
  const { opening, sections } = splitFrontMatter(frontMarkdown);
  const order = [
    "Acknowledgements",
    "Dedication",
    "Declaration and Release Form",
    "Approval Form",
    "Originality and Antiplagiarism Statement",
    "Abstract",
  ];

  const titleHtml = md.render(opening).replace(
    /(<h1[^>]*>)/,
    `<img class="project-logo" src="${LOGO_DATA_URL}" alt="WaitLess" />$1`,
  );
  const frontSections = order
    .filter((name) => sections.has(name))
    .map((name) => `<section class="front-page">${md.render(sections.get(name))}</section>`)
    .join("\n");

  const abbreviations = sections.has("List of Abbreviations")
    ? `<section class="front-list">${md.render(sections.get("List of Abbreviations"))}</section>`
    : "";

  return pageShell(
    `<section class="front-page title-page">${titleHtml}</section>
     ${frontSections}
     <section class="front-list">
       <div class="section-kicker">Document navigation</div>
       <h1>Table of Contents</h1>
       <p class="list-note">Chapter page numbers begin with Chapter 1. Front matter uses Roman numerals in the consolidated PDF.</p>
       ${entriesTable(indexData.headings, "contents")}
     </section>
     <section class="front-list">
       <div class="section-kicker">Visual index</div>
       <h1>List of Figures</h1>
       ${entriesTable(indexData.figures, "figures")}
     </section>
     <section class="front-list">
       <div class="section-kicker">Tabular index</div>
       <h1>List of Tables</h1>
       ${entriesTable(indexData.tables, "tables")}
     </section>
     ${abbreviations}`,
    "WaitLess Project Documentation - Front Matter",
    "front-matter",
  );
}

async function main() {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const counters = {
    heading: 0,
    figure: 0,
    table: 0,
    headings: [],
    figures: [],
    tables: [],
    figureByPrefix: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, R: 0, A: 0 },
    tableByPrefix: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, R: 0, A: 0 },
  };
  const sections = buildSections();
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    for (const section of sections) {
      process.stdout.write(`Rendering ${section.title}... `);
      const annotated = annotateMarkdown(section.content, section, counters);
      await renderPdf(browser, pageShell(md.render(annotated), section.title), section.pdfPath);
      console.log("done");
    }

    const markerManifestPath = path.join(BUILD_DIR, "marker-manifest.json");
    const indexPath = path.join(BUILD_DIR, "page-index.json");
    writeJson(markerManifestPath, {
      sections: sections.map(({ key, pdfPath, title }) => ({ key, pdfPath, title })),
      headings: counters.headings,
      figures: counters.figures,
      tables: counters.tables,
    });
    runPython(["inspect", markerManifestPath, indexPath]);
    const indexData = JSON.parse(fs.readFileSync(indexPath, "utf8"));

    const frontPath = path.join(BUILD_DIR, "front-matter.pdf");
    process.stdout.write("Rendering front matter and generated indexes... ");
    await renderPdf(browser, frontHtml(readMarkdown("front-matter.md"), indexData), frontPath);
    console.log("done");

    const patientGuidePath = path.join(BUILD_DIR, "patient-user-guide.pdf");
    const staffGuidePath = path.join(BUILD_DIR, "staff-user-guide.pdf");
    process.stdout.write("Rendering clean patient and staff manuals... ");
    await renderHtmlFilePdf(browser, PATIENT_GUIDE_HTML_PATH, patientGuidePath);
    await renderHtmlFilePdf(browser, STAFF_GUIDE_HTML_PATH, staffGuidePath);
    console.log("done");

    const finalManifestPath = path.join(BUILD_DIR, "final-manifest.json");
    writeJson(finalManifestPath, {
      outputPath: OUTPUT_PATH,
      frontPath,
      bodySections: sections.map(({ key, pdfPath, title }) => ({ key, pdfPath, title })),
      indexData,
      manuals: [
        { title: "Appendix D: Patient and User Manual - Manual Begins", path: patientGuidePath },
        { title: "Appendix E: Staff User Manual - Manual Begins", path: staffGuidePath },
      ],
    });
    const summary = runPython(["merge", finalManifestPath]);
    console.log(summary);
    console.log(`Final PDF: ${OUTPUT_PATH}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
