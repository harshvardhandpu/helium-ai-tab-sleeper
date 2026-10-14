# Helium AI Tab Sleeper

A small local Chromium extension that unloads inactive non-AI tabs after **five minutes**, while keeping AI websites and explicitly protected work tabs loaded. Tabs stay in the tab strip and reload when selected.

Built for Helium on Linux. The extension uses standard Chromium extension APIs; other Chromium browsers may support it, but the installed-browser checks documented here used Helium.

## What stays loaded

- ChatGPT, Claude, Gemini, AI Studio, Grok, Perplexity, Copilot, DeepSeek, Qwen, Mistral and Poe, including their subdomains.
- Selected/highlighted tabs, pinned tabs, playing audio/video, navigation in progress and unsent form input.
- Tabs marked **Keep this tab active for work** in the popup.
- Sites added through **Always keep this site active**, localhost, and detected WebDriver sessions.

The popup also provides **Pause sleeping**. Eligibility is checked every 30 seconds, so an eligible tab normally unloads between five and five-and-a-half minutes after its last activity. Form protection is deliberately conservative and remains until navigation. Browsers can delay alarms under load.

## Install the extension

1. Clone or download this repository.
2. Open `helium://extensions` and enable Developer mode.
3. Choose **Load unpacked** and select the repository's `extension` directory.
4. Pin the extension's toolbar button if you want easy access to work protection and pause controls.

Alternatively, `python3 scripts/install-extension.py` copies the extension to `~/.local/share/helium-tab-sleeper`; load that directory in step 3. It refuses to overwrite an unrelated directory and backs up an existing installation. No sudo or system packages are required.

For additional protection against native browser deactivation/freezing, also add your AI sites to the browser's **Settings → Performance → Always keep these sites active** list. The extension's site list is separate from that native list.

## AI agents and automatic activation

**This extension does not redirect every agent's browser tools to Helium.** It cannot change an application's managed Chrome, Edge, Firefox, remote browser or API-based search tool.

The optional [protected launcher and MCP setup](integrations/README.md) provides an explicit Helium route. When an agent calls a configured Playwright MCP `browser_navigate` tool, that server starts protected headless Helium on demand. Merely starting the agent or opening its chat does not start a browser.

Use a separate protected profile for agent work: the included launcher disables native Memory Saver and tab freezing in its newly created agent profiles and does not load this sleeper there. Different MCP sessions should have different profiles. An agent should track its own tabs and close only its task-created tabs after browser work finishes; it must preserve existing user tabs and unfinished work. A shared personal tab can instead be pinned or marked for work in the popup.

## Privacy and permissions

The extension requests `tabs`, `alarms` and `storage`, and installs a small page guard on HTTP/HTTPS frames. The guard sends only activity, draft, media and automation flags. It does not read form values, page text, passwords or tokens. Tab metadata and protection flags remain local. There are no telemetry, analytics, external scripts or network requests in the extension. Extension-page CSP disallows connections.

This is a memory-management tool, not a security boundary. It cannot protect against an OS killing a browser under extreme memory pressure, and it cannot detect the owner of every tab created through every possible automation system. The protected agent profile is the reliable route for agent work; WebDriver detection alone is not a universal ownership detector.

## Validation

Run the dependency-free policy tests with Node.js 18 or newer:

```sh
node --test tests/policy.test.mjs
python3 -m unittest discover -s tests -p 'test_*.py'
```

Live installation tests used Helium 0.19.2.1 / Chromium 155.0.8059.39. They verified real five-minute unloading, tab reload on selection, unsent-form protection, work protection and custom-site protection against native discard. [Measured RAM savings and agent-route checks](VALIDATION.md) describe the test method and its limits.

To remove the extension, use its **Remove** button in `helium://extensions`. Remove any optional launcher integration separately and restore your original launcher if you replaced it.

MIT licensed. This project is independent of Helium, Chromium, OpenAI, Google, Microsoft and Nous Research.
