import { z } from "zod";

export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  execute: (args: any) => Promise<ToolResult>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  actions: {
    tool: string;
    args: Record<string, unknown>;
    result: ToolResult;
  }[];
}
