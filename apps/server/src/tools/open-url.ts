import { z } from "zod";
import type { ToolDefinition } from "../types";

export const openUrl: ToolDefinition = {
  name: "open_url",
  description: "Open a URL in the default browser",
  parameters: z.object({
    url: z.string().describe("The URL to open (must include http:// or https://)"),
  }),
  execute: async ({ url }) => {
    try {
      const fullUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

      // Block dangerous schemes
      if (/^(javascript|file|data):/i.test(fullUrl)) {
        return { success: false, message: "Only http:// and https:// URLs are allowed" };
      }

      const proc = Bun.spawn(["open", fullUrl]);
      await proc.exited;

      if (proc.exitCode === 0) {
        return { success: true, message: `Opened ${fullUrl}` };
      } else {
        return { success: false, message: "Failed to open URL" };
      }
    } catch {
      return { success: false, message: "Failed to open URL" };
    }
  },
};
