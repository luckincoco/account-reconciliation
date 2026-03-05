import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  // Call PaddleOCR if configured
  const ocrEndpoint = process.env.PADDLE_OCR_ENDPOINT;
  let rawText = "";

  if (ocrEndpoint && ocrEndpoint !== "http://localhost:8866/predict/ocr_system") {
    try {
      const ocrRes = await fetch(ocrEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [base64] }),
      });
      const ocrData = await ocrRes.json();
      if (ocrData.results?.[0]) {
        rawText = ocrData.results[0]
          .map((item: { text: string }) => item.text)
          .join("\n");
      }
    } catch {
      // OCR service unavailable, return empty
    }
  }

  // Call DeepSeek for structured extraction if configured
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  let extracted = {
    counterpart_name: "",
    item_name: "",
    quantity: 0,
    unit: "",
    unit_price: 0,
    amount: 0,
    date: "",
  };

  if (deepseekKey && deepseekKey !== "your-deepseek-api-key" && rawText) {
    try {
      const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
      const aiRes = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          temperature: 0.1,
          messages: [
            {
              role: "system",
              content:
                'Extract transaction data from OCR text. Return JSON with fields: counterpart_name, item_name, quantity (number), unit, unit_price (number), amount (number), date (YYYY-MM-DD). If a field is unclear, use empty string or 0.',
            },
            { role: "user", content: rawText },
          ],
        }),
      });
      const aiData = await aiRes.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = { ...extracted, ...JSON.parse(jsonMatch[0]) };
      }
    } catch {
      // AI service unavailable
    }
  }

  return NextResponse.json({
    success: true,
    data: { extracted, raw_text: rawText },
  });
}
