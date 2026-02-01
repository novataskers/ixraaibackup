import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const removeBgApiKey = process.env.REMOVE_BG_API_KEY;
    if (!removeBgApiKey) {
      return NextResponse.json({ error: "remove.bg API key not configured" }, { status: 500 });
    }

    // Extract base64 data and strip prefix if present
    const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
    const buffer = Buffer.from(base64Data, "base64");

    const formData = new FormData();
    // Create a Blob from the buffer
    const blob = new Blob([buffer], { type: "image/png" });
    formData.append("image_file", blob, "input.png");
    formData.append("size", "auto");

    console.log("Starting remove.bg background removal");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": removeBgApiKey,
      },
      body: formData,
    });

      if (!response.ok) {
        let errorTitle = "Background removal failed";
        try {
          const errorData = await response.json();
          errorTitle = errorData.errors?.[0]?.title || errorData.errors?.[0]?.detail || errorTitle;
        } catch (e) {
          // Fallback if response is not JSON
          if (response.status === 402) errorTitle = "Insufficient credits in remove.bg account";
          if (response.status === 403) errorTitle = "Invalid remove.bg API key";
        }
        throw new Error(errorTitle);
      }

    const arrayBuffer = await response.arrayBuffer();
    const outputBuffer = Buffer.from(arrayBuffer);
    const outputBase64 = `data:image/png;base64,${outputBuffer.toString("base64")}`;

    return NextResponse.json({ output: outputBase64, success: true });
    } catch (error: any) {
      console.error("Background Removal Error:", error);
      return NextResponse.json({ 
        error: error.message || "Failed to remove background",
        success: false
      }, { status: 500 });
    }
}
