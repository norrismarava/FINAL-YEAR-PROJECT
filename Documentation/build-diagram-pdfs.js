const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const ROOT = __dirname;
const SOURCE_PATH = path.join(
  ROOT,
  "chapters",
  "chapter-3-system-analysis-design.md",
);
const OUTPUT_DIR = path.join(ROOT, "pdfs");
const PREVIEW_DIR = path.join(ROOT, ".diagram-previews");
const MERMAID_PATH = require.resolve("mermaid/dist/mermaid.min.js");
const BACKGROUND_PATH = path.join(
  ROOT,
  "assets",
  "diagram-hospital-watermark.jpg",
);
const BACKGROUND_DATA_URL = `data:image/jpeg;base64,${fs
  .readFileSync(BACKGROUND_PATH)
  .toString("base64")}`;

const WAITLESS_THEME = {
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
  actorLineColor: "#7a98a8",
  signalColor: "#164e63",
  signalTextColor: "#123247",
  labelBoxBkgColor: "#ffffff",
  labelBoxBorderColor: "#8fb7c7",
  labelTextColor: "#123247",
  loopTextColor: "#123247",
  noteBkgColor: "#fff8dd",
  noteBorderColor: "#d4a72c",
  noteTextColor: "#473b14",
  activationBkgColor: "#cffafe",
  activationBorderColor: "#0e7490",
  relationColor: "#45647a",
  relationLabelColor: "#123247",
  attributeBackgroundColorOdd: "#f8fafc",
  attributeBackgroundColorEven: "#eef7f7",
  fontFamily: "Segoe UI, Arial, sans-serif",
  fontSize: "15px",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cleanHeading(value) {
  return value
    .replace(/^#+\s*/, "")
    .replace(/^\d+(?:\.\d+)*\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function diagramType(source) {
  const firstLine = source.trim().split(/\r?\n/, 1)[0].trim();

  if (firstLine.startsWith("sequenceDiagram")) return "Sequence Diagram";
  if (firstLine.startsWith("erDiagram")) return "Entity-Relationship Diagram";
  if (firstLine.startsWith("stateDiagram")) return "State Diagram";
  if (firstLine.startsWith("flowchart") || firstLine.startsWith("graph")) {
    return "Process / Structure Diagram";
  }

  return "System Diagram";
}

function extractDiagrams(markdown) {
  const lines = markdown.split(/\r?\n/);
  const diagrams = [];
  let activeHeading = "WaitLess System Diagram";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (/^#{3,4}\s+/.test(line)) {
      activeHeading = cleanHeading(line);
    }

    if (line.trim() !== "```mermaid") continue;

    const sourceLines = [];
    index += 1;

    while (index < lines.length && lines[index].trim() !== "```") {
      sourceLines.push(lines[index]);
      index += 1;
    }

    const source = sourceLines.join("\n").trim();
    if (!source) continue;

    diagrams.push({
      title: activeHeading,
      type: diagramType(source),
      source,
    });
  }

  return diagrams;
}

function shellHtml({ title, type, index, total, combined = false }) {
  const pageClass = combined ? "diagram-page combined-page" : "diagram-page";

  return `
    <section class="${pageClass}">
      <header class="diagram-header">
        <div>
          <div class="eyebrow">WAITLESS DIGITAL QUEUE MANAGEMENT SYSTEM</div>
          <h1>${escapeHtml(title)}</h1>
        </div>
        <div class="meta">
          <span>${escapeHtml(type)}</span>
          <strong>${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}</strong>
        </div>
      </header>
      <div class="accent-line"><span></span></div>
      <main class="diagram-stage">
        <div class="diagram-target" id="diagram-${index}"></div>
      </main>
      <footer>
        <span>System Analysis and Design</span>
        <span>Chinhoyi Provincial Hospital</span>
      </footer>
    </section>`;
}

function documentHtml(body, { landscape = true, combined = false } = {}) {
  const pageWidth = landscape ? "420mm" : "297mm";
  const pageHeight = landscape ? "297mm" : "420mm";

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        @page { size: ${pageWidth} ${pageHeight}; margin: 0; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #ffffff; color: #123247; }
        body { font-family: "Segoe UI", Arial, sans-serif; }
        .diagram-page {
          width: ${pageWidth};
          height: ${pageHeight};
          position: relative;
          isolation: isolate;
          padding: 12mm 14mm 9mm;
          display: grid;
          grid-template-rows: auto 3px minmax(0, 1fr) auto;
          gap: 4mm;
          overflow: hidden;
          background:
            linear-gradient(180deg, rgba(220, 248, 246, 0.7), transparent 42mm),
            #ffffff;
        }
        .diagram-page::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background: url("${BACKGROUND_DATA_URL}") center / cover no-repeat;
          opacity: 0.075;
          filter: grayscale(18%) saturate(0.75);
        }
        .combined-page { break-after: page; page-break-after: always; }
        .diagram-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12mm; }
        .eyebrow { font-size: 9pt; font-weight: 800; color: #0f8f95; letter-spacing: 0.16em; }
        h1 { margin: 2.5mm 0 0; font-size: 23pt; line-height: 1.12; color: #0b3046; letter-spacing: 0; }
        .meta { display: flex; align-items: center; gap: 4mm; padding-top: 1mm; white-space: nowrap; }
        .meta span { border: 1px solid #b7d8df; border-radius: 999px; padding: 2mm 4mm; color: #356174; font-size: 9pt; font-weight: 700; }
        .meta strong { color: #2f78c4; font-size: 10pt; }
        .accent-line { background: #d8e7ed; overflow: hidden; }
        .accent-line span { display: block; width: 31%; height: 100%; background: linear-gradient(90deg, #0f9f98, #2798d8); }
        .diagram-stage { min-height: 0; display: flex; align-items: center; justify-content: center; padding: 2mm; }
        .diagram-target { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .diagram-target svg { display: block; max-width: 100% !important; max-height: 100% !important; width: auto !important; height: auto !important; }
        .diagram-target .nodeLabel, .diagram-target .edgeLabel, .diagram-target text { font-family: "Segoe UI", Arial, sans-serif !important; }
        footer { display: flex; justify-content: space-between; border-top: 1px solid #d8e7ed; padding-top: 2.5mm; color: #698391; font-size: 8.5pt; }
        .cover-page {
          width: 420mm;
          height: 297mm;
          position: relative;
          padding: 25mm 28mm;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 24mm;
          align-items: center;
          background:
            linear-gradient(135deg, rgba(6, 44, 67, 0.95) 0%, rgba(7, 72, 98, 0.92) 58%, rgba(10, 125, 130, 0.88) 100%),
            url("${BACKGROUND_DATA_URL}") center / cover no-repeat;
          color: white;
          break-after: page;
          page-break-after: always;
        }
        .cover-kicker { font-size: 11pt; letter-spacing: 0.22em; font-weight: 800; color: #67e8f9; }
        .cover-page h1 { margin-top: 7mm; max-width: 220mm; color: white; font-size: 40pt; }
        .cover-page p { max-width: 205mm; margin: 7mm 0 0; color: #c9e6ee; font-size: 16pt; line-height: 1.55; }
        .cover-list { border-left: 1px solid rgba(255,255,255,0.25); padding-left: 15mm; }
        .cover-list h2 { margin: 0 0 5mm; font-size: 16pt; color: #67e8f9; }
        .cover-list ol { margin: 0; padding-left: 7mm; columns: 2; column-gap: 10mm; }
        .cover-list li { break-inside: avoid; margin: 0 0 3mm; color: #e6f7fa; font-size: 9.5pt; line-height: 1.35; }
        ${combined ? ".diagram-page:last-child { break-after: auto; page-break-after: auto; }" : ""}
      </style>
    </head>
    <body>${body}</body>
  </html>`;
}

async function renderDiagram(page, diagram, index) {
  await page.evaluate(
    async ({ source, index, themeVariables }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: "base",
        themeVariables,
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
          curve: "basis",
          nodeSpacing: 38,
          rankSpacing: 48,
          wrappingWidth: 160,
        },
        sequence: {
          useMaxWidth: false,
          actorMargin: 60,
          boxMargin: 12,
          messageMargin: 32,
          diagramMarginX: 25,
          diagramMarginY: 15,
        },
        er: { useMaxWidth: false, diagramPadding: 16 },
      });

      const target = document.getElementById(`diagram-${index}`);
      const result = await mermaid.render(`waitless-diagram-${index}`, source);
      target.innerHTML = result.svg;
      result.bindFunctions?.(target);
    },
    { source: diagram.source, index, themeVariables: WAITLESS_THEME },
  );
}

async function naturalRatio(browser, diagram) {
  const page = await browser.newPage();
  await page.setContent('<div id="diagram-1"></div>', { waitUntil: "domcontentloaded" });
  await page.addScriptTag({ path: MERMAID_PATH });
  await renderDiagram(page, diagram, 1);
  const dimensions = await page.$eval("#diagram-1 svg", (svg) => {
    const viewBox = svg.viewBox?.baseVal;
    const width = viewBox?.width || svg.getBoundingClientRect().width || 1;
    const height = viewBox?.height || svg.getBoundingClientRect().height || 1;
    return { width, height };
  });
  await page.close();
  return dimensions.width / Math.max(dimensions.height, 1);
}

async function buildIndividualPdf(browser, diagram, index, total) {
  const ratio = await naturalRatio(browser, diagram);
  const landscape = ratio >= 1.08;
  const body = shellHtml({ ...diagram, index, total });
  const page = await browser.newPage();

  await page.setContent(documentHtml(body, { landscape }), {
    waitUntil: "domcontentloaded",
  });
  await page.addScriptTag({ path: MERMAID_PATH });
  await renderDiagram(page, diagram, index);
  await page.evaluate(() => document.fonts.ready);

  const fileName = `${String(index).padStart(2, "0")}-${slugify(diagram.title)}.pdf`;
  const pdfPath = path.join(OUTPUT_DIR, fileName);

  if (process.env.DIAGRAM_PREVIEWS === "1") {
    fs.mkdirSync(PREVIEW_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(PREVIEW_DIR, fileName.replace(/\.pdf$/i, ".png")),
      fullPage: true,
    });
  }

  await page.pdf({
    path: pdfPath,
    format: "A3",
    landscape,
    printBackground: true,
    preferCSSPageSize: true,
    pageRanges: "1",
  });
  await page.close();

  return { fileName, pdfPath };
}

function coverHtml(diagrams) {
  const items = diagrams
    .map((diagram) => `<li>${escapeHtml(diagram.title)}</li>`)
    .join("");

  return `
    <section class="cover-page">
      <div>
        <div class="cover-kicker">FINAL YEAR PROJECT DOCUMENTATION</div>
        <h1>WaitLess System Diagrams</h1>
        <p>A visual specification of the digital hospital queue platform, covering actors, architecture, data, information flow, and critical operational processes.</p>
      </div>
      <div class="cover-list">
        <h2>Diagram Register</h2>
        <ol>${items}</ol>
      </div>
    </section>`;
}

async function buildCombinedPdf(browser, diagrams) {
  const body = [
    coverHtml(diagrams),
    ...diagrams.map((diagram, offset) =>
      shellHtml({
        ...diagram,
        index: offset + 1,
        total: diagrams.length,
        combined: true,
      }),
    ),
  ].join("\n");

  const page = await browser.newPage();
  await page.setContent(documentHtml(body, { landscape: true, combined: true }), {
    waitUntil: "domcontentloaded",
  });
  await page.addScriptTag({ path: MERMAID_PATH });

  for (let index = 0; index < diagrams.length; index += 1) {
    await renderDiagram(page, diagrams[index], index + 1);
  }

  await page.evaluate(() => document.fonts.ready);
  const pdfPath = path.join(OUTPUT_DIR, "00-WaitLess-System-Diagrams-Complete.pdf");
  await page.pdf({
    path: pdfPath,
    format: "A3",
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
    pageRanges: `1-${diagrams.length + 1}`,
  });
  await page.close();
  return pdfPath;
}

async function main() {
  if (!fs.existsSync(SOURCE_PATH)) {
    throw new Error(`Diagram source not found: ${SOURCE_PATH}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const markdown = fs.readFileSync(SOURCE_PATH, "utf8");
  const diagrams = extractDiagrams(markdown);

  if (!diagrams.length) {
    throw new Error("No Mermaid diagrams were found in Chapter 3.");
  }

  console.log(`Found ${diagrams.length} WaitLess system diagrams.`);
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    for (let index = 0; index < diagrams.length; index += 1) {
      const result = await buildIndividualPdf(
        browser,
        diagrams[index],
        index + 1,
        diagrams.length,
      );
      console.log(`Created ${result.fileName}`);
    }

    const combinedPath = await buildCombinedPdf(browser, diagrams);
    console.log(`Created ${path.basename(combinedPath)}`);
  } finally {
    await browser.close();
  }

  console.log(`Diagram PDFs are available in ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
