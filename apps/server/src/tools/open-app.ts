import { z } from "zod";
import type { ToolDefinition } from "../types";

export const openApp: ToolDefinition = {
  name: "open_app",
  description: "Open an application on macOS. Use the app name like 'Visual Studio Code', 'Spotify', 'Safari', 'Finder', 'Terminal', etc.",
  parameters: z.object({
    name: z.string().describe("The name of the application to open"),
  }),
  execute: async ({ name }) => {
    try {
      const script = `tell application "${name}" to activate`;
      const proc = Bun.spawn(["osascript", "-e", script]);
      await proc.exited;
      
      if (proc.exitCode === 0) {
        return { success: true, message: `Opened ${name}` };
      } else {
        return { success: false, message: `Failed to open ${name}` };
      }
    } catch (error) {
      return { success: false, message: `Error: ${error}` };
    }
  },
};
