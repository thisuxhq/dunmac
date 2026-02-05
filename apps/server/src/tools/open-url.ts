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
      // Ensure URL has protocol
      const fullUrl = url.startsWith("http") ? url : `https://${url}`;
      const proc = Bun.spawn(["open", fullUrl]);
      await proc.exited;
      
      if (proc.exitCode === 0) {
        return { success: true, message: `Opened ${fullUrl}` };
      } else {
        return { success: false, message: `Failed to open URL` };
      }
    } catch (error) {
      return { success: false, message: `Error: ${error}` };
    }
  },
};
