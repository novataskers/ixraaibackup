import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Remove.bg API key not configured" }, { status: 500 });
    }

    const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;

    console.log("Starting Remove.bg background removal");

    const formData = new FormData();
    formData.append("image_file_b64", base64Data);
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Remove.bg Error:", errorText);
      throw new Error(`Remove.bg API error: ${response.status}`);
    }

    const resultBuffer = await response.arrayBuffer();
    const resultBase64 = Buffer.from(resultBuffer).toString("base64");

    return NextResponse.json({ 
      output: `data:image/png;base64,${resultBase64}`, 
      success: true
    });

  } catch (error: any) {
    console.error("Background Removal Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to remove background",
      success: false
    }, { status: 500 });
  }
}
