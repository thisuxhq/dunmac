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
  const response = await fetch(`${serverUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function getTools(serverUrl: string): Promise<{ name: string; description: string }[]> {
  const response = await fetch(`${serverUrl}/tools`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.tools;
}

export async function healthCheck(serverUrl: string): Promise<boolean> {
  try {
    const response = await fetch(serverUrl, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}

export function getScreenshotUrl(serverUrl: string): string {
  return `${serverUrl}/screenshot`;
}
