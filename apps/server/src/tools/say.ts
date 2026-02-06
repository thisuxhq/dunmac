import { z } from "zod";
import type { ToolDefinition } from "../types";

export const say: ToolDefinition = {
  name: "say",
  description: "Make the Mac speak text out loud using text-to-speech. Great for announcements, greetings, or fun interactions.",
  parameters: z.object({
    text: z.string().describe("The text to speak out loud"),
    voice: z.string().optional().describe("Optional voice name (e.g., 'Alex', 'Samantha', 'Daniel'). Default is system voice."),
  }),
  execute: async ({ text, voice }) => {
    try {
      const args = ["say"];
      if (voice) {
        args.push("-v", voice);
      }
      args.push(text);
      
      const proc = Bun.spawn(args);
      await proc.exited;
      
      if (proc.exitCode === 0) {
        return { success: true, message: `Said: "${text}"` };
      } else {
        return { success: false, message: `Failed to speak` };
      }
    } catch {
      return { success: false, message: "Failed to speak text" };
    }
  },
};
