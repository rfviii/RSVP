export interface PdfPageText {
  pageNumber: number;
  text: string;
}

export interface PdfExtractionResult {
  pageCount: number;
  pages: PdfPageText[];
  /** A small preview of the first page for the library card. Best-effort — may be absent. */
  coverThumbnail?: Blob;
}
