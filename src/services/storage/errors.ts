export const STORAGE_ERROR_CODES = ['unavailable', 'read-failed', 'write-failed'] as const;

export type StorageErrorCode = (typeof STORAGE_ERROR_CODES)[number];

export class StorageError extends Error {
  readonly code: StorageErrorCode;

  constructor(code: StorageErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'StorageError';
    this.code = code;
  }
}
