import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { chat } from "./ai";
import { tools, executeTool } from "./tools";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors({
  origin: "*", // Allow all for demo, restrict in production
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Health check
app.get("/", (c) => {
  return c.json({
    name: "DunMac",
    version: "0.1.0",
    status: "running",
    by: "THISUX",
    tools: Object.keys(tools).length,
  });
});

// List available tools
app.get("/tools", (c) => {
  const toolList = Object.entries(tools).map(([name, tool]) => ({
    name,
    description: tool.description,
  }));
  return c.json({ tools: toolList });
});

// Chat endpoint - main AI interaction
app.post("/chat", async (c) => {
  try {
    const body = await c.req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string") {
      return c.json({ error: "Message is required" }, 400);
    }

    if (message.length > 10_000) {
      return c.json({ error: "Message too long" }, 400);
    }

    if (!Array.isArray(history) || history.length > 50) {
      return c.json({ error: "Invalid history" }, 400);
    }

    for (const entry of history) {
      if (
        !entry ||
        typeof entry !== "object" ||
        typeof entry.role !== "string" ||
        typeof entry.content !== "string"
      ) {
        return c.json({ error: "Invalid history entry" }, 400);
      }
    }

    console.log(`[Chat] User: ${message}`);
    const response = await chat(message, history);
    console.log(`[Chat] Assistant: ${response.message}`);

    return c.json(response);
  } catch (error) {
    console.error("[Chat] Error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Direct tool execution (bypass AI)
app.post("/tools/:name", async (c) => {
  try {
    const name = c.req.param("name");
    const args = await c.req.json();

    console.log(`[Direct] Tool: ${name}`, args);
    const result = await executeTool(name, args);

    return c.json(result);
  } catch (error) {
    console.error("[Direct] Error:", error);
    return c.json({ error: "Tool execution failed" }, 500);
  }
});

// Screenshot endpoint (returns image directly)
app.get("/screenshot", async (c) => {
  const result = await executeTool("screenshot", {});
  
  if (result.success && result.data) {
    const { base64, mimeType } = result.data as { base64: string; mimeType: string };
    const buffer = Buffer.from(base64, "base64");
    
    return new Response(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": buffer.length.toString(),
      },
    });
  }
  
  return c.json({ error: "Failed to capture screenshot" }, 500);
});

// Start server
const port = parseInt(process.env.PORT || "3456");

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ██████╗ ██╗   ██╗███╗   ██╗███╗   ███╗ █████╗  ██████╗  ║
║   ██╔══██╗██║   ██║████╗  ██║████╗ ████║██╔══██╗██╔════╝  ║
║   ██║  ██║██║   ██║██╔██╗ ██║██╔████╔██║███████║██║       ║
║   ██║  ██║██║   ██║██║╚██╗██║██║╚██╔╝██║██╔══██║██║       ║
║   ██████╔╝╚██████╔╝██║ ╚████║██║ ╚═╝ ██║██║  ██║╚██████╗  ║
║   ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝  ║
║                                                           ║
║   Remote Mac Control powered by AI                        ║
║   by THISUX                                               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

🚀 Server running at http://localhost:${port}
📱 Ready to receive commands from your phone!

Available endpoints:
  GET  /          - Health check
  GET  /tools     - List available tools
  POST /chat      - AI chat (main endpoint)
  POST /tools/:n  - Direct tool execution
  GET  /screenshot - Get screenshot as image

Next steps:
  1. Run: cloudflared tunnel --url http://localhost:${port}
  2. Copy the tunnel URL
  3. Open the web app and enter the URL
`);

export default {
  port,
  fetch: app.fetch,
};
