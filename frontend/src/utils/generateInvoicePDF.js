import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function money(n) {
  if (n == null) return '£0.00';
  return '£' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function generateInvoicePDF(invoice, school = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // ── Colours ─────────────────────────────────────────────────────────────────
  const NAVY   = [61, 79, 124];   // #3D4F7C
  const LIGHT  = [245, 246, 250]; // #F5F6FA
  const WHITE  = [255, 255, 255];
  const GREY   = [136, 136, 136];
  const BLACK  = [33, 33, 33];

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(school.legalName || school.tradingName || 'School', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const schoolAddr = [
    school.address?.street,
    school.address?.city,
    school.address?.postcode,
    school.address?.country
  ].filter(Boolean).join(', ');
  if (schoolAddr) doc.text(schoolAddr, 14, 18);
  const schoolContact = [school.phone, school.email, school.website].filter(Boolean).join('   ');
  if (schoolContact) doc.text(schoolContact, 14, 23);

  // INVOICE label top-right
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageW - 14, 14, { align: 'right' });

  // ── Invoice meta ─────────────────────────────────────────────────────────────
  let y = 40;
  doc.setTextColor(...BLACK);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const metaRight = [
    ['Invoice Number', invoice.invoiceNumber || '—'],
    ['Issue Date',     fmt(invoice.issuedDate)],
    ['Due Date',       fmt(invoice.dueDate)],
    ['Status',         invoice.status || '—'],
  ];

  metaRight.forEach(([label, value]) => {
    doc.setTextColor(...GREY);
    doc.text(label, pageW - 60, y);
    doc.setTextColor(...BLACK);
    doc.setFont('helvetica', 'bold');
    doc.text(value, pageW - 14, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 6;
  });

  // ── Bill To ──────────────────────────────────────────────────────────────────
  y = 40;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(14, y - 4, 85, 30, 2, 2, 'F');

  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BILL TO', 18, y + 2);

  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const studentName = invoice.student
    ? `${invoice.student.firstName || ''} ${invoice.student.lastName || ''}`.trim()
    : '—';
  const studentId = invoice.student?.studentId || '';

  doc.text(studentName, 18, y + 9);
  if (studentId) {
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(`ID: ${studentId}`, 18, y + 14);
    doc.setTextColor(...BLACK);
    doc.setFontSize(10);
  }
  if (invoice.student?.email) doc.text(invoice.student.email, 18, y + 19);
  if (invoice.student?.phone) doc.text(invoice.student.phone, 18, y + 24);

  y = 80;

  // ── Line items table ──────────────────────────────────────────────────────────
  const vatRegistered = school.vatRegistered;
  const vatRate       = school.vatRate ?? 20;
  const net           = invoice.amount || 0;
  const vatAmt        = vatRegistered ? +(net * vatRate / 100).toFixed(2) : 0;
  const total         = net + vatAmt;

  const tableBody = [[
    invoice.course?.name || invoice.course || 'Course Fee',
    invoice.course?.code || '',
    '1',
    money(net),
    money(net),
  ]];

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Code', 'Qty', 'Unit Price', 'Amount']],
    body: tableBody,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 25 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    alternateRowStyles: { fillColor: LIGHT },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 6;

  // ── Totals ────────────────────────────────────────────────────────────────────
  const totalsX = pageW - 80;
  const totalsW = 66;

  const totalsRows = vatRegistered
    ? [['Subtotal', money(net)], [`VAT (${vatRate}%)`, money(vatAmt)], ['TOTAL DUE', money(total)]]
    : [['TOTAL DUE', money(total)]];

  totalsRows.forEach(([label, value], idx) => {
    const isLast = idx === totalsRows.length - 1;
    if (isLast) {
      doc.setFillColor(...NAVY);
      doc.roundedRect(totalsX - 2, y - 4, totalsW + 4, 10, 1, 1, 'F');
      doc.setTextColor(...WHITE);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(...GREY);
      doc.setFont('helvetica', 'normal');
    }
    doc.setFontSize(9);
    doc.text(label, totalsX + 4, y + 2);
    doc.text(value, totalsX + totalsW - 2, y + 2, { align: 'right' });
    doc.setTextColor(...BLACK);
    y += 12;
  });

  y += 6;

  // ── Payment details ───────────────────────────────────────────────────────────
  if (school.bank?.accountNumber) {
    doc.setFillColor(...LIGHT);
    const boxH = 32;
    doc.roundedRect(14, y, pageW - 28, boxH, 2, 2, 'F');

    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('PAYMENT DETAILS', 18, y + 7);

    doc.setTextColor(...BLACK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    const payTerms = school.invoice?.paymentTerms || 30;
    doc.text(`Payment due within ${payTerms} days of invoice date.`, 18, y + 13);

    const bankLine = [
      school.bank.bankName && `Bank: ${school.bank.bankName}`,
      school.bank.accountName && `Account: ${school.bank.accountName}`,
      school.bank.accountNumber && `Acc No: ${school.bank.accountNumber}`,
      school.bank.sortCode && `Sort Code: ${school.bank.sortCode}`,
    ].filter(Boolean).join('   ');
    doc.text(bankLine, 18, y + 19);

    if (school.bank.iban || school.bank.swiftBic) {
      const intl = [
        school.bank.iban && `IBAN: ${school.bank.iban}`,
        school.bank.swiftBic && `SWIFT/BIC: ${school.bank.swiftBic}`,
      ].filter(Boolean).join('   ');
      doc.text(intl, 18, y + 25);
    }
    y += boxH + 8;
  }

  // ── Notes ─────────────────────────────────────────────────────────────────────
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...GREY);
    doc.text('NOTES', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BLACK);
    doc.text(invoice.notes, 14, y + 5);
    y += 14;
  }

  // ── Legal footer ──────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 18;
  doc.setDrawColor(...LIGHT);
  doc.line(14, footerY - 4, pageW - 14, footerY - 4);

  doc.setFontSize(7.5);
  doc.setTextColor(...GREY);
  doc.setFont('helvetica', 'normal');

  const legalParts = [
    school.legalName,
    school.companiesHouseNo && `Reg No: ${school.companiesHouseNo}`,
    school.vatRegistered && school.vatNumber && `VAT No: ${school.vatNumber}`,
  ].filter(Boolean).join('   |   ');
  doc.text(legalParts, pageW / 2, footerY, { align: 'center' });

  const footerNote = school.invoice?.footerNote || 'Thank you for your payment.';
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text(footerNote, pageW / 2, footerY + 5, { align: 'center' });

  // ── Save ──────────────────────────────────────────────────────────────────────
  const filename = `${invoice.invoiceNumber || 'invoice'}_${studentName.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
