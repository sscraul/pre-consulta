import crypto from 'crypto';

export function cryptoNativeId(): string {
  return crypto.randomUUID();
}
