import * as XLSX from 'xlsx';

export const exportTableToXLSX = (tableId: string, filename: string) => {
  const table = document.getElementById(tableId);
  if (!table) {
    console.error(`Table with ID ${tableId} not found.`);
    return;
  }

  const rows = table.querySelectorAll('tr');
  const matrix: any[][] = [];
  const merges: XLSX.Range[] = [];

  rows.forEach((row, rowIndex) => {
    if (!matrix[rowIndex]) matrix[rowIndex] = [];
    let colIndex = 0;

    const cols = row.querySelectorAll('th, td');
    cols.forEach(col => {
      while (matrix[rowIndex][colIndex] !== undefined) {
        colIndex++;
      }

      const input = col.querySelector('input');
      const text = input 
        ? (input.value || '0') 
        : (col as HTMLElement).innerText;
      
      let cellValue: string | number = text;
      if (typeof text === 'string') {
        const cleanNumber = text.replace(/,/g, '').trim();
        // Avoid parsing dates or codes like '05-202603-0001'
        if (/^-?\d+(\.\d+)?$/.test(cleanNumber)) {
           cellValue = parseFloat(cleanNumber);
        }
      }

      const cSpan = (col as HTMLTableCellElement).colSpan || 1;
      const rSpan = (col as HTMLTableCellElement).rowSpan || 1;

      for (let r = 0; r < rSpan; r++) {
        for (let c = 0; c < cSpan; c++) {
          if (!matrix[rowIndex + r]) matrix[rowIndex + r] = [];
          matrix[rowIndex + r][colIndex + c] = (r === 0 && c === 0) ? cellValue : null;
        }
      }

      if (cSpan > 1 || rSpan > 1) {
        merges.push({
          s: { r: rowIndex, c: colIndex },
          e: { r: rowIndex + rSpan - 1, c: colIndex + cSpan - 1 }
        });
      }
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(matrix);
  if (merges.length > 0) ws['!merges'] = merges;
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportRawDataToXLSX = (filename: string, data: (string | number)[][]) => {
  const cleanData = data.map(row => 
    row.map(cell => {
      if (typeof cell === 'string') {
        const cleanNumber = cell.replace(/,/g, '').trim();
        if (/^-?\d+(\.\d+)?$/.test(cleanNumber)) {
            return parseFloat(cleanNumber);
        }
      }
      return cell;
    })
  );

  const ws = XLSX.utils.aoa_to_sheet(cleanData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};
