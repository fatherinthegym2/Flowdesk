/**
 * Strips BOM (U+FEFF) / zero-width space (U+200B) and surrounding whitespace
 * from env vars. Vercel's env var editor has previously injected BOM/newlines
 * into pasted secrets, which breaks fetch() Headers (ByteString / non-ISO-8859-1 errors).
 */
const BOM = String.fromCharCode(0xfeff)
const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b)

export function cleanEnv(value: string | undefined): string {
  return (value ?? '').split(BOM).join('').split(ZERO_WIDTH_SPACE).join('').trim()
}
