import { Term, TermTranslations } from '../types/glossaryTypes';
import html2pdf from 'html2pdf.js';

/**
 * Generate CSV data for term export
 * @param data Array of terms to export
 * @param translationsCache Cache of translations data
 * @param includeHeader Whether to include a header row
 * @returns CSV formatted string
 */
export const generateCSV = (data: Term[], includeHeader = true): string => {
  // Define CSV headers - removed Category and Language
  const headers = ['Term', 'Definition'];

  // Map the data to CSV rows - removed Category and Language
  const dataRows = data.map((item) => {
    return [
      `"${item.term.replace(/"/g, '""')}"`, // Escape quotes in CSV
      `"${item.definition.replace(/"/g, '""')}"`,
    ].join(',');
  });

  // Combine headers and data
  return includeHeader
    ? [headers.join(','), ...dataRows].join('\n')
    : dataRows.join('\n');
};

/**
 * Generate HTML Table for export
 * @param data Array of terms to export
 * @param translationsCache Cache of translations data
 * @param categoryName Optional category name for title
 * @returns HTML document as string
 */
export const generateHTMLTable = (
  data: Term[],
  categoryName?: string | null,
): string => {
  // Define headers - removed Category and Language
  const headers = ['Term', 'Definition'];

  // Create HTML style for the table as concatenated string to avoid template literal issues
  const tableStyle =
    '<style>' +
    'table {' +
    '  border-collapse: collapse;' +
    '  width: 100%;' +
    '  font-family: Arial, sans-serif;' +
    '}' +
    'th, td {' +
    '  border: 1px solid #ddd;' +
    '  padding: 8px;' +
    '  text-align: left;' +
    '}' +
    'th {' +
    '  background-color: #f2f2f2;' +
    '  color: #333;' +
    '  font-weight: bold;' +
    '}' +
    'tr:nth-child(even) {' +
    '  background-color: #f9f9f9;' +
    '}' +
    'tr:hover {' +
    '  background-color: #f1f1f1;' +
    '}' +
    'h1 {' +
    '  font-family: Arial, sans-serif;' +
    '  color: #1e40af;' +
    '  padding-bottom: 10px;' +
    '  border-bottom: 1px solid #eee;' +
    '}' +
    '.subtitle {' +
    '  color: #4b5563;' +
    '  font-size: 1.1em;' +
    '  margin-top: -5px;' +
    '  margin-bottom: 15px;' +
    '}' +
    '.timestamp {' +
    '  color: #666;' +
    '  font-size: 0.8em;' +
    '  margin-bottom: 20px;' +
    '}' +
    '</style>';
  // Create table rows - removed Category and Language columns
  let tableRowsStr = '';
  for (const item of data) {
    tableRowsStr +=
      '<tr>' +
      '<td>' +
      item.term.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
      '</td>' +
      '<td>' +
      item.definition.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
      '</td>' +
      '</tr>';
  }

  // Generate the export date
  const exportDate = new Date().toLocaleString();

  // Create a title based on category if provided
  const title = categoryName
    ? 'Marito Glossary: ' + categoryName
    : 'Marito Glossary';
  const subtitle = categoryName
    ? 'Terms in ' + categoryName + ' category'
    : 'Complete Glossary';

  // Create table header
  let tableHeaderStr = '<tr>';
  for (const header of headers) {
    tableHeaderStr += '<th>' + header + '</th>';
  }
  tableHeaderStr += '</tr>';

  // Combine all parts into a complete HTML document
  return (
    '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '<title>' +
    title +
    '</title>' +
    tableStyle +
    '</head>' +
    '<body>' +
    '<h1>' +
    title +
    '</h1>' +
    '<div class="subtitle">' +
    subtitle +
    '</div>' +
    '<div class="timestamp">Export generated on: ' +
    exportDate +
    '</div>' +
    '<table>' +
    tableHeaderStr +
    tableRowsStr +
    '</table>' +
    '</body>' +
    '</html>'
  );
};

/**
 * Generate PDF from HTML table
 * @param data Array of terms to export
 * @param translationsCache Cache of translations data
 * @param categoryName Optional category name for title
 */
export const generatePDF = async (
  data: Term[],
  categoryName?: string | null,
): Promise<void> => {
  try {
    const htmlContent = generateHTMLTable(data, categoryName);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const categoryPrefix = categoryName
      ? `${categoryName.toLowerCase().replace(/\s+/g, '-')}-`
      : '';

    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);

    const options = {
      margin: 10,
      filename: `marito-glossary-${categoryPrefix}${timestamp}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    };

    // Await the PDF generation and save
    await html2pdf().from(element).set(options).save();

    // Remove the temporary element
    document.body.removeChild(element);
  } catch (error: unknown) {
    console.error('PDF generation failed:', error);
    // You might want to add user notification here
    throw error; // Re-throw if you want calling code to handle it
  }
};
/**
 * Download data in the specified format
 * @param data Array of terms to download
 * @param format Format to download (csv, json, html, pdf)
 * @param translationsCache Cache of translations data
 * @param categoryName Optional category name
 */
export const downloadData = (
  data: Term[],
  format: 'csv' | 'json' | 'html' | 'pdf',
  translationsCache: Record<string, TermTranslations | null>, // Kept but unused parameter for backward compatibility with GlossaryPage.tsx calls
  categoryName?: string | null,
): void => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const categoryPrefix = categoryName
    ? `${categoryName.toLowerCase().replace(/\s+/g, '-')}-`
    : '';
  // Handle PDF format separately
  if (format === 'pdf') {
    // Using void operator to explicitly mark the promise as intentionally not awaited
    void generatePDF(data, categoryName).catch((error: unknown) => {
      console.error('Error generating PDF:', error);
      // Optionally add user-facing error handling here
    });
    return;
  }

  let content: string;
  let filename: string;
  let mimeType: string;

  if (format === 'csv') {
    content = generateCSV(data);
    filename = `marito-glossary-${categoryPrefix}${timestamp}.csv`;
    mimeType = 'text/csv';
  } else if (format === 'html') {
    content = generateHTMLTable(data, categoryName);
    filename = `marito-glossary-${categoryPrefix}${timestamp}.html`;
    mimeType = 'text/html';
  } else {
    // For JSON, exclude the id and category fields
    const cleanedData = data.map((item) => {
      const { ...rest } = item; //add id and category later
      return {
        ...rest,
      };
    });
    content = JSON.stringify(cleanedData, null, 2);
    filename = `marito-glossary-${categoryPrefix}${timestamp}.json`;
    mimeType = 'application/json';
  }

  // Create download link
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
