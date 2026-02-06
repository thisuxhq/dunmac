import { z } from "zod";
import type { ToolDefinition } from "../types";
import { unlink } from "fs/promises";

export const screenshot: ToolDefinition = {
  name: "screenshot",
  description: "Take a screenshot of the Mac screen. Returns the image as base64.",
  parameters: z.object({
    type: z.enum(["full", "window"]).optional().describe("Type of screenshot: 'full' for entire screen, 'window' for front window. Default: full"),
  }),
  execute: async ({ type = "full" }) => {
    try {
      const filename = `/tmp/dunmac-screenshot-${Date.now()}.png`;
      const args = ["screencapture", "-x"]; // -x prevents sound
      
      if (type === "window") {
        args.push("-l", "$(osascript -e 'tell app \"System Events\" to id of first window of (first process whose frontmost is true)')");
      }
      
      args.push(filename);
      
      const proc = Bun.spawn(["screencapture", "-x", filename]);
      await proc.exited;
      
      if (proc.exitCode === 0) {
        // Read file and convert to base64
        const file = Bun.file(filename);
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        
        // Clean up
        await unlink(filename);
        
        return { 
          success: true, 
          message: "Screenshot captured",
          data: {
            base64,
            mimeType: "image/png"
          }
        };
      } else {
        return { success: false, message: `Failed to capture screenshot` };
      }
    } catch {
      return { success: false, message: "Failed to capture screenshot" };
    }
  },
};
