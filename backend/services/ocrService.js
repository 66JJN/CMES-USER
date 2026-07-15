import Tesseract from "tesseract.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Optical Character Recognition Service using Tesseract.js
 * Performs OCR and converts Thai numbers to Arabic numerals.
 * Implements strict resource termination to prevent RAM memory leaks.
 */
export async function performOCR(imagePath) {
  // Create worker with specific languages
  const worker = await Tesseract.createWorker("tha+eng", 1, {
    cachePath: path.join(__dirname, "../tessdata"),
  });

  try {
    const { data: { text } } = await worker.recognize(imagePath);
    return text || "";
  } finally {
    // Terminate worker immediately after recognition to free up CPU and Memory
    await worker.terminate();
  }
}

/**
 * Helper to convert Thai number characters to standard Arabic digits
 */
export function thaiToArabic(str) {
  if (!str) return "";
  return str.replace(/[๐-๙]/g, (d) => "0123456789"["๐๑๒๓๔๕๖๗๘๙".indexOf(d)]);
}
