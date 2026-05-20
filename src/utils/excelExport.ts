import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ─── Colores Corporativos ───
const BRAND_BLUE = '1E3A5F';
const BRAND_BLUE_LIGHT = 'EBF5FF';
const HEADER_FONT_COLOR = 'FFFFFF';
const BORDER_COLOR = 'B0BEC5';
const TOTAL_BG = 'E8F0FE';
const ACCENT_GREEN = '16A34A';
const ACCENT_RED = 'DC2626';

export interface ColumnDef {
  header: string;
  key: string;
  width?: number;
  style?: 'currency' | 'number' | 'text' | 'date' | 'percent';
  alignment?: 'left' | 'center' | 'right';
}

export interface SheetData {
  sheetName: string;
  title?: string;
  subtitle?: string;
  columns: ColumnDef[];
  rows: Record<string, any>[];
  totals?: Record<string, number | string>;
  companyInfo?: { ruc: string; name: string; period: string };
}

// ─── Thin border helper ───
const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: BORDER_COLOR } },
  left: { style: 'thin', color: { argb: BORDER_COLOR } },
  bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
  right: { style: 'thin', color: { argb: BORDER_COLOR } },
};

function applyColumnFormat(col: ColumnDef, cell: ExcelJS.Cell) {
  const align = col.alignment || (col.style === 'currency' || col.style === 'number' || col.style === 'percent' ? 'right' : 'left');
  cell.alignment = { horizontal: align, vertical: 'middle' };

  if (col.style === 'currency') {
    cell.numFmt = '#,##0.00';
  } else if (col.style === 'number') {
    cell.numFmt = '#,##0';
  } else if (col.style === 'percent') {
    cell.numFmt = '0.00%';
  }
}

/**
 * Adds a styled sheet to a workbook
 */
export function addStyledSheet(wb: ExcelJS.Workbook, data: SheetData): ExcelJS.Worksheet {
  const ws = wb.addWorksheet(data.sheetName);
  let currentRow = 1;

  // ─── Company Info Header ───
  if (data.companyInfo) {
    const titleRow = ws.getRow(currentRow);
    ws.mergeCells(currentRow, 1, currentRow, data.columns.length);
    titleRow.getCell(1).value = data.companyInfo.name || 'EMPRESA';
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: BRAND_BLUE } };
    titleRow.getCell(1).alignment = { horizontal: 'center' };
    titleRow.height = 24;
    currentRow++;

    const infoRow = ws.getRow(currentRow);
    ws.mergeCells(currentRow, 1, currentRow, data.columns.length);
    infoRow.getCell(1).value = `RUC: ${data.companyInfo.ruc}  |  Periodo: ${data.companyInfo.period}`;
    infoRow.getCell(1).font = { size: 9, color: { argb: '666666' } };
    infoRow.getCell(1).alignment = { horizontal: 'center' };
    currentRow++;
  }

  // ─── Title ───
  if (data.title) {
    const tRow = ws.getRow(currentRow);
    ws.mergeCells(currentRow, 1, currentRow, data.columns.length);
    tRow.getCell(1).value = data.title;
    tRow.getCell(1).font = { bold: true, size: 12, color: { argb: BRAND_BLUE } };
    tRow.getCell(1).alignment = { horizontal: 'center' };
    tRow.height = 22;
    currentRow++;
  }

  if (data.subtitle) {
    const sRow = ws.getRow(currentRow);
    ws.mergeCells(currentRow, 1, currentRow, data.columns.length);
    sRow.getCell(1).value = data.subtitle;
    sRow.getCell(1).font = { size: 9, italic: true, color: { argb: '888888' } };
    sRow.getCell(1).alignment = { horizontal: 'center' };
    currentRow++;
  }

  // blank row
  currentRow++;

  // ─── Column Headers ───
  const headerRowNum = currentRow;
  const headerRow = ws.getRow(headerRowNum);
  data.columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { bold: true, size: 10, color: { argb: HEADER_FONT_COLOR } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_BLUE } };
    cell.alignment = { horizontal: col.alignment || 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
    ws.getColumn(i + 1).width = col.width || 15;
  });
  headerRow.height = 28;
  currentRow++;

  // ─── Data Rows ───
  data.rows.forEach((rowData, rowIdx) => {
    const row = ws.getRow(currentRow);
    data.columns.forEach((col, i) => {
      const cell = row.getCell(i + 1);
      let value = rowData[col.key];

      // Auto-convert string numbers
      if (typeof value === 'string' && (col.style === 'currency' || col.style === 'number')) {
        const parsed = parseFloat(value.replace(/,/g, ''));
        if (!isNaN(parsed)) value = parsed;
      }

      cell.value = value ?? '';
      cell.border = thinBorder;
      cell.font = { size: 9 };
      applyColumnFormat(col, cell);

      // Alternating row colors
      if (rowIdx % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_BLUE_LIGHT } };
      }

      // Color currency values
      if (col.style === 'currency' && typeof value === 'number') {
        cell.font = { size: 9, bold: true, color: { argb: value < 0 ? ACCENT_RED : '333333' } };
      }
    });
    row.height = 18;
    currentRow++;
  });

  // ─── Totals Row ───
  if (data.totals) {
    const totRow = ws.getRow(currentRow);
    data.columns.forEach((col, i) => {
      const cell = totRow.getCell(i + 1);
      const val = data.totals![col.key];
      cell.value = val ?? '';
      cell.border = {
        top: { style: 'double', color: { argb: BRAND_BLUE } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'double', color: { argb: BRAND_BLUE } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } },
      };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
      cell.font = { bold: true, size: 10, color: { argb: BRAND_BLUE } };
      applyColumnFormat(col, cell);
    });
    totRow.height = 24;
  }

  // Auto-filter on header
  ws.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to: { row: headerRowNum, column: data.columns.length },
  };

  return ws;
}

/**
 * Export a single sheet as a downloadable .xlsx
 */
export async function exportSingleSheet(data: SheetData, filename: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SoftContable';
  wb.created = new Date();
  addStyledSheet(wb, data);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
}

/**
 * Export multiple sheets as a single downloadable .xlsx
 */
export async function exportMultipleSheets(sheets: SheetData[], filename: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SoftContable';
  wb.created = new Date();

  sheets.forEach(s => addStyledSheet(wb, s));

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
}
