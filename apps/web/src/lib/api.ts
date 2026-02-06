export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface ChatAction {
  tool: string;
  args: Record<string, unknown>;
  result: ToolResult;
}

export interface ChatResponse {
  message: string;
  actions: ChatAction[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  actions?: ChatAction[];
  screenshot?: string;
}

export async function sendMessage(
  serverUrl: string,
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<ChatResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${serverUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, history }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function getTools(serverUrl: string): Promise<{ name: string; description: string }[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${serverUrl}/tools`, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.tools;
  } finally {
    clearTimeout(timeout);
  }
}

export async function healthCheck(serverUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(serverUrl, { method: "GET", signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function getScreenshotUrl(serverUrl: string): string {
  return `${serverUrl}/screenshot`;
}
