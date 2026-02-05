<script lang="ts">
  import { sendMessage, healthCheck, type ChatMessage, type ChatAction } from '$lib/api';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let serverUrl = $state('');
  let isConnected = $state(false);
  let isConnecting = $state(false);
  let messages = $state<ChatMessage[]>([]);
  let inputValue = $state('');
  let isLoading = $state(false);
  let messagesContainer = $state<HTMLDivElement | null>(null);
  let showTools = $state(false);

  // Quick action suggestions
  const quickActions = [
    { label: '👋 Say hello', prompt: 'Say "Hello United by AI Chennai!"' },
    { label: '📸 Screenshot', prompt: 'Take a screenshot' },
    { label: '🎵 Play music', prompt: 'Play some lo-fi music on Spotify' },
    { label: '🌙 Dark mode', prompt: 'Toggle dark mode' },
    { label: '💻 Open VS Code', prompt: 'Open Visual Studio Code' },
    { label: '🔋 Battery', prompt: "What's my battery status?" },
  ];

  onMount(() => {
    // Load saved server URL
    if (browser) {
      const saved = localStorage.getItem('dunmac_server_url');
      if (saved) {
        serverUrl = saved;
        checkConnection();
      }
    }
  });

  async function checkConnection() {
    if (!serverUrl) return;
    
    isConnecting = true;
    try {
      const ok = await healthCheck(serverUrl);
      isConnected = ok;
      if (ok && browser) {
        localStorage.setItem('dunmac_server_url', serverUrl);
      }
    } catch {
      isConnected = false;
    }
    isConnecting = false;
  }

  function scrollToBottom() {
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 50);
    }
  }

  async function handleSend() {
    if (!inputValue.trim() || isLoading || !isConnected) return;

    const userMessage = inputValue.trim();
    inputValue = '';

    // Add user message
    messages = [...messages, { role: 'user', content: userMessage }];
    scrollToBottom();

    isLoading = true;

    try {
      // Build history (last 10 messages for context)
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await sendMessage(serverUrl, userMessage, history);

      // Check if any action was a screenshot
      let screenshot: string | undefined;
      for (const action of response.actions) {
        if (action.tool === 'screenshot' && action.result.success && action.result.data) {
          const data = action.result.data as { base64: string; mimeType: string };
          screenshot = `data:${data.mimeType};base64,${data.base64}`;
        }
      }

      // Add assistant response
      messages = [...messages, {
        role: 'assistant',
        content: response.message,
        actions: response.actions,
        screenshot
      }];
    } catch (error) {
      messages = [...messages, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Connection failed'}`
      }];
    }

    isLoading = false;
    scrollToBottom();
  }

  function handleQuickAction(prompt: string) {
    inputValue = prompt;
    handleSend();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function disconnect() {
    isConnected = false;
    serverUrl = '';
    messages = [];
    if (browser) {
      localStorage.removeItem('dunmac_server_url');
    }
  }

  function getToolIcon(toolName: string): string {
    const icons: Record<string, string> = {
      open_app: '📱',
      open_url: '🔗',
      say: '🔊',
      notify: '🔔',
      screenshot: '📸',
      shell: '💻',
      music_play: '▶️',
      music_pause: '⏸️',
      music_next: '⏭️',
      music_previous: '⏮️',
      volume_set: '🔉',
      volume_mute: '🔇',
      dark_mode: '🌙',
      lock_screen: '🔒',
      battery_status: '🔋',
      running_apps: '📊',
      front_app: '🪟',
    };
    return icons[toolName] || '⚙️';
  }
</script>

<div class="app">
  {#if !isConnected}
    <!-- Connection Screen -->
    <div class="connect-screen">
      <div class="logo">
        <div class="logo-icon">🖥️</div>
        <h1>DunMac</h1>
        <p>Remote Mac Control</p>
      </div>

      <div class="connect-form">
        <label for="server-url">Server URL</label>
        <input
          id="server-url"
          type="url"
          bind:value={serverUrl}
          placeholder="https://your-tunnel.trycloudflare.com"
          onkeydown={(e) => e.key === 'Enter' && checkConnection()}
        />
        <button
          class="connect-btn"
          onclick={checkConnection}
          disabled={!serverUrl || isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
        </button>
      </div>

      <div class="connect-help">
        <p>Run on your Mac:</p>
        <code>cloudflared tunnel --url http://localhost:3456</code>
      </div>

      <div class="branding">
        <span>by</span>
        <strong>THISUX</strong>
      </div>
    </div>
  {:else}
    <!-- Chat Screen -->
    <div class="chat-screen">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <span class="status-dot"></span>
          <span class="header-title">DunMac</span>
        </div>
        <button class="disconnect-btn" onclick={disconnect}>
          Disconnect
        </button>
      </header>

      <!-- Messages -->
      <div class="messages" bind:this={messagesContainer}>
        {#if messages.length === 0}
          <div class="welcome">
            <div class="welcome-icon">🖥️</div>
            <h2>Connected!</h2>
            <p>Your Mac is ready to receive commands.</p>
            
            <div class="quick-actions">
              {#each quickActions as action}
                <button
                  class="quick-action"
                  onclick={() => handleQuickAction(action.prompt)}
                >
                  {action.label}
                </button>
              {/each}
            </div>
          </div>
        {:else}
          {#each messages as message}
            <div class="message {message.role}">
              <div class="message-content">
                {message.content}
              </div>
              
              {#if message.screenshot}
                <div class="screenshot">
                  <img src={message.screenshot} alt="Screenshot" />
                </div>
              {/if}
              
              {#if message.actions && message.actions.length > 0}
                <div class="actions">
                  {#each message.actions as action}
                    <div class="action {action.result.success ? 'success' : 'error'}">
                      <span class="action-icon">{getToolIcon(action.tool)}</span>
                      <span class="action-name">{action.tool}</span>
                      <span class="action-status">{action.result.success ? '✓' : '✗'}</span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
          
          {#if isLoading}
            <div class="message assistant">
              <div class="message-content loading">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          {/if}
        {/if}
      </div>

      <!-- Input -->
      <div class="input-area">
        <div class="input-container">
          <input
            type="text"
            bind:value={inputValue}
            placeholder="Ask DunMac to do something..."
            onkeydown={handleKeydown}
            disabled={isLoading}
          />
          <button
            class="send-btn"
            onclick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .app {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background: #0a0a0a;
  }

  /* Connection Screen */
  .connect-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    gap: 2rem;
  }

  .logo {
    text-align: center;
  }

  .logo-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .logo h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .logo p {
    color: #888;
    font-size: 0.9rem;
  }

  .connect-form {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .connect-form label {
    font-size: 0.875rem;
    color: #888;
  }

  .connect-form input {
    padding: 1rem;
    border: 1px solid #333;
    border-radius: 12px;
    background: #1a1a1a;
    color: #fff;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s;
  }

  .connect-form input:focus {
    border-color: #666;
  }

  .connect-btn {
    padding: 1rem;
    border: none;
    border-radius: 12px;
    background: #fff;
    color: #000;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .connect-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .connect-help {
    text-align: center;
    color: #666;
    font-size: 0.8rem;
  }

  .connect-help code {
    display: block;
    margin-top: 0.5rem;
    padding: 0.75rem 1rem;
    background: #1a1a1a;
    border-radius: 8px;
    font-size: 0.75rem;
    color: #4ade80;
  }

  .branding {
    position: absolute;
    bottom: 2rem;
    color: #444;
    font-size: 0.8rem;
  }

  .branding strong {
    color: #666;
  }

  /* Chat Screen */
  .chat-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-height: 100dvh;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid #222;
    background: #0a0a0a;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4ade80;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .header-title {
    font-weight: 600;
  }

  .disconnect-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #333;
    border-radius: 8px;
    background: transparent;
    color: #888;
    font-size: 0.8rem;
    cursor: pointer;
  }

  /* Messages */
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .welcome {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 1rem;
    padding: 2rem;
  }

  .welcome-icon {
    font-size: 3rem;
  }

  .welcome h2 {
    font-size: 1.5rem;
    font-weight: 600;
  }

  .welcome p {
    color: #888;
  }

  .quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    margin-top: 1rem;
  }

  .quick-action {
    padding: 0.75rem 1rem;
    border: 1px solid #333;
    border-radius: 20px;
    background: #1a1a1a;
    color: #fff;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .quick-action:hover {
    background: #2a2a2a;
    border-color: #444;
  }

  .message {
    max-width: 85%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .message.user {
    align-self: flex-end;
  }

  .message.assistant {
    align-self: flex-start;
  }

  .message-content {
    padding: 0.875rem 1rem;
    border-radius: 16px;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .message.user .message-content {
    background: #2563eb;
    border-bottom-right-radius: 4px;
  }

  .message.assistant .message-content {
    background: #1a1a1a;
    border-bottom-left-radius: 4px;
  }

  .message-content.loading {
    display: flex;
    gap: 0.25rem;
    padding: 1rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #666;
    animation: bounce 1.4s infinite ease-in-out both;
  }

  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }

  .screenshot {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #333;
  }

  .screenshot img {
    width: 100%;
    display: block;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .action {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    background: #1a1a1a;
    font-size: 0.75rem;
    color: #888;
  }

  .action.success {
    background: rgba(74, 222, 128, 0.1);
  }

  .action.error {
    background: rgba(239, 68, 68, 0.1);
  }

  .action-icon {
    font-size: 0.875rem;
  }

  .action-status {
    color: #4ade80;
  }

  .action.error .action-status {
    color: #ef4444;
  }

  /* Input */
  .input-area {
    padding: 1rem;
    border-top: 1px solid #222;
    background: #0a0a0a;
  }

  .input-container {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .input-container input {
    flex: 1;
    padding: 1rem;
    border: 1px solid #333;
    border-radius: 12px;
    background: #1a1a1a;
    color: #fff;
    font-size: 1rem;
    outline: none;
  }

  .input-container input:focus {
    border-color: #444;
  }

  .send-btn {
    width: 48px;
    height: 48px;
    border: none;
    border-radius: 12px;
    background: #2563eb;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s;
  }

  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
