import type { ToolDefinition } from "../types";
import { openApp } from "./open-app";
import { openUrl } from "./open-url";
import { say } from "./say";
import { notify } from "./notify";
import { screenshot } from "./screenshot";
import { shell } from "./shell";
import { 
  musicPlay, 
  musicPause, 
  musicNext, 
  musicPrevious, 
  volumeSet, 
  volumeMute 
} from "./music";
import {
  darkMode,
  lockScreen,
  sleepDisplay,
  batteryStatus,
  getRunningApps,
  getFrontApp,
  doNotDisturb,
  emptyTrash,
} from "./system";

// Tool registry
export const tools: Record<string, ToolDefinition> = {
  open_app: openApp,
  open_url: openUrl,
  say: say,
  notify: notify,
  screenshot: screenshot,
  shell: shell,
  music_play: musicPlay,
  music_pause: musicPause,
  music_next: musicNext,
  music_previous: musicPrevious,
  volume_set: volumeSet,
  volume_mute: volumeMute,
  dark_mode: darkMode,
  lock_screen: lockScreen,
  sleep_display: sleepDisplay,
  battery_status: batteryStatus,
  running_apps: getRunningApps,
  front_app: getFrontApp,
  do_not_disturb: doNotDisturb,
  empty_trash: emptyTrash,
};

// Get tool definitions for AI SDK
export function getToolDefinitions() {
  return Object.entries(tools).reduce((acc, [name, tool]) => {
    acc[name] = {
      description: tool.description,
      parameters: tool.parameters,
    };
    return acc;
  }, {} as Record<string, { description: string; parameters: any }>);
}

// Execute a tool by name
export async function executeTool(name: string, args: Record<string, unknown>) {
  const tool = tools[name];
  if (!tool) {
    return { success: false, message: `Unknown tool: ${name}` };
  }
  
  try {
    // Validate args against schema
    const validatedArgs = tool.parameters.parse(args);
    return await tool.execute(validatedArgs);
  } catch (error) {
    return { success: false, message: `Validation error: ${error}` };
  }
}

export { tools as toolRegistry };
