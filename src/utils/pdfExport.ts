import { jsPDF } from 'jspdf';
import {
  ARCHITECTURE_OVERVIEW,
  CLASS_DIAGRAM_ASCII,
  COMPILE_RUN_INSTRUCTIONS,
  CONCURRENCY_NOTE,
  JAVA_SOURCE_FILES,
  SAMPLE_OUTPUT
} from '../data/railwaySourceData';

export interface PdfExportOptions {
  includeDocs: boolean;
  fileIds?: string[];
}

/**
 * Generates and downloads a multi-page A4 PDF containing the Railway Reservation Java 17+ source code
 * and optional architecture/documentation sections.
 */
export function generateJavaCodePdf(options: PdfExportOptions = { includeDocs: true }): number {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const marginTop = 48;
  const marginBottom = 46;
  const contentWidth = pageWidth - marginX * 2;
  let cursorY = marginTop;

  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      cursorY = marginTop;
    }
  };

  const writeHeading = (title: string, size = 14) => {
    ensureSpace(size + 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(15, 23, 42);
    doc.text(title, marginX, cursorY);
    cursorY += size + 6;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.75);
    doc.line(marginX, cursorY - 2, pageWidth - marginX, cursorY - 2);
    cursorY += 10;
  };

  const writeProse = (text: string, fontSize = 9.5) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(51, 65, 85);
    const lineHeight = fontSize * 1.45;
    const paragraphs = text.split('\n');
    for (const para of paragraphs) {
      if (para.trim() === '') {
        cursorY += lineHeight * 0.6;
        continue;
      }
      const wrapped = doc.splitTextToSize(para, contentWidth) as string[];
      for (const line of wrapped) {
        ensureSpace(lineHeight);
        doc.text(line, marginX, cursorY);
        cursorY += lineHeight;
      }
    }
    cursorY += 8;
  };

  const writeCodeBlock = (code: string, fontSize = 7.8) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(15, 23, 42);
    const lineHeight = fontSize * 1.38;
    const rawLines = code.split('\n');
    const expandedLines: string[] = [];
    for (const raw of rawLines) {
      if (raw === '') {
        expandedLines.push('');
      } else {
        const wrapped = doc.splitTextToSize(raw, contentWidth - 16) as string[];
        expandedLines.push(...wrapped);
      }
    }

    for (const line of expandedLines) {
      ensureSpace(lineHeight + 2);
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, cursorY - fontSize + 1, contentWidth, lineHeight, 'F');
      doc.text(line, marginX + 8, cursorY);
      cursorY += lineHeight;
    }
    cursorY += 12;
  };

  // Cover / Header Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('Railway Reservation & Ticket Cancellation System', marginX, cursorY);
  cursorY += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Java 17+ Console Application  ·  28 Source Files  ·  Thread-Safe In-Memory Architecture', marginX, cursorY);
  cursorY += 22;

  const selectedFiles = options.fileIds
    ? JAVA_SOURCE_FILES.filter((f) => options.fileIds!.includes(f.id))
    : JAVA_SOURCE_FILES;

  // Table of Contents
  writeHeading('Source Files Index', 12);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  selectedFiles.forEach((file, index) => {
    ensureSpace(12);
    const num = String(index + 1).padStart(2, '0');
    doc.text(`${num}. ${file.filePath}`, marginX, cursorY);
    cursorY += 11.5;
  });
  cursorY += 14;

  if (options.includeDocs) {
    writeHeading('Architecture Overview', 13);
    writeProse(ARCHITECTURE_OVERVIEW);

    writeHeading('Class Diagram', 13);
    writeCodeBlock(CLASS_DIAGRAM_ASCII, 7.0);
  }

  // Java Source Code Sections
  selectedFiles.forEach((file, index) => {
    const label = `${index + 1}. ${file.filePath}`;
    ensureSpace(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(label, marginX, cursorY);
    cursorY += 13;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(file.summary, marginX, cursorY);
    cursorY += 12;

    writeCodeBlock(file.code, 7.8);
  });

  if (options.includeDocs) {
    writeHeading('Compile & Run Instructions', 13);
    writeCodeBlock(COMPILE_RUN_INSTRUCTIONS, 8.2);

    writeHeading('Sample Console Output', 13);
    writeCodeBlock(SAMPLE_OUTPUT, 7.5);

    writeHeading('Concurrency & Double-Booking Prevention', 13);
    writeProse(CONCURRENCY_NOTE);
  }

  // Page numbers across all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Railway Reservation System (Java 17+)  ·  Page ${i} of ${totalPages}`,
      marginX,
      pageHeight - 22
    );
  }

  doc.save('Railway_Reservation_System_Java17.pdf');
  return totalPages;
}
