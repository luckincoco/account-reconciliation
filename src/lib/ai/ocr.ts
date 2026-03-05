const PADDLE_OCR_ENDPOINT =
  process.env.PADDLE_OCR_ENDPOINT || "http://localhost:8866/predict/ocr_system";

interface OcrResult {
  text: string;
  confidence: number;
  position: number[][];
}

export async function recognizeImage(
  imageBase64: string
): Promise<OcrResult[]> {
  const res = await fetch(PADDLE_OCR_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      images: [imageBase64],
    }),
  });

  if (!res.ok) {
    throw new Error(`PaddleOCR error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  // PaddleOCR response format varies by deployment; adjust as needed
  return (
    data.results?.[0]?.map(
      (item: { text: string; confidence: number; text_region: number[][] }) => ({
        text: item.text,
        confidence: item.confidence,
        position: item.text_region,
      })
    ) || []
  );
}
