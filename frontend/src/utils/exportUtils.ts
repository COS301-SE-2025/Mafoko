import { Term, TermTranslations } from '../types/glossaryTypes';
// We're using dynamic imports for these to reduce initial bundle size
// import { jsPDF } from 'jspdf';
// import html2canvas from 'html2canvas';

/**
 * Convert logo image to base64 for embedding in HTML exports
 * @returns Promise<string> Base64 encoded image data URI
 */
const getLogoAsBase64 = async (): Promise<string> => {
  try {
    // Fetch the 192px DSFSI logo
    // This path maps to: frontend/public/icons/DFSI_Logo_192.png (dev) or frontend/dist/icons/DFSI_Logo_192.png (prod)
    const response = await fetch('/icons/DFSI_Logo_192.png');
    if (!response.ok) {
      throw new Error('Failed to fetch logo');
    }
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to load logo for HTML export:', error);
    // Return the actual DSFSI logo as base64 fallback
    return 'data:image/png;base64,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';
  }
};

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
 * @param categoryName Optional category name for title
 * @returns Promise<string> HTML document as string
 */
export const generateHTMLTable = async (
  data: Term[],
  categoryName?: string | null,
): Promise<string> => {
  // Define headers - removed Category and Language
  const headers = ['Term', 'Definition'];

  // Create HTML style for the table as concatenated string to avoid template literal issues
  const tableStyle =
    '<style>' +
    'body {' +
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;' +
    '  margin: 20px;' +
    '  background-color: #f8f9fa;' +
    '  color: #333;' +
    '}' +
    'table {' +
    '  border-collapse: collapse;' +
    '  width: 100%;' +
    '  background-color: white;' +
    '  border-radius: 8px;' +
    '  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);' +
    '  overflow: hidden;' +
    '}' +
    'th {' +
    '  background-color: #2d3748;' +
    '  color: white;' +
    '  font-weight: 600;' +
    '  padding: 16px 20px;' +
    '  text-align: left;' +
    '  font-size: 14px;' +
    '  letter-spacing: 0.025em;' +
    '  text-transform: uppercase;' +
    '  border: none;' +
    '}' +
    'td {' +
    '  padding: 16px 20px;' +
    '  border-bottom: 1px solid #e2e8f0;' +
    '  font-size: 14px;' +
    '  line-height: 1.5;' +
    '  vertical-align: top;' +
    '}' +
    'tr:nth-child(even) td {' +
    '  background-color: #f7fafc;' +
    '}' +
    'tr:nth-child(odd) td {' +
    '  background-color: white;' +
    '}' +
    'tr:hover td {' +
    '  background-color: #edf2f7;' +
    '}' +
    'tr:last-child td {' +
    '  border-bottom: none;' +
    '}' +
    'h1 {' +
    '  font-size: 28px;' +
    '  font-weight: 700;' +
    '  color: #1a202c;' +
    '  margin-bottom: 8px;' +
    '  margin-top: 0;' +
    '}' +
    '.header-section {' +
    '  display: flex;' +
    '  align-items: center;' +
    '  justify-content: space-between;' +
    '  margin-bottom: 24px;' +
    '  padding-bottom: 16px;' +
    '  border-bottom: 2px solid #e2e8f0;' +
    '}' +
    '.title-section {' +
    '  flex: 1;' +
    '}' +
    '.logo-section {' +
    '  display: flex;' +
    '  align-items: center;' +
    '  gap: 12px;' +
    '}' +
    '.dsfsi-logo {' +
    '  width: 60px;' +
    '  height: 60px;' +
    '  object-fit: contain;' +
    '}' +
    '.dsfsi-text {' +
    '  font-size: 14px;' +
    '  color: #4a5568;' +
    '  font-weight: 500;' +
    '  line-height: 1.4;' +
    '}' +
    '.subtitle {' +
    '  color: #4a5568;' +
    '  font-size: 16px;' +
    '  margin-bottom: 24px;' +
    '  font-weight: 500;' +
    '}' +
    '.timestamp {' +
    '  color: #718096;' +
    '  font-size: 12px;' +
    '  margin-bottom: 32px;' +
    '  padding: 8px 12px;' +
    '  background-color: #edf2f7;' +
    '  border-radius: 4px;' +
    '  display: inline-block;' +
    '}' +
    '@media print {' +
    '  body { background-color: white; margin: 0; }' +
    '  table { box-shadow: none; }' +
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

  // Create table header with explicit styling to ensure proper rendering
  let tableHeaderStr = '<tr style="background-color: #2d3748; color: white;">';
  for (const header of headers) {
    tableHeaderStr +=
      '<th style="padding: 16px 20px; font-weight: 600; text-align: left;">' +
      header +
      '</th>';
  }
  tableHeaderStr += '</tr>';

  // Get the logo as base64 for embedding
  const logoBase64 = await getLogoAsBase64();

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
    '<div class="header-section">' +
    '<div class="title-section">' +
    '<h1>' +
    title +
    '</h1>' +
    '<div class="subtitle">' +
    subtitle +
    '</div>' +
    '</div>' +
    '<div class="logo-section">' +
    '<img src="' +
    logoBase64 +
    '" class="dsfsi-logo" alt="DSFSI Logo" />' +
    '<div class="dsfsi-text">Data Science for<br/>Social Impact</div>' +
    '</div>' +
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
 * Generate PDF from HTML table directly in the current page
 * @param data Array of terms to export
 * @param categoryName Optional category name for title
 */
export const generatePDF = async (
  data: Term[],
  categoryName?: string | null,
): Promise<void> => {
  try {
    // Create a modal overlay to prevent interactions and provide feedback
    const overlayId = 'pdf-generation-overlay';
    let overlay = document.getElementById(overlayId);

    // Create the overlay if it doesn't exist
    if (!overlay) {
      // Get theme variables from CSS
      const isDarkMode =
        document.documentElement.classList.contains('theme-dark');
      const accentColor = '#f00a50'; // Primary pink accent color
      const backgroundColor = isDarkMode ? '#363b4d' : '#ffffff';
      const textColor = isDarkMode ? '#ffffff' : '#212431';
      const borderColor = isDarkMode ? '#4a5568' : '#d1d5db';

      overlay = document.createElement('div');
      overlay.id = overlayId;
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(33, 36, 49, 0.85)'; // Dark blue background with opacity
      overlay.style.zIndex = '9999';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.color = textColor;
      overlay.style.fontSize = '16px';

      // Create a modal container that matches the glossary card style
      const modalContainer = document.createElement('div');
      modalContainer.style.backgroundColor = backgroundColor;
      modalContainer.style.borderRadius = '12px';
      modalContainer.style.padding = '30px';
      modalContainer.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
      modalContainer.style.display = 'flex';
      modalContainer.style.flexDirection = 'column';
      modalContainer.style.alignItems = 'center';
      modalContainer.style.justifyContent = 'center';
      modalContainer.style.maxWidth = '500px';
      modalContainer.style.width = '90%';

      // Create a header with the app's accent color
      const header = document.createElement('div');
      header.textContent = 'Generating PDF';
      header.style.color = accentColor;
      header.style.fontSize = '22px';
      header.style.fontWeight = '600';
      header.style.marginBottom = '20px';
      header.style.width = '100%';
      header.style.textAlign = 'center';

      const spinner = document.createElement('div');
      spinner.style.width = '50px';
      spinner.style.height = '50px';
      spinner.style.border = `5px solid ${borderColor}`;
      spinner.style.borderTop = `5px solid ${accentColor}`; // Pink accent color
      spinner.style.borderRadius = '50%';
      spinner.style.marginBottom = '25px';
      spinner.style.animation = 'spin 1s linear infinite';

      const style = document.createElement('style');
      style.textContent =
        '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);

      const message = document.createElement('div');
      message.id = 'pdf-generation-message';
      message.style.textAlign = 'center';
      message.style.maxWidth = '100%';
      message.style.padding = '0 20px';
      message.style.marginBottom = '20px';
      message.style.fontSize = '16px';
      message.style.color = textColor;

      const progressContainer = document.createElement('div');
      progressContainer.style.width = '100%';
      progressContainer.style.height = '8px';
      progressContainer.style.backgroundColor = borderColor;
      progressContainer.style.borderRadius = '4px';
      progressContainer.style.overflow = 'hidden';
      progressContainer.style.marginTop = '10px';

      const progressBar = document.createElement('div');
      progressBar.id = 'pdf-generation-progress';
      progressBar.style.width = '0%';
      progressBar.style.height = '100%';
      progressBar.style.backgroundColor = accentColor; // Pink accent color
      progressBar.style.transition = 'width 0.3s ease';

      progressContainer.appendChild(progressBar);

      // Assemble the modal
      modalContainer.appendChild(header);
      modalContainer.appendChild(spinner);
      modalContainer.appendChild(message);
      modalContainer.appendChild(progressContainer);

      overlay.appendChild(modalContainer);
      document.body.appendChild(overlay);
    }

    // Get references to the message and progress bar
    const message = document.getElementById('pdf-generation-message');
    const progressBar = document.getElementById('pdf-generation-progress');

    if (!message || !progressBar) {
      throw new Error('Failed to create UI elements');
    }

    // Show initial message
    message.textContent = `Preparing PDF with ${String(data.length)} terms, please wait...`;
    progressBar.style.width = '10%';

    // Generate the HTML content
    const htmlContent = await generateHTMLTable(data, categoryName);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const categoryPrefix = categoryName
      ? `${categoryName.toLowerCase().replace(/\s+/g, '-')}-`
      : '';

    const filename = `marito-glossary-${categoryPrefix}${timestamp}.pdf`;
    progressBar.style.width = '20%';

    try {
      // Update message
      message.textContent = 'Rendering content...';

      // Determine if this is a large dataset (affects rendering strategy)
      const isLargeDataset = data.length > 100;

      // Create an off-screen iframe to render the content properly
      const iframe = document.createElement('iframe');
      iframe.style.width = '800px';
      iframe.style.height = '1200px';
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.border = 'none';

      // Append iframe to body
      document.body.appendChild(iframe);
      progressBar.style.width = '30%';

      // Wait for iframe to load
      await new Promise<void>((resolve) => {
        iframe.onload = () => {
          resolve();
        };

        // Write the HTML content to the iframe
        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          // Replace document.write with a safer alternative
          doc.documentElement.innerHTML = htmlContent;
          doc.close();
        } else {
          // If iframe document is not available, resolve anyway
          resolve();
        }
      });

      // Update message
      message.textContent = 'Generating PDF...';
      progressBar.style.width = '40%';

      // Get the document from the iframe
      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Failed to access iframe document');
      }

      // Import libraries dynamically
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      progressBar.style.width = '50%';

      // Process in smaller chunks for large datasets to avoid memory issues

      // Create PDF with compression
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // PDF dimensions (A4 format)
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 10; // margin in mm
      const usableWidth = pageWidth - 2 * margin;

      // Process the table in chunks to avoid memory issues
      message.textContent = 'Processing content in chunks...';

      // Get the table element from the iframe
      const tableElement = iframeDoc.querySelector('table');
      if (!tableElement) {
        throw new Error('Could not find table element in generated content');
      }

      // Get the header row for consistent table formatting
      // Specifically target the first row that contains th elements for better reliability
      const headerRow = tableElement.querySelector('tr:first-child');
      if (!headerRow) {
        throw new Error('Could not find header row in table');
      }

      // Make sure the header has the correct styling
      const headerCells = headerRow.querySelectorAll('th');
      headerCells.forEach((cell) => {
        if (cell instanceof HTMLElement) {
          cell.style.backgroundColor = '#2d3748'; // Match table style
          cell.style.color = 'white';
          cell.style.fontWeight = 'bold';
          cell.style.padding = '16px 20px';
        }
      });

      let currentPage = 1;
      let yPosition = margin;

      // Function to add header to current page
      const addHeaderToPage = async () => {
        // Add the logo and title section at the top of each page
        const headerSection = iframeDoc.querySelector('.header-section');
        if (headerSection && currentPage === 1) {
          // Only add header to first page to save space
          const canvas = await html2canvas(headerSection as HTMLElement, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            allowTaint: true,
          });

          const headerWidth = usableWidth;
          const headerImgWidth = canvas.width;
          const headerImgHeight = canvas.height;
          const headerHeight = (headerImgHeight * headerWidth) / headerImgWidth;

          const headerImgData = canvas.toDataURL('image/png', 0.95);
          pdf.addImage(
            headerImgData,
            'PNG',
            margin,
            yPosition,
            headerWidth,
            headerHeight,
          );

          yPosition += headerHeight + 5; // Add some space after header
        }

        // Add table header to each page - properly awaited
        const canvas = await html2canvas(headerRow as HTMLElement, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          allowTaint: true,
        });

        const headerWidth = usableWidth;
        const headerImgWidth = canvas.width;
        const headerImgHeight = canvas.height;
        const headerHeight = (headerImgHeight * headerWidth) / headerImgWidth;

        const headerImgData = canvas.toDataURL('image/png', 0.95);
        pdf.addImage(
          headerImgData,
          'PNG',
          margin,
          yPosition,
          headerWidth,
          headerHeight,
        );

        yPosition += headerHeight;
        return headerHeight;
      };

      // Add the initial header
      await addHeaderToPage();

      // Process each row in chunks
      const rows = tableElement.querySelectorAll('tr');

      // Apply a proper margin after the header row to ensure content alignment
      yPosition += 2; // Small gap between header and content

      // Skip the header row (index 0)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        // Check if we need to start a new page
        if (yPosition > pageHeight - margin * 2) {
          pdf.addPage();
          currentPage++;
          yPosition = margin;
          await addHeaderToPage();
          yPosition += 2; // Small gap after header on new pages too
        }

        // Convert this row to canvas
        try {
          const canvas = await html2canvas(row as HTMLElement, {
            scale: isLargeDataset ? 1.2 : 1.5, // Lower scale for large datasets to save memory
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: i % 2 === 0 ? '#f7fafc' : '#ffffff', // Maintain alternating row colors
          });

          const rowWidth = usableWidth;
          const rowImgWidth = canvas.width;
          const rowImgHeight = canvas.height;
          const rowHeight = (rowImgHeight * rowWidth) / rowImgWidth;

          // Check if this row would go beyond the page
          if (yPosition + rowHeight > pageHeight - margin) {
            pdf.addPage();
            currentPage++;
            yPosition = margin;
            await addHeaderToPage();
          }

          // Add this row to the PDF
          const rowImgData = canvas.toDataURL('image/png', 0.92);
          pdf.addImage(
            rowImgData,
            'PNG',
            margin,
            yPosition,
            rowWidth,
            rowHeight,
          );

          // Move position for next row
          yPosition += rowHeight;

          // Update progress
          const progress = Math.min(90, 50 + (i / (rows.length - 1)) * 40);
          progressBar.style.width = `${String(progress)}%`;
          message.textContent = `Creating PDF - Page ${String(currentPage)}, Term ${String(i)} of ${String(rows.length - 1)}`;

          // Give the browser a chance to update the UI and free memory
          if (i % (isLargeDataset ? 5 : 10) === 0) {
            // For large datasets, free memory more frequently by allowing garbage collection
            await new Promise((resolve) =>
              setTimeout(resolve, isLargeDataset ? 30 : 10),
            );
          }
        } catch (rowError) {
          console.warn(`Error processing row ${String(i)}:`, rowError);
          // Skip this row and continue
          continue;
        }
      }

      progressBar.style.width = '95%';
      message.textContent = 'Saving PDF...';

      // Add footer with page numbers
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `Page ${String(i)} of ${String(totalPages)}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' },
        );
      }

      // Save the PDF with a small delay to allow UI updates
      setTimeout(() => {
        pdf.save(filename);

        // Clean up
        document.body.removeChild(iframe);

        // Update success message
        message.textContent = 'PDF downloaded successfully!';
        progressBar.style.width = '100%';

        // Update header to indicate success
        const header = overlay.querySelector(
          'div:first-child',
        ) as HTMLDivElement;
        header.textContent = 'Export Complete';
        header.style.color = '#00ceaf'; // Use teal accent for success          // Remove the overlay after a delay
        setTimeout(() => {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
        }, 2000);
      }, 200);
    } catch (error) {
      console.error('Error in PDF generation:', error);

      // Get references again to ensure they exist
      const message = document.getElementById('pdf-generation-message');
      const progressBar = document.getElementById('pdf-generation-progress');
      const overlay = document.getElementById('pdf-generation-overlay');

      // Update the header text to indicate error
      if (overlay) {
        const header = overlay.querySelector(
          'div:first-child',
        ) as HTMLDivElement;
        header.textContent = 'PDF Generation Failed';
        header.style.color = '#f00a50'; // Error color
      }

      if (message) {
        message.textContent =
          'Failed to generate PDF. Trying alternative method...';
      }

      // Set progressBar styles
      if (progressBar) {
        progressBar.style.width = '50%';
        progressBar.style.backgroundColor = '#f00a50'; // Use project's accent color for error
      }

      // Fallback method using simpler approach with jsPDF directly
      try {
        // Update the message
        if (message) {
          message.textContent = 'Trying alternative PDF generation method...';
        }

        // Import jsPDF
        const { jsPDF } = await import('jspdf');

        // Create a new PDF with simpler approach
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true,
        });

        // Setup basic PDF properties
        const pageWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const margin = 20;

        // Add title
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(
          categoryName ? `Marito Glossary: ${categoryName}` : 'Marito Glossary',
          margin,
          margin,
        );

        // Add timestamp
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `Generated on: ${new Date().toLocaleString()}`,
          margin,
          margin + 10,
        );

        // Add a divider line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, margin + 15, pageWidth - margin, margin + 15);

        // Setup for content
        pdf.setFontSize(12);
        let y = margin + 25;

        // Add header row with filled background
        pdf.setFillColor(45, 55, 72);
        pdf.rect(margin, y - 6, pageWidth - margin * 2, 8, 'F');

        // Add header text
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Term', margin + 2, y);
        pdf.text('Definition', pageWidth / 2, y);

        // Reset text color for content
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        y += 10;

        // Add data rows
        for (let i = 0; i < data.length; i++) {
          // Update progress
          if (progressBar && i % 5 === 0) {
            const progress = Math.min(95, 50 + (i / data.length) * 45);
            progressBar.style.width = `${String(progress)}%`;
            if (message) {
              message.textContent = `Processing term ${String(i + 1)} of ${String(data.length)}...`;
            }
          }

          const term = data[i];

          // Check if we need a new page
          if (y > pageHeight - margin * 2) {
            pdf.addPage();
            y = margin;

            // Add header to new page
            pdf.setFillColor(45, 55, 72);
            pdf.rect(margin, y - 6, pageWidth - margin * 2, 8, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Term', margin + 2, y);
            pdf.text('Definition', pageWidth / 2, y);
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'normal');
            y += 10;
          }

          // Add term
          pdf.text(term.term.substring(0, 30), margin, y);

          // Add definition with wrapping
          const definition = term.definition;
          const maxWidth = pageWidth - margin * 2 - (pageWidth / 2 - margin);
          const splitText = pdf.splitTextToSize(
            definition,
            maxWidth,
          ) as string[];

          // Position and add the definition text
          pdf.text(splitText, pageWidth / 2, y);

          // Calculate height for the row based on number of lines in definition
          const lineHeight = 7;
          const lines = splitText.length > 1 ? splitText.length : 1;
          y += Math.max(8, lines * lineHeight);

          // Add a light separator line between rows
          if (i < data.length - 1) {
            pdf.setDrawColor(230, 230, 230);
            pdf.line(margin, y - 3, pageWidth - margin, y - 3);
          }
        }

        // Save the PDF
        pdf.save(filename);

        if (message) {
          const successIcon = '✓';
          message.innerHTML = `<span style="color:#00ceaf; font-weight: bold; margin-right:6px;">${successIcon}</span> PDF generated successfully`;
        }

        if (progressBar) {
          progressBar.style.width = '100%';
          progressBar.style.backgroundColor = '#00ceaf';
        }

        if (progressBar) {
          progressBar.style.width = '100%';
          progressBar.style.backgroundColor = '#00ceaf'; // Use project's teal accent for fallback success
        }

        // Update header for success
        const header = overlay?.querySelector(
          'div:first-child',
        ) as HTMLDivElement;
        header.textContent = 'PDF Generated Successfully';
        header.style.color = '#00ceaf'; // Success color

        // Remove the overlay after 5 seconds
        setTimeout(() => {
          if (overlay && document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
        }, 5000);
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError);

        if (message) {
          message.textContent = 'Export failed. Please try again later.';
        }

        // Remove the overlay after 5 seconds
        setTimeout(() => {
          if (overlay && document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
        }, 5000);
      }
    }

    // For large datasets that still fail, try another approach
    if (data.length > 100) {
      console.warn('Large dataset detected, trying simplified approach');

      // Show user feedback
      message.textContent =
        'Using simplified PDF generation for large dataset...';

      try {
        // Create a more basic PDF with just text (no styling) for better performance
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true,
        });

        // Set up dimensions
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 20;

        // Set font size and line height
        pdf.setFontSize(12);
        let y = margin;

        // Add title
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(
          categoryName ? `Marito Glossary: ${categoryName}` : 'Marito Glossary',
          margin,
          y,
        );
        y += 10;

        // Add export date
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text(
          `Export generated on: ${new Date().toLocaleString()}`,
          margin,
          y,
        );
        y += 15;

        // Add column headers with background color simulation
        pdf.setFillColor(45, 55, 72); // #2d3748 - match the table header color
        pdf.rect(margin, y - 6, pageWidth - margin * 2, 8, 'F');

        pdf.setTextColor(255, 255, 255); // White text for header
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('Term', margin + 5, y);
        pdf.text('Definition', pageWidth / 2, y);
        pdf.setTextColor(0, 0, 0); // Reset text color for content
        y += 10;

        // Add data rows
        pdf.setFont('helvetica', 'normal');
        for (let i = 0; i < data.length; i++) {
          const term = data[i];

          // Check if we need a new page
          if (y > pageHeight - margin) {
            pdf.addPage();
            y = margin;

            // Add column headers to new page with background color
            pdf.setFillColor(45, 55, 72); // #2d3748 - match the table header color
            pdf.rect(margin, y - 6, pageWidth - margin * 2, 8, 'F');

            pdf.setTextColor(255, 255, 255); // White text for header
            pdf.setFont('helvetica', 'bold');
            pdf.text('Term', margin + 5, y);
            pdf.text('Definition', pageWidth / 2, y);
            pdf.setTextColor(0, 0, 0); // Reset text color for content
            y += 10;
            pdf.setFont('helvetica', 'normal');
          }

          // Add term and definition
          pdf.text(term.term.substring(0, 30), margin, y);

          // Split definition into multiple lines if needed
          const definition = term.definition;
          const maxWidth = pageWidth - margin * 2 - (pageWidth / 2 - margin);
          const splitText = pdf.splitTextToSize(
            definition,
            maxWidth,
          ) as string[];
          const lines = splitText.length;

          if (lines <= 1) {
            pdf.text(definition, pageWidth / 2, y);
            y += 8;
          } else {
            // Handle multiline text
            pdf.text(splitText, pageWidth / 2, y);
            y += lines * 5 + 3;
          }

          // Update progress
          if (i % 10 === 0) {
            progressBar.style.width = `${String(Math.min(95, 50 + (i / data.length) * 45))}%`;
            message.textContent = `Processing term ${String(i + 1)} of ${String(data.length)}...`;
          }
        }

        // Save the PDF
        pdf.save(filename);

        // Show success message
        message.textContent = 'PDF downloaded successfully!';
        progressBar.style.width = '100%';

        // Remove overlay after delay
        setTimeout(() => {
          const overlay = document.getElementById('pdf-generation-overlay');
          if (overlay && document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
        }, 2000);

        return; // Exit the function here
      } catch (fallbackError) {
        console.error('Simplified PDF generation failed:', fallbackError);
        // Continue to HTML fallback
      }
    }

    // If all PDF generation methods have failed, use one last attempt with a simplified jsPDF approach
    console.warn('PDF generation methods failed, using final fallback method');

    try {
      message.textContent = 'Using final fallback PDF method...';

      // Import jsPDF directly
      const { jsPDF } = await import('jspdf');

      // Create a very simple PDF with minimal formatting
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      let y = margin;

      // Add a title
      pdf.setFontSize(16);
      pdf.text(
        categoryName ? `Marito Glossary: ${categoryName}` : 'Marito Glossary',
        margin,
        y,
      );
      y += 10;

      // Add timestamp
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
      y += 15;

      // Add content with minimal formatting
      pdf.setFontSize(12);

      // Process terms in a simplified manner
      for (const term of data) {
        // Check if we need a new page
        if (y > 270) {
          // Leave margin at bottom
          pdf.addPage();
          y = margin;
        }

        // Add term (bold)
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${term.term}:`, margin, y);
        y += 7;

        // Add definition (normal)
        pdf.setFont('helvetica', 'normal');

        // Handle text wrapping manually
        const maxWidth = pageWidth - margin * 2;
        const lines = pdf.splitTextToSize(
          term.definition,
          maxWidth,
        ) as string[];

        // Add each line
        pdf.text(lines, margin, y);
        y += lines.length * 7 + 7; // Add spacing after definition
      }

      // Save the PDF
      pdf.save(filename);

      message.textContent = 'PDF saved successfully!';

      progressBar.style.width = '100%';
      progressBar.style.backgroundColor = '#00ceaf';

      return;
    } catch (finalError) {
      console.error('Final PDF fallback failed:', finalError);

      // Only as a last resort, provide an HTML download
      message.textContent =
        'PDF generation failed. Downloading HTML version instead...';

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.replace('.pdf', '.html');
      link.click();
      URL.revokeObjectURL(url);
    }
  } catch (error: unknown) {
    console.error('PDF generation failed:', error);
    // Remove loading toast if it exists
    const loadingToast = document.querySelector(
      'div[style*="position: fixed"][style*="bottom: 20px"]',
    );
    if (loadingToast && loadingToast.parentNode) {
      loadingToast.parentNode.removeChild(loadingToast);
    }
    throw error; // Re-throw for caller to handle
  }
};
/**
 * Download data in the specified format
 * @param data Array of terms to download
 * @param format Format to download (csv, json, html, pdf)
 * @param translationsCache Cache of translations data
 * @param categoryName Optional category name
 */
