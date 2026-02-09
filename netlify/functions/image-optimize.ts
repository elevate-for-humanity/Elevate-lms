/**
 * Netlify Function: Image Optimization
 * 
 * Handles image optimization using Sharp.
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

    // Dynamic import to keep Sharp in this function's bundle only
    const sharp = (await import("sharp")).default;

    const { image, options = {} } = payload;
    const {
      width,
      height,
      quality = 80,
      format = "webp",
      fit = "cover",
    } = options;

    // Convert base64 to buffer
    let imageBuffer: Buffer;
    if (image.startsWith("data:")) {
      const base64Data = image.split(",")[1];
      imageBuffer = Buffer.from(base64Data, "base64");
    } else {
      imageBuffer = Buffer.from(image, "base64");
    }

    let pipeline = sharp(imageBuffer);

    // Resize if dimensions provided
    if (width || height) {
      pipeline = pipeline.resize(width, height, { fit });
    }

    // Convert format and compress
    switch (format) {
      case "webp":
        pipeline = pipeline.webp({ quality });
        break;
      case "jpeg":
        pipeline = pipeline.jpeg({ quality, progressive: true });
        break;
      case "png":
        pipeline = pipeline.png({ quality, compressionLevel: 9 });
        break;
      case "avif":
        pipeline = pipeline.avif({ quality });
        break;
    }

    const optimizedBuffer = await pipeline.toBuffer();
    const metadata = await sharp(optimizedBuffer).metadata();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": `image/${format}`,
        "X-Image-Width": String(metadata.width || 0),
        "X-Image-Height": String(metadata.height || 0),
      },
      body: optimizedBuffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e: any) {
    console.error("Image optimization error:", e);
    return { statusCode: 500, body: e?.message ?? "Image optimization failed" };
  }
};
