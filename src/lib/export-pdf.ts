import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PdfData {
  id: string;
  date_from: string;
  date_to: string;
  status: string;
  summary: { matched: number; diff: number; missing: number };
  matches: {
    match_status: string;
    diff_detail: string | null;
    my_tx: { item_name: string; amount: number; date: string } | null;
    their_tx: { item_name: string; amount: number; date: string } | null;
  }[];
}

export function generateReconPdf(data: PdfData) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("DuiZhang Reconciliation Report", 14, 20);

  // Meta info
  doc.setFontSize(10);
  doc.text(`Date Range: ${data.date_from} ~ ${data.date_to}`, 14, 30);
  doc.text(`Status: ${data.status}`, 14, 36);
  doc.text(
    `Summary: Matched ${data.summary.matched} | Diff ${data.summary.diff} | Missing ${data.summary.missing}`,
    14,
    42
  );

  // Table
  const rows = data.matches.map((m) => [
    m.match_status,
    m.my_tx ? `${m.my_tx.item_name} ¥${Number(m.my_tx.amount).toFixed(2)} ${m.my_tx.date}` : "--",
    m.their_tx
      ? `${m.their_tx.item_name} ¥${Number(m.their_tx.amount).toFixed(2)} ${m.their_tx.date}`
      : "--",
    m.diff_detail || "--",
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["Status", "My Record", "Their Record", "Details"]],
    body: rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [24, 24, 27] },
  });

  doc.save(`reconciliation-${data.id}.pdf`);
}