export const downloadData = async (
  data: Term[],
  format: 'csv' | 'json' | 'html' | 'pdf',
  _translationsCache: Record<string, TermTranslations | null>, // Kept but unused parameter for backward compatibility with GlossaryPage.tsx calls
  categoryName?: string | null,
): Promise<void> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const categoryPrefix = categoryName
    ? `${categoryName.toLowerCase().replace(/\s+/g, '-')}-`
    : '';
  // For PDF format, handle the download using a simple direct approach
  if (format === 'pdf') {
    try {
      // First, create a loading overlay to show progress
      const loadingOverlay = document.createElement('div');
      loadingOverlay.style.position = 'fixed';
      loadingOverlay.style.top = '0';
      loadingOverlay.style.left = '0';
      loadingOverlay.style.width = '100%';
      loadingOverlay.style.height = '100%';
      loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      loadingOverlay.style.display = 'flex';
      loadingOverlay.style.alignItems = 'center';
      loadingOverlay.style.justifyContent = 'center';
      loadingOverlay.style.zIndex = '9999';

      const messageBox = document.createElement('div');
      messageBox.style.backgroundColor = '#fff';
      messageBox.style.padding = '20px';
      messageBox.style.borderRadius = '8px';
      messageBox.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
      messageBox.style.textAlign = 'center';
      messageBox.style.maxWidth = '80%';

      const loadingMessage = document.createElement('div');
      loadingMessage.textContent = 'Generating PDF and HTML files...';
      loadingMessage.style.marginBottom = '15px';
      loadingMessage.style.fontSize = '18px';
      loadingMessage.style.fontWeight = 'bold';

      messageBox.appendChild(loadingMessage);
      loadingOverlay.appendChild(messageBox);
      document.body.appendChild(loadingOverlay);

      // Generate HTML file first for backup
      const htmlContent = await generateHTMLTable(data, categoryName);
      const htmlFilename = `marito-glossary-${categoryPrefix}${timestamp}.html`;
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      const htmlLink = document.createElement('a');
      htmlLink.href = htmlUrl;
      htmlLink.download = htmlFilename;

      // Download the HTML file
      htmlLink.click();

      // Update the message
      loadingMessage.textContent = 'HTML downloaded. Now generating PDF...';

      // Use setTimeout to give the browser a chance to process the HTML download
      // Using an intermediate async function to avoid no-misused-promises error
      const generatePDFAfterDelay = async (): Promise<void> => {
        try {
          // Create PDF filename
          const pdfFilename = `marito-glossary-${categoryPrefix}${timestamp}.pdf`;

          // Import jsPDF directly
          const { jsPDF } = await import('jspdf');

          // Create a PDF document
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true,
            hotfixes: ['px_scaling'], // Improve text rendering quality
          });

          // Setup basic PDF properties
          const pageWidth = 210; // A4 width in mm
          const pageHeight = 297; // A4 height in mm
          const margin = 15;
          const contentWidth = pageWidth - margin * 2;

          // Get the logo for the header
          const logoBase64 = await getLogoAsBase64();

          // Add logo to the top right of the first page
          try {
            pdf.addImage(
              logoBase64,
              'PNG',
              pageWidth - margin - 20,
              margin,
              20,
              20,
            );
          } catch (logoError) {
            console.warn('Could not add logo to PDF:', logoError);
          }

          // Calculate title position
          const titleY = margin + 12;

          // Add title with styling similar to HTML
          pdf.setFontSize(22);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(26, 32, 44); // #1a202c - matches h1 color in HTML
          const title = categoryName
            ? `Marito Glossary: ${categoryName}`
            : 'Marito Glossary';
          pdf.text(title, margin, titleY);

          // Add subtitle
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(74, 85, 104); // #4a5568 - matches subtitle color in HTML
          const subtitle = categoryName
            ? `Terms in ${categoryName} category`
            : 'Complete Glossary';
          pdf.text(subtitle, margin, titleY + 8);

          // Add header section bottom border
          pdf.setDrawColor(226, 232, 240); // #e2e8f0 - matches border color in HTML
          pdf.setLineWidth(0.5);
          pdf.line(margin, titleY + 15, pageWidth - margin, titleY + 15);

          // Add timestamp in a styled box
          pdf.setFillColor(237, 242, 247); // #edf2f7 - matches timestamp background in HTML
          pdf.roundedRect(margin, titleY + 20, 90, 8, 2, 2, 'F');
          pdf.setFontSize(10);
          pdf.setTextColor(113, 128, 150); // #718096 - matches timestamp color in HTML
          pdf.text(
            `Export generated on: ${new Date().toLocaleString()}`,
            margin + 3,
            titleY + 25,
          );

          // Start y position for the table content
          let y = titleY + 35;

          // Set table styling
          const cellPadding = 5;
          const termColWidth = contentWidth * 0.3;
          const defColWidth = contentWidth * 0.7;

          // Add header row with filled background
          pdf.setFillColor(45, 55, 72); // #2d3748 - matches th background color in HTML
          pdf.rect(margin, y, contentWidth, 10, 'F');

          // Draw a vertical line between the term and definition columns
          pdf.setDrawColor(255, 255, 255); // White line to separate columns
          pdf.setLineWidth(0.5);
          pdf.line(margin + termColWidth, y, margin + termColWidth, y + 10);

          // Add header text
          pdf.setTextColor(255, 255, 255); // White - matches th text color in HTML
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.text('TERM', margin + cellPadding, y + 6.5);
          pdf.text('DEFINITION', margin + termColWidth + cellPadding, y + 6.5);

          // Move to first data row
          y += 10;

          // Reset text color for content
          pdf.setTextColor(51, 51, 51); // #333333 - matches td text color in HTML
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(11);

          // Add data rows
          for (let i = 0; i < data.length; i++) {
            // Update progress message every 10 items
            if (i % 10 === 0) {
              loadingMessage.textContent = `Processing terms... (${String(i)}/${String(data.length)})`;
            }

            const term = data[i];

            // Check if we need a new page
            if (y > pageHeight - margin * 2) {
              pdf.addPage();
              y = margin;

              // Add header to new page
              pdf.setFillColor(45, 55, 72);
              pdf.rect(margin, y, contentWidth, 10, 'F');

              // Draw a vertical line between the term and definition columns
              pdf.setDrawColor(255, 255, 255); // White line to separate columns
              pdf.setLineWidth(0.5);
              pdf.line(margin + termColWidth, y, margin + termColWidth, y + 10);

              pdf.setTextColor(255, 255, 255);
              pdf.setFont('helvetica', 'bold');
              pdf.text('TERM', margin + cellPadding, y + 6.5);
              pdf.text(
                'DEFINITION',
                margin + termColWidth + cellPadding,
                y + 6.5,
              );
              y += 10;
            }

            // Calculate row height first based on content
            // Split term text if it's too long (allow wrapping for longer terms too)
            const termMaxWidth = termColWidth - cellPadding * 2;
            const termText = term.term;
            const splitTermText = pdf.splitTextToSize(
              termText,
              termMaxWidth,
            ) as string[];

            // Calculate definition text wrapping
            const definition = term.definition;
            const defMaxWidth = defColWidth - cellPadding * 2;
            const splitDefText = pdf.splitTextToSize(
              definition,
              defMaxWidth,
            ) as string[];

            // Calculate row height based on which content is taller
            const lineHeight = 6;
            const termLines = splitTermText.length;
            const defLines = splitDefText.length;
            const maxLines = Math.max(termLines, defLines);
            const rowHeight = Math.max(12, maxLines * lineHeight + 4); // Minimum 12mm height

            // Set row background for even/odd rows - cover the entire row width
            const isEven = i % 2 === 0;
            if (isEven) {
              pdf.setFillColor(247, 250, 252); // #f7fafc - matches even row background in HTML
              pdf.rect(margin, y, contentWidth, rowHeight, 'F');
            } else {
              pdf.setFillColor(255, 255, 255); // #ffffff - matches odd row background in HTML
              pdf.rect(margin, y, contentWidth, rowHeight, 'F');
            }

            // Draw a vertical line separating the columns
            pdf.setDrawColor(226, 232, 240); // #e2e8f0 - matches border color in HTML
            pdf.setLineWidth(0.5);
            pdf.line(
              margin + termColWidth,
              y,
              margin + termColWidth,
              y + rowHeight,
            );

            // Reset text color for content
            pdf.setTextColor(51, 51, 51); // #333333
            pdf.setFont('helvetica', 'normal');

            // Add term text
            pdf.text(splitTermText, margin + cellPadding, y + 7);

            // Position and add the definition text
            pdf.text(splitDefText, margin + termColWidth + cellPadding, y + 7);

            // Add border at bottom of each row
            pdf.line(
              margin,
              y + rowHeight,
              margin + contentWidth,
              y + rowHeight,
            );

            // Move to next row - only increment once
            y += rowHeight;
          }

          // Add page numbers
          const totalPages = pdf.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(9);
            pdf.setTextColor(113, 128, 150); // #718096 - light gray
            pdf.text(
              `Page ${String(i)} of ${String(totalPages)}`,
              pageWidth / 2,
              pageHeight - 10,
              { align: 'center' },
            );

            // Add "Generated with Marito Glossary" text at the bottom
            pdf.text('Generated with Marito Glossary', margin, pageHeight - 10);
          }

          // Update message before saving
          loadingMessage.textContent = 'PDF ready! Downloading now...';

          // Save the PDF directly
          pdf.save(pdfFilename);

          // Display success message
          loadingMessage.textContent =
            'Both PDF and HTML files downloaded successfully!';
          loadingMessage.style.color = '#00ceaf';

          // Remove the overlay after a delay
          setTimeout(() => {
            document.body.removeChild(loadingOverlay);
          }, 2000);
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          loadingMessage.textContent =
            'PDF generation failed. HTML backup has been downloaded.';
          loadingMessage.style.color = '#f00a50';

          // Remove the overlay after a delay
          setTimeout(() => {
            document.body.removeChild(loadingOverlay);
          }, 3000);
        } finally {
          // Clean up the URL object
          URL.revokeObjectURL(htmlUrl);
        }
      };

      // Execute the async function after a delay
      const delayMs = 500; // Define delay as a constant for better readability and type safety
      setTimeout(() => {
        void generatePDFAfterDelay();
      }, delayMs); // Give a small delay before starting PDF generation
    } catch (error) {
      console.error('Error in export process:', error);
      alert('Export process encountered an error. Please try again.');
    }
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
    content = await generateHTMLTable(data, categoryName);
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
