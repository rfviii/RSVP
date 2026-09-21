import { DOCUMENT_TYPES, type DocumentType } from '@/domain/documents/types';

export function isDocumentType(value: unknown): value is DocumentType {
  return typeof value === 'string' && (DOCUMENT_TYPES as readonly string[]).includes(value);
}
