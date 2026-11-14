/**
 * Utility for downloading and printing the invoice as an authentic single-page A4 PDF.
 * Ensures:
 * 1. Guest ID is masked (XXXX XXXX 6502) for customer copy privacy.
 * 2. html2canvas captures from origin (0, 0) with zero displacement.
 * 3. Exact 6mm 8mm margins matching the approved authentic hotel invoice design.
 * 4. Signatures (Customer Sign & Manager Stamp) and bottom micro details remain 100% visible and intact.
 * 5. Print Receipt uses the exact same perfect PDF generation with unique hotel & invoice name.
 */

export const downloadInvoicePdf = async (cardElement, filename) => {
  if (!cardElement) return;

  // Sanitize filename to avoid invalid characters like slashes (/)
  const cleanFilename = (filename || 'Hotel-Invoice.pdf')
    .replace(/[\/\\?%*:|"<>]/g, '-');

  // Save current scroll positions
  const origScrollY = window.scrollY;
  const origScrollX = window.scrollX;
  const scrollParent = cardElement.closest('.overflow-y-auto');
  const parentScrollTop = scrollParent ? scrollParent.scrollTop : 0;

  // Reset scroll to top so html2canvas starts from exact origin (0, 0) without displacement
  window.scrollTo(0, 0);
  if (scrollParent) scrollParent.scrollTop = 0;

  // Add masking class for customer copy privacy (first half of ID masked)
  cardElement.classList.add('mask-id-for-export');

  try {
    if (window.html2pdf) {
      const opt = {
        margin: [6, 8, 6, 8],
        filename: cleanFilename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await window.html2pdf().set(opt).from(cardElement).save();
    } else {
      window.print();
    }
  } catch (error) {
    console.error('PDF export failed:', error);
    window.print();
  } finally {
    // Restore classes and previous scroll positions
    cardElement.classList.remove('mask-id-for-export');
    window.scrollTo(origScrollX, origScrollY);
    if (scrollParent) scrollParent.scrollTop = parentScrollTop;
  }
};

/**
 * Print Receipt function:
 * 1. Generates and downloads the exact same perfect PDF as downloadInvoicePdf.
 * 2. Sets document.title to the unique hotel + invoice number so any browser save dialog matches.
 * 3. Triggers printing with proper A4 margins and full border visibility.
 */
export const printInvoicePdf = async (cardElement, filename) => {
  if (!cardElement) return;

  const originalTitle = document.title;
  const cleanFilename = (filename || 'Hotel-Invoice.pdf')
    .replace(/[\/\\?%*:|"<>]/g, '-');
  const cleanTitle = cleanFilename.replace(/\.pdf$/i, '');

  // Temporarily set document.title so any browser print/save-as-pdf suggests the exact unique filename
  document.title = cleanTitle;

  // 1. Download the flawless PDF directly with unique name
  await downloadInvoicePdf(cardElement, cleanFilename);

  // 2. Also trigger print
  try {
    window.print();
  } catch (err) {
    console.error('Print trigger error:', err);
  } finally {
    setTimeout(() => {
      document.title = originalTitle;
    }, 5000);
  }
};
