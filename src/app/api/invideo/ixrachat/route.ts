import { NextRequest } from "next/server";
import FormData from "form-data";
import axios from "axios";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!;
const MISTRAL_BASE = "https://api.mistral.ai/v1";
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const PLAIN_TEXT_TYPES = new Set([
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
  "application/x-ndjson",
]);

const OCR_SUPPORTED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/epub+zip",
  "application/rtf",
  "application/vnd.oasis.opendocument.text",
  "application/x-latex",
  "application/x-ipynb+json",
]);

async function uploadToMistral(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  const form = new FormData();
  form.append("purpose", "ocr");
  form.append("file", buffer, {
    filename: fileName,
    contentType: mimeType,
    knownLength: buffer.length,
  });

  const uploadRes = await axios.post(`${MISTRAL_BASE}/files`, form, {
    headers: {
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
      ...form.getHeaders(),
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  const fileId = uploadRes.data.id;
  await new Promise((r) => setTimeout(r, 2500));

  const signedRes = await axios.get(`${MISTRAL_BASE}/files/${fileId}/url?expiry=24`, {
    headers: { Authorization: `Bearer ${MISTRAL_API_KEY}` },
  });

  return signedRes.data.url as string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, file } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages required" }), { status: 400 });
    }

    let documentUrl: string | null = null;
    let inlineTextContent: string | null = null;
    let isImage = false;

    if (file) {
      const buffer = Buffer.from(file.base64, "base64");

      if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
        return new Response(JSON.stringify({ error: "File too large. Maximum 50MB allowed." }), { status: 400 });
      }

      const mimeType: string = file.mimeType || "application/octet-stream";

      if (PLAIN_TEXT_TYPES.has(mimeType)) {
        inlineTextContent = buffer.toString("utf-8");
      } else if (mimeType.startsWith("image/")) {
        isImage = true;
        documentUrl = `data:${mimeType};base64,${file.base64}`;
      } else if (OCR_SUPPORTED_TYPES.has(mimeType)) {
        try {
          documentUrl = await uploadToMistral(buffer, mimeType, file.name);
        } catch (err: any) {
          const msg =
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            "Document upload failed";
          return new Response(JSON.stringify({ error: msg }), { status: 500 });
        }
      } else {
        inlineTextContent = buffer.toString("utf-8").slice(0, 80000);
      }
    }

    const formattedMessages = messages.map(
      (msg: { role: string; content: string }, idx: number) => {
        if (idx !== messages.length - 1 || msg.role !== "user") {
          return { role: msg.role, content: msg.content };
        }

        const userText = msg.content || "Please analyze and summarize this file thoroughly.";

        if (inlineTextContent !== null) {
          return {
            role: "user",
            content: `${userText}\n\n--- File: ${file.name} ---\n${inlineTextContent.slice(0, 80000)}`,
          };
        }

        if (isImage && documentUrl) {
          return {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: documentUrl } },
              { type: "text", text: userText },
            ],
          };
        }

        if (documentUrl) {
          return {
            role: "user",
            content: [
              { type: "document_url", document_url: documentUrl },
              { type: "text", text: userText },
            ],
          };
        }

        return { role: msg.role, content: msg.content };
      }
    );

    const hasFile = !!(documentUrl || inlineTextContent);
    const model = hasFile ? "mistral-large-latest" : "mistral-small-latest";

    const mistralRes = await fetch(`${MISTRAL_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          {
            role: "system",
            content: `You are IxraChat, the built-in AI assistant for IxraAI — a comprehensive AI-powered creative hub. You help users with questions, document analysis, and guiding them through every feature of the app.

**InVideo Hub features:**
1. **IxraChat** — AI chat assistant. Can analyze uploaded documents (PDF, DOCX, TXT, CSV, PPTX, JSON, MD, images) via the paperclip icon.
2. **AI Video Generation** — Generate cinematic videos from text prompts.
3. **AI Image Generation** — Generate high-fidelity images with style options (Default, Anime, Portrait, 3D Render, Cyberpunk).
4. **AI Avatar Creator** — Transform a portrait photo into a stylized AI avatar.
5. **Background Remover** — Instantly remove image backgrounds.
6. **Image Upscaler** — Enhance image resolution up to 8K.
7. **Screen Recorder** — Record your screen directly from the browser.

Be friendly, concise, and helpful. Guide users step by step when they ask about features.`,
          },
          ...formattedMessages,
        ],
      }),
    });

    if (!mistralRes.ok) {
      const errData = await mistralRes.json().catch(() => ({}));
      const msg = (errData as any)?.message || (errData as any)?.detail || "Mistral API error";
      return new Response(JSON.stringify({ error: msg }), { status: mistralRes.status });
    }

    // Pipe Mistral's SSE stream → client, extracting only the text deltas
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = mistralRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const data = trimmed.slice(5).trim();
              if (data === "[DONE]") {
                controller.close();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const delta = parsed?.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                // malformed chunk — skip
              }
            }
          }
        } catch (e) {
          controller.error(e);
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.detail ||
      err?.message ||
      "Internal server error";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
