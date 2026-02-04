import { Client } from "@gradio/client";

async function check() {
  try {
    const client = await Client.connect("Dentro/face-swap");
    console.log("API Info:");
    // In @gradio/client, there's a property 'api' or similar
    // Let's try to find it
    for (const key in client) {
      if (typeof client[key] !== 'function') {
        console.log(`Key: ${key}`);
      }
    }
    // Usually it's client.config
    if (client.config && client.config.endpoints) {
       console.log(JSON.stringify(client.config.endpoints, null, 2));
    }
  } catch (e) {
    console.error(e);
  }
}
check();
