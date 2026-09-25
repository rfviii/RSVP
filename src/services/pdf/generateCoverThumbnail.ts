import type { PDFDocumentProxy } from 'pdfjs-dist';

const THUMBNAIL_MAX_WIDTH_PX = 240;
const THUMBNAIL_JPEG_QUALITY = 0.7;

/**
 * Renders the PDF's first page to a small JPEG thumbnail for the library
 * card. Best-effort: returns `undefined` (no cover, not a failure) rather
 * than throwing, since a missing thumbnail shouldn't block importing the
 * document — canvas rendering may also simply be unavailable (e.g. jsdom
 * in tests).
 */
export async function generateCoverThumbnail(pdfDocument: PDFDocumentProxy): Promise<Blob | undefined> {
  try {
    const page = await pdfDocument.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = THUMBNAIL_MAX_WIDTH_PX / baseViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    if (!context) {
      return undefined;
    }

    await page.render({ canvasContext: context, viewport }).promise;

    return await new Promise<Blob | undefined>((resolve) => {
      canvas.toBlob((blob) => resolve(blob ?? undefined), 'image/jpeg', THUMBNAIL_JPEG_QUALITY);
    });
  } catch {
    return undefined;
  }
}
