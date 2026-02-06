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

export const musicPlay: ToolDefinition = {
  name: "music_play",
  description: "Play music or search and play a specific song/artist/playlist. Works with Apple Music or Spotify.",
  parameters: z.object({
    query: z.string().optional().describe("Search query (song, artist, or playlist name). If empty, resumes playback."),
    app: z.enum(["music", "spotify"]).optional().describe("Which app to use: 'music' for Apple Music, 'spotify' for Spotify. Default: music"),
  }),
  execute: async ({ query, app = "music" }) => {
    try {
      const appName = app === "spotify" ? "Spotify" : "Music";

      if (query) {
        const safeQuery = query.replace(/["\\]/g, "");

        if (app === "spotify") {
          const searchUrl = `spotify:search:${encodeURIComponent(safeQuery)}`;
          await runAppleScript(`tell application "Spotify" to play track "${searchUrl}"`);
        } else {
          const script = `
            tell application "Music"
              activate
              set results to (search playlist "Library" for "${safeQuery}")
              if length of results > 0 then
                play item 1 of results
              else
                play
              end if
            end tell
          `;
          await runAppleScript(script);
        }
        return { success: true, message: `Playing "${safeQuery}" on ${appName}` };
      } else {
        await runAppleScript(`tell application "${appName}" to play`);
        return { success: true, message: `Resumed playback on ${appName}` };
      }
    } catch {
      return { success: false, message: "Failed to play music" };
    }
  },
};

export const musicPause: ToolDefinition = {
  name: "music_pause",
  description: "Pause music playback",
  parameters: z.object({
    app: z.enum(["music", "spotify"]).optional().describe("Which app: 'music' or 'spotify'. Default: music"),
  }),
  execute: async ({ app = "music" }) => {
    const appName = app === "spotify" ? "Spotify" : "Music";
    await runAppleScript(`tell application "${appName}" to pause`);
    return { success: true, message: `Paused ${appName}` };
  },
};

export const musicNext: ToolDefinition = {
  name: "music_next",
  description: "Skip to next track",
  parameters: z.object({
    app: z.enum(["music", "spotify"]).optional().describe("Which app: 'music' or 'spotify'. Default: music"),
  }),
  execute: async ({ app = "music" }) => {
    const appName = app === "spotify" ? "Spotify" : "Music";
    await runAppleScript(`tell application "${appName}" to next track`);
    return { success: true, message: `Skipped to next track on ${appName}` };
  },
};

export const musicPrevious: ToolDefinition = {
  name: "music_previous",
  description: "Go to previous track",
  parameters: z.object({
    app: z.enum(["music", "spotify"]).optional().describe("Which app: 'music' or 'spotify'. Default: music"),
  }),
  execute: async ({ app = "music" }) => {
    const appName = app === "spotify" ? "Spotify" : "Music";
    await runAppleScript(`tell application "${appName}" to previous track`);
    return { success: true, message: `Previous track on ${appName}` };
  },
};

export const volumeSet: ToolDefinition = {
  name: "volume_set",
  description: "Set the system volume level",
  parameters: z.object({
    level: z.number().min(0).max(100).describe("Volume level from 0 to 100"),
  }),
  execute: async ({ level }) => {
    await runAppleScript(`set volume output volume ${level}`);
    return { success: true, message: `Volume set to ${level}%` };
  },
};

export const volumeMute: ToolDefinition = {
  name: "volume_mute",
  description: "Mute or unmute the system volume",
  parameters: z.object({
    mute: z.boolean().describe("true to mute, false to unmute"),
  }),
  execute: async ({ mute }) => {
    await runAppleScript(`set volume output muted ${mute}`);
    return { success: true, message: mute ? "Muted" : "Unmuted" };
  },
};
