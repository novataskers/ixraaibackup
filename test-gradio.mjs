import { Client } from "@gradio/client";

async function test() {
  try {
    const client = await Client.connect("Dentro/face-swap");
    console.log("Connected to Dentro/face-swap");
    
    // Inspect the API
    // The client object usually has info or some way to see endpoints
    // In @gradio/client, it's client.config.endpoints or similar
    console.log("Endpoints:", JSON.stringify(client.config.endpoints, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
