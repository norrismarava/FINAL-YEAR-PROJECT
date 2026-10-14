function escapeCSV(value) {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCSV(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCSV(row[h])).join(","));
  }
  const csv = lines.join("\n");
  downloadBlob(`\uFEFF${csv}`, filename, "text/csv;charset=utf-8;");
}

function escapeXML(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function exportXLSX(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);

  const headerCells = headers
    .map((h) => `<Cell><Data ss:Type="String">${escapeXML(h)}</Data></Cell>`)
    .join("");
  const dataRows = rows
    .map(
      (row) =>
        `<Row>${headers
          .map((h) => {
            const val = row[h];
            const isNumber = typeof val === "number" && Number.isFinite(val);
            return `<Cell><Data ss:Type="${isNumber ? "Number" : "String"}">${escapeXML(val)}</Data></Cell>`;
          })
          .join("")}</Row>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Report">
  <Table>
   <Row>${headerCells}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;

  downloadBlob(xml, filename, "application/vnd.ms-excel");
}

export function exportPDF(title, sections) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;

  const formatDate = () =>
    new Date().toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const sectionHTML = sections
    .map((section) => {
      const rows = section.rows || [];
      if (rows.length === 0) {
        return `<h2>${section.title}</h2><p class="empty">No data in this section.</p>`;
      }
      const headers = Object.keys(rows[0]);
      const head = headers.map((h) => `<th>${h}</th>`).join("");
      const body = rows
        .map((row) => `<tr>${headers.map((h) => `<td>${row[h] ?? ""}</td>`).join("")}</tr>`)
        .join("");
      return `
        <h2>${section.title}</h2>
        <table>
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>`;
    })
    .join("");

  printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #1a2a3a; }
  .header { border-bottom: 2px solid #14b8a6; padding-bottom: 12px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; color: #0f766e; }
  .header .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
  h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; color: #334155; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
  th { background: #f1f5f9; text-align: left; padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569; }
  td { padding: 6px 10px; border: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  .empty { color: #94a3b8; font-style: italic; padding: 8px 0; }
  .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 10px; color: #94a3b8; }
  @media print { body { padding: 16px; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <h1>WaitLess · ${title}</h1>
    <div class="meta">Chinhoyi Provincial Hospital · Generated ${formatDate()}</div>
  </div>
  ${sectionHTML}
  <div class="footer">WaitLess Digital Queue System, Confidential operational report</div>
  <div class="no-print" style="margin-top:24px;text-align:center;">
    <button onclick="window.print()" style="padding:8px 24px;background:#14b8a6;color:white;border:none;border-radius:6px;font-size:14px;cursor:pointer;">Print / Save as PDF</button>
  </div>
</body>
</html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.focus(), 300);
}
