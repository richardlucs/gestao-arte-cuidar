
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export function formatCPF(cpf) {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

export const exportToPDF = (title, sections, isComplex = false) => {
  const doc = new jsPDF();
  let startY = 20;

  doc.text(title, 14, 15);

  if (isComplex) {
    sections.forEach(section => {
      if (section.data.length > 0) {
        doc.text(section.title, 14, startY);
        startY += 7;
        doc.autoTable({
          head: [section.headers],
          body: section.data.map(row => section.headers.map(header => row[header])),
          startY,
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185] },
        });
        startY = doc.autoTable.previous.finalY + 10;
      }
    });
  } else {
    doc.autoTable({
      head: [sections[0].headers],
      body: sections[0].data.map(row => sections[0].headers.map(header => row[header])),
      startY: 20,
    });
  }

  doc.save(`${title.toLowerCase().replace(/ /g, '_')}.pdf`);
};

export const exportToExcel = (sections, filename) => {
  const workbook = XLSX.utils.book_new();
  sections.forEach(section => {
    if (section.data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(section.data);
      // Clean up sheet title to be max 31 chars and no invalid chars
      const sheetTitle = section.title.replace(/[\\/*?[\]:]/g, "").substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle);
    }
  });
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
