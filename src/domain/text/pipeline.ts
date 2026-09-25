import { buildTextDocument } from '@/domain/text/buildTextDocument';
import { normalizeExtractedPages, type RawPage } from '@/domain/text/normalization';
import type { TextDocument } from '@/domain/text/types';

/** Runs the full normalization -> structure detection -> tokenization pipeline. */
export function processExtractedPages(pages: RawPage[]): TextDocument {
  const normalizedPages = normalizeExtractedPages(pages);
  return buildTextDocument(normalizedPages);
}
