import QRCode from "qrcode";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatIssuedAt(value) {
  const issuedAt = value ? new Date(value) : new Date();
  return issuedAt.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildTrackingUrl(ticket) {
  const trackingPath =
    ticket?.handoff?.trackingPath ??
    `/track?ticket=${encodeURIComponent(ticket?.ticket ?? "")}`;

  if (typeof window === "undefined") {
    return trackingPath;
  }

  return new URL(trackingPath, window.location.origin).toString();
}

export function buildQueueTicketShareText(ticket) {
  return `WaitLess queue token ${ticket.ticket} for ${ticket.department}. Track your live position: ${buildTrackingUrl(ticket)}`;
}

export async function printQueueTicket(ticket) {
  if (typeof window === "undefined") {
    throw new Error("Printing is only available in the browser.");
  }

  const printWindow = window.open(
    "",
    "waitless-queue-ticket",
    "width=460,height=720",
  );

  if (!printWindow) {
    throw new Error("Allow pop-ups to print the queue ticket.");
  }

  printWindow.opener = null;
  printWindow.document.write(
    "<!doctype html><title>Preparing WaitLess ticket...</title><p>Preparing ticket...</p>",
  );
  printWindow.document.close();

  try {
    const trackingUrl = buildTrackingUrl(ticket);
    const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
      width: 220,
      margin: 1,
      color: {
        dark: "#062a35",
        light: "#ffffff",
      },
    });
    const patientNumber = ticket.patientNumber
      ? `<div class="meta-row"><span>Patient number</span><strong>${escapeHtml(ticket.patientNumber)}</strong></div>`
      : "";

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>WaitLess ${escapeHtml(ticket.ticket)}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #eef6f7;
              color: #062a35;
              font-family: Arial, Helvetica, sans-serif;
            }
            .receipt {
              width: min(80mm, 100%);
              min-height: 120mm;
              margin: 20px auto;
              padding: 9mm 7mm;
              background: #fff;
              border-top: 5px solid #0f9faf;
              box-shadow: 0 12px 32px rgba(6, 42, 53, 0.14);
              text-align: center;
            }
            .brand { font-size: 23px; font-weight: 800; color: #078aa0; }
            .tagline { margin-top: 3px; color: #5e7880; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; }
            .rule { margin: 7mm 0; border-top: 1px dashed #b8cdd1; }
            .label { color: #55737a; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }
            .token { margin-top: 4mm; font-size: 42px; line-height: 1; font-weight: 900; letter-spacing: 1px; }
            .department { margin-top: 4mm; font-size: 16px; font-weight: 700; }
            .meta { margin-top: 6mm; text-align: left; }
            .meta-row { display: flex; justify-content: space-between; gap: 12px; padding: 2.5mm 0; border-bottom: 1px solid #e3edef; font-size: 11px; }
            .meta-row span { color: #648087; }
            .qr { width: 42mm; height: 42mm; margin: 7mm auto 2mm; display: block; }
            .help { margin-top: 3mm; color: #55737a; font-size: 10px; line-height: 1.5; }
            .footer { margin-top: 7mm; color: #078aa0; font-size: 11px; font-weight: 700; }
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { background: #fff; }
              .receipt { width: 80mm; min-height: 0; margin: 0; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <main class="receipt">
            <div class="brand">WaitLess</div>
            <div class="tagline">Smarter queues, better care</div>
            <div class="rule"></div>
            <div class="label">Queue token</div>
            <div class="token">${escapeHtml(ticket.ticket)}</div>
            <div class="department">${escapeHtml(ticket.department)}</div>
            <div class="meta">
              ${patientNumber}
              <div class="meta-row"><span>Issued</span><strong>${escapeHtml(formatIssuedAt(ticket.registeredAt))}</strong></div>
              <div class="meta-row"><span>Status</span><strong>Waiting</strong></div>
            </div>
            <img class="qr" src="${qrDataUrl}" alt="Queue tracking QR code" />
            <div class="help">Scan to view your live position and queue notifications.</div>
            <div class="footer">Keep this ticket until your visit is complete.</div>
          </main>
        </body>
      </html>`);
    printWindow.document.close();

    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  } catch (error) {
    printWindow.close();
    throw error;
  }
}

export async function shareQueueTicket(ticket) {
  const url = buildTrackingUrl(ticket);
  const text = `Queue token ${ticket.ticket} for ${ticket.department}.`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `WaitLess ${ticket.ticket}`,
        text,
        url,
      });
      return "Ticket shared.";
    } catch (error) {
      if (error.name === "AbortError") {
        return "Sharing cancelled.";
      }
    }
  }

  const value = `${text} Track your live position: ${url}`;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return "Phone-ready ticket details copied.";
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Sharing is unavailable on this device.");
  }

  return "Phone-ready ticket details copied.";
}
