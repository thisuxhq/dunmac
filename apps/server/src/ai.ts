import { createOpenAI } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { z } from "zod";
import { tools, executeTool } from "./tools";
import type { ChatResponse, ToolResult } from "./types";

// Create OpenRouter client (OpenAI-compatible)
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

const SYSTEM_PROMPT = `You are DunMac, an AI assistant that controls a Mac computer remotely. You were created by THISUX, a design and development studio.

You help users control their Mac using natural language. You have access to various tools to:
- Open applications and URLs
- Control music playback (Apple Music/Spotify)
- Take screenshots
- Run shell commands
- Show notifications
- Use text-to-speech
- Control system settings (dark mode, volume, etc.)

Guidelines:
1. Be concise and friendly
2. Execute tools confidently - don't ask for confirmation unless the action is destructive
3. Chain multiple tools together when needed (e.g., "open Spotify and play jazz" = music_play with spotify)
4. For ambiguous app names, make your best guess
5. If a tool fails, explain why and suggest alternatives
6. You can use multiple tools in sequence to accomplish complex tasks

Remember: You're controlling a real Mac, so be helpful and efficient!`;

// Convert our tools to AI SDK format
function getAITools() {
  const aiTools: Record<string, any> = {};
  
  for (const [name, toolDef] of Object.entries(tools)) {
    aiTools[name] = tool({
      description: toolDef.description,
      parameters: toolDef.parameters,
      execute: async (args) => {
        console.log(`[Tool] Executing ${name}:`, args);
        const result = await executeTool(name, args);
        console.log(`[Tool] Result:`, result);
        return result;
      },
    });
  }
  
  return aiTools;
}

export async function chat(message: string, history: { role: "user" | "assistant"; content: string }[] = []): Promise<ChatResponse> {
  const actions: ChatResponse["actions"] = [];
  
  try {
    const result = await generateText({
      model: openrouter("anthropic/claude-sonnet-4"),
      system: SYSTEM_PROMPT,
      messages: [
        ...history.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        { role: "user" as const, content: message },
      ],
      tools: getAITools(),
      maxSteps: 10, // Allow multiple tool calls
      onStepFinish: ({ toolCalls, toolResults }) => {
        if (toolCalls && toolResults) {
          for (let i = 0; i < toolCalls.length; i++) {
            const call = toolCalls[i];
            const result = toolResults[i];
            actions.push({
              tool: call.toolName,
              args: call.args,
              result: result.result as ToolResult,
            });
          }
        }
      },
    });

    return {
      message: result.text,
      actions,
    };
  } catch (error) {
    console.error("[AI] Error:", error);
    return {
      message: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
      actions,
    };
  }
}
