import { z } from "zod";
import type { ToolDefinition } from "../types";

async function runAppleScript(script: string): Promise<{ success: boolean; output?: string; error?: string }> {
  const proc = Bun.spawn(["osascript", "-e", script], {
    stdout: "pipe",
    stderr: "pipe",
  });
  
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  await proc.exited;
  
  if (proc.exitCode === 0) {
    return { success: true, output: stdout.trim() };
  }
  return { success: false, error: stderr.trim() };
}

export const darkMode: ToolDefinition = {
  name: "dark_mode",
  description: "Toggle or set dark mode on macOS",
  parameters: z.object({
    enable: z.boolean().optional().describe("true for dark mode, false for light mode. If not provided, toggles current mode."),
  }),
  execute: async ({ enable }) => {
    try {
      if (enable === undefined) {
        // Toggle
        await runAppleScript(`
          tell application "System Events"
            tell appearance preferences
              set dark mode to not dark mode
            end tell
          end tell
        `);
        return { success: true, message: "Toggled dark mode" };
      } else {
        await runAppleScript(`
          tell application "System Events"
            tell appearance preferences
              set dark mode to ${enable}
            end tell
          end tell
        `);
        return { success: true, message: enable ? "Dark mode enabled" : "Light mode enabled" };
      }
    } catch (error) {
      return { success: false, message: `Error: ${error}` };
    }
  },
};

export const lockScreen: ToolDefinition = {
  name: "lock_screen",
  description: "Lock the Mac screen immediately",
  parameters: z.object({}),
  execute: async () => {
    try {
      const proc = Bun.spawn(["pmset", "displaysleepnow"]);
      await proc.exited;
      return { success: true, message: "Screen locked" };
    } catch (error) {
      return { success: false, message: `Error: ${error}` };
    }
  },
};

export const sleepDisplay: ToolDefinition = {
  name: "sleep_display",
  description: "Put the display to sleep (screen off, Mac stays awake)",
  parameters: z.object({}),
  execute: async () => {
    try {
      const proc = Bun.spawn(["pmset", "displaysleepnow"]);
      await proc.exited;
      return { success: true, message: "Display sleeping" };
    } catch (error) {
      return { success: false, message: `Error: ${error}` };
    }
  },
};

export const batteryStatus: ToolDefinition = {
  name: "battery_status",
  description: "Get the current battery status and percentage",
  parameters: z.object({}),
  execute: async () => {
    try {
      const proc = Bun.spawn(["pmset", "-g", "batt"], {
        stdout: "pipe",
      });
      const stdout = await new Response(proc.stdout).text();
      await proc.exited;
      
      // Parse battery info
      const percentMatch = stdout.match(/(\d+)%/);
      const chargingMatch = stdout.match(/(charging|discharging|charged)/i);
      
      return { 
        success: true, 
        message: `Battery: ${percentMatch?.[1] || "unknown"}% (${chargingMatch?.[1] || "unknown"})`,
        data: {
          percentage: percentMatch?.[1] ? parseInt(percentMatch[1]) : null,
          status: chargingMatch?.[1]?.toLowerCase() || "unknown",
        }
      };
    } catch (error) {
      return { success: false, message: `Error: ${error}` };
    }
  },
};

export const getRunningApps: ToolDefinition = {
  name: "running_apps",
  description: "List all currently running applications",
  parameters: z.object({}),
  execute: async () => {
    try {
      const result = await runAppleScript(`
        tell application "System Events"
          get name of every process whose background only is false
        end tell
      `);
      
      if (result.success && result.output) {
        const apps = result.output.split(", ");
        return { 
          success: true, 
          message: `Running apps: ${apps.join(", ")}`,
          data: { apps }
        };
      }
      return { success: false, message: "Failed to get running apps" };
    } catch (error) {
      return { success: false, message: `Error: ${error}` };
    }
  },
};

export const getFrontApp: ToolDefinition = {
  name: "front_app",
  description: "Get the currently focused/frontmost application",
  parameters: z.object({}),
  execute: async () => {
    try {
      const result = await runAppleScript(`
        tell application "System Events"
          get name of first process whose frontmost is true
        end tell
      `);
      
      if (result.success && result.output) {
        return { 
          success: true, 
          message: `Front app: ${result.output}`,
          data: { app: result.output }
        };
      }
      return { success: false, message: "Failed to get front app" };
    } catch (error) {
      return { success: false, message: `Error: ${error}` };
    }
  },
};

export const doNotDisturb: ToolDefinition = {
  name: "do_not_disturb",
  description: "Toggle Do Not Disturb mode (Focus mode)",
  parameters: z.object({
    enable: z.boolean().describe("true to enable DND, false to disable"),
  }),
  execute: async ({ enable }) => {
    try {
      // This uses the shortcuts app to toggle DND
      // User needs to have "Turn Do Not Disturb On/Off" shortcut
      const shortcutName = enable ? "Turn Do Not Disturb On" : "Turn Do Not Disturb Off";
      const proc = Bun.spawn(["shortcuts", "run", shortcutName]);
      await proc.exited;
      
      return { 
        success: true, 
        message: enable ? "Do Not Disturb enabled" : "Do Not Disturb disabled" 
      };
    } catch (error) {
      // Fallback message
      return { 
        success: false, 
        message: `DND toggle requires Shortcuts app setup. Error: ${error}` 
      };
    }
  },
};

export const emptyTrash: ToolDefinition = {
  name: "empty_trash",
  description: "Empty the Trash",
  parameters: z.object({}),
  execute: async () => {
    try {
      await runAppleScript(`
        tell application "Finder"
          empty trash
        end tell
      `);
      return { success: true, message: "Trash emptied" };
    } catch (error) {
      return { success: false, message: `Error: ${error}` };
    }
  },
};
