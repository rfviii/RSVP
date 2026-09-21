export interface PdfPageText {
  pageNumber: number;
  text: string;
}

export interface PdfExtractionResult {
  pageCount: number;
  pages: PdfPageText[];
}
