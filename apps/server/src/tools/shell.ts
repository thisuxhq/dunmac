import { z } from "zod";
import type { ToolDefinition } from "../types";

// Allowlist of safe commands
const ALLOWED_COMMANDS = [
  "ls", "pwd", "whoami", "date", "cal", "uptime",
  "df", "du", "free", "top", "ps",
  "echo", "cat", "head", "tail", "wc",
  "grep", "find", "which", "whereis",
  "open", "say", "screencapture",
  "osascript", "defaults",
  "networksetup", "system_profiler",
  "pmset", "caffeinate",
  "mkdir", "touch", "cp", "mv",
];

// Dangerous patterns to block
const BLOCKED_PATTERNS = [
  /rm\s+-rf/i,
  /sudo/i,
  /chmod\s+777/i,
  />\s*\/dev/i,
  /mkfs/i,
  /dd\s+if=/i,
  /:(){ :|:& };:/i, // fork bomb
  /curl.*\|.*sh/i,
  /wget.*\|.*sh/i,
];

export const shell: ToolDefinition = {
  name: "shell",
  description: "Run a shell command on macOS. Only safe commands are allowed. Use for system info, file operations, etc.",
  parameters: z.object({
    command: z.string().describe("The shell command to execute"),
  }),
  execute: async ({ command }) => {
    try {
      // Check for blocked patterns
      for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(command)) {
          return { success: false, message: `Blocked: dangerous command pattern detected` };
        }
      }
      
      // Get the base command (first word)
      const baseCommand = command.trim().split(/\s+/)[0];
      
      // Check if command is allowed
      if (!ALLOWED_COMMANDS.includes(baseCommand)) {
        return { 
          success: false, 
          message: `Command "${baseCommand}" is not in the allowlist. Allowed: ${ALLOWED_COMMANDS.join(", ")}` 
        };
      }
      
      const proc = Bun.spawn(["bash", "-c", command], {
        stdout: "pipe",
        stderr: "pipe",
      });
      
      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      await proc.exited;
      
      if (proc.exitCode === 0) {
        return { 
          success: true, 
          message: stdout.trim() || "Command executed successfully",
          data: { stdout: stdout.trim(), stderr: stderr.trim() }
        };
      } else {
        return { 
          success: false, 
          message: stderr.trim() || `Command failed with exit code ${proc.exitCode}` 
        };
      }
    } catch (error) {
      return { success: false, message: `Error: ${error}` };
    }
  },
};
