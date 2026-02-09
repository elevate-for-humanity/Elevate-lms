/**
 * Netlify Function: OCR Text Extraction
 * 
 * Handles OCR using Tesseract.js with Sharp preprocessing.
 * Isolated from Next.js to keep heavy dependencies out of the main server handler.
 */

import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const payload = event.body ? JSON.parse(event.body) : null;
    if (!payload || !payload.image) {
      return { statusCode: 400, body: "Missing image data" };
    }

    // Dynamic imports to keep these in this function's bundle only
    const Tesseract = (await import("tesseract.js")).default;
    const sharp = (await import("sharp")).default;

    const { image, options = {} } = payload;
    const language = options.language || "eng";
    const preprocess = options.preprocess !== false;

    // Convert base64 to buffer
    let imageBuffer: Buffer;
    if (image.startsWith("data:")) {
      const base64Data = image.split(",")[1];
      imageBuffer = Buffer.from(base64Data, "base64");
    } else {
      imageBuffer = Buffer.from(image, "base64");
    }

    // Preprocess image if enabled
    if (preprocess) {
      try {
        imageBuffer = await sharp(imageBuffer)
          .grayscale()
          .normalize()
          .sharpen({ sigma: 1.5 })
          .modulate({ brightness: 1.1 })
          .png()
          .toBuffer();
      } catch (e) {
        console.warn("Image preprocessing failed, using original");
      }
    }

    // Run Tesseract OCR
    const result = await Tesseract.recognize(imageBuffer, language);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: result.data.text.trim(),
        confidence: result.data.confidence / 100,
        words: result.data.words?.map((word: any) => ({
          text: word.text,
          confidence: word.confidence / 100,
          bbox: word.bbox,
        })),
      }),
    };
  } catch (e: any) {
    console.error("OCR error:", e);
    return { statusCode: 500, body: e?.message ?? "OCR extraction failed" };
  }
};
