/**
 * On-device shipping label OCR — no API keys, runs in the driver browser.
 */
import { mergeParsedDelivery, parseDeliveryBarcode, parseLabelText } from '@/lib/barcodeParsers';

let workerPromise = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_pageseg_mode: '6', // uniform block of text (labels)
      });
      return worker;
    })();
  }
  return workerPromise;
}

/** Read label photo and extract Ship To delivery fields. */
export async function readLabelFromPhoto(imageSource, { barcode, onProgress } = {}) {
  const worker = await getWorker();
  if (onProgress) {
    worker.logger = (m) => {
      if (m.status === 'recognizing text') onProgress(m.progress || 0);
    };
  }

  const { data: { text } } = await worker.recognize(imageSource);
  let parsed = parseLabelText(text);

  if (barcode) {
    parsed = mergeParsedDelivery(parsed, parseDeliveryBarcode(barcode)) || parsed;
  }

  if (parsed && !parsed.recipient_name && parsed.address) {
    parsed.recipient_name = 'Recipient';
  }

  return { parsed, rawText: text };
}

/** Release OCR worker (optional cleanup). */
export async function releaseLabelOcrWorker() {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
  }
}
