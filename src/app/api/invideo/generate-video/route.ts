import { NextResponse } from "next/server";

function isCreditsExhaustedError(responseText: string): boolean {
  const lowerText = responseText.toLowerCase();
  return lowerText.includes('insufficient') || 
         lowerText.includes('credits') || 
         lowerText.includes('quota') ||
         lowerText.includes('balance') ||
         lowerText.includes('limit exceeded') ||
         lowerText.includes('no access');
}

async function createVideoTask(prompt: string, apiKey: string): Promise<{ success: boolean; taskId?: string; creditsExhausted?: boolean; error?: string }> {
  const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-imagine/text-to-video",
      input: {
        prompt: prompt,
        aspect_ratio: "16:9",
        duration: "6",
        mode: "normal"
      }
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    const creditsExhausted = response.status === 401 || response.status === 403 || isCreditsExhaustedError(responseText);
    let errorMsg = "Failed to create KIE AI task";
    try {
      const errorData = JSON.parse(responseText);
      errorMsg = errorData.msg || errorMsg;
    } catch {}
    return { success: false, creditsExhausted, error: errorMsg };
  }

  const data = JSON.parse(responseText);
  
  if (data.code !== 200 || !data.data?.taskId) {
    const creditsExhausted = isCreditsExhaustedError(data.msg || '');
    return { success: false, creditsExhausted, error: data.msg || "Invalid response from KIE AI" };
  }

  return { success: true, taskId: data.data.taskId };
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    const apiKey1 = process.env.KIE_VIDEO_API_KEY;
    const apiKey2 = process.env.KIE_VIDEO_API_KEY_2;
    const apiKeys = [apiKey1, apiKey2].filter(Boolean) as string[];

    if (apiKeys.length === 0) {
      return NextResponse.json({ error: "KIE_VIDEO_API_KEY not configured" }, { status: 500 });
    }

    console.log(`Starting Video Generation via KIE AI with ${apiKeys.length} available key(s)...`);
    
    for (let i = 0; i < apiKeys.length; i++) {
      console.log(`Trying KIE Video Key ${i + 1}...`);
      const result = await createVideoTask(prompt, apiKeys[i]);
      
      if (result.success) {
        return NextResponse.json({ 
          success: true, 
          status: "processing", 
          id: `kie_${result.taskId}` 
        });
      }
      
      if (result.creditsExhausted && i < apiKeys.length - 1) {
        console.log(`Key ${i + 1} credits exhausted, switching to next key...`);
        continue;
      }
      
      throw new Error(result.error || "Failed to create video task");
    }

    throw new Error("All API keys exhausted or failed");

  } catch (error: any) {
    console.error("KIE Video Generation Error:", error);
    return NextResponse.json({ 
      error: "Failed to start video generation", 
      details: error.message 
    }, { status: 500 });
  }
}
