import { z } from "zod";
import type { ToolDefinition } from "../types";

export const notify: ToolDefinition = {
  name: "notify",
  description: "Show a macOS notification with a title and message",
  parameters: z.object({
    title: z.string().describe("The notification title"),
    message: z.string().describe("The notification message/body"),
    sound: z.boolean().optional().describe("Play notification sound (default: true)"),
  }),
  execute: async ({ title, message, sound = true }) => {
    try {
      const safeTitle = title.replace(/["\\]/g, "");
      const safeMessage = message.replace(/["\\]/g, "");
      let script = `display notification "${safeMessage}" with title "${safeTitle}"`;
      if (sound) {
        script += ` sound name "default"`;
      }

      const proc = Bun.spawn(["osascript", "-e", script]);
      await proc.exited;

      if (proc.exitCode === 0) {
        return { success: true, message: `Notification sent: ${safeTitle}` };
      } else {
        return { success: false, message: "Failed to send notification" };
      }
    } catch {
      return { success: false, message: "Failed to send notification" };
    }
  },
};
