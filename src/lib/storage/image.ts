/** Cheap, dependency-free image sniffing + intrinsic dimension reading. */

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

export interface ImageProbe {
  width: number | null;
  height: number | null;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) out += String.fromCharCode(bytes[offset + i] ?? 0);
  return out;
}

/**
 * Validates that the byte payload really is one of the accepted image formats.
 * The declared MIME type from the client is never trusted on its own.
 */
export function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  const header = ascii(bytes, 0, 6);
  if (header === 'GIF87a' || header === 'GIF89a') return 'image/gif';
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') return 'image/webp';
  if (ascii(bytes, 4, 4) === 'ftyp' && (ascii(bytes, 8, 4) === 'avif' || ascii(bytes, 8, 4) === 'avis')) {
    return 'image/avif';
  }
  return null;
}

function readJpegDimensions(bytes: Uint8Array): ImageProbe {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    // Standalone markers carry no length payload.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSOF) {
      const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
      const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
      return { width, height };
    }
    if (length <= 0) break;
    offset += 2 + length;
  }
  return { width: null, height: null };
}

function readPngDimensions(bytes: Uint8Array): ImageProbe {
  if (bytes.length < 24) return { width: null, height: null };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function readGifDimensions(bytes: Uint8Array): ImageProbe {
  if (bytes.length < 10) return { width: null, height: null };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
}

function readWebpDimensions(bytes: Uint8Array): ImageProbe {
  if (bytes.length < 30) return { width: null, height: null };
  const chunk = ascii(bytes, 12, 4);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (chunk === 'VP8X') {
    return {
      width: view.getUint32(24, true) + 1,
      height: view.getUint32(27, true) + 1,
    };
  }
  if (chunk === 'VP8L') {
    const bits = view.getUint32(21, true);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8 ') {
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) {
      return { width: null, height: null };
    }
    return {
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
    };
  }
  return { width: null, height: null };
}

export function readImageDimensions(bytes: Uint8Array, type: string): ImageProbe {
  try {
    switch (type) {
      case 'image/png':
        return readPngDimensions(bytes);
      case 'image/jpeg':
        return readJpegDimensions(bytes);
      case 'image/gif':
        return readGifDimensions(bytes);
      case 'image/webp':
        return readWebpDimensions(bytes);
      default:
        return { width: null, height: null };
    }
  } catch {
    return { width: null, height: null };
  }
}

/** Produces a stable, filesystem-safe key fragment from an original filename. */
export function sanitiseFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  const cleaned = base
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(0, 60);
  return cleaned || 'image';
}
