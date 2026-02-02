import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, negative_prompt, num_images = 1, size = "square_1_1", style } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.FREEPIK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Freepik API key not configured" },
        { status: 500 }
      );
    }

    const body: any = {
      prompt,
      negative_prompt,
      num_images,
      image: { size },
    };

    if (style) {
      body.styling = { style };
    }

    const response = await fetch("https://api.freepik.com/v1/ai/text-to-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Freepik API Error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to generate image from Freepik" },
        { status: response.status }
      );
    }

    // Freepik returns an array of data objects with base64 strings
    if (data.data && data.data.length > 0) {
      const images = data.data.map((item: any) => `data:image/png;base64,${item.base64}`);
      return NextResponse.json({ output: images });
    }

    return NextResponse.json(
      { error: "No image data returned from Freepik" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
