# Protected Helium for agent work

The extension is separate from browser automation. A browser integration must explicitly select Helium; an instruction to an agent is a preference, not a system-wide redirection rule.

## Optional launcher

`helium-launch.py` supports two modes:

- Normal mode loads the personal tab sleeper when no separate profile is supplied.
- `--agent-profile` uses an AI profile with Memory Saver and tab freezing disabled and without the sleeper.

It expects Helium at `~/.local/opt/helium/current/helium-wrapper` by default. Set `HELIUM_REAL_BINARY` to the actual browser executable/wrapper for another installation. Do not point it at a launcher that calls this script again.

To install the protected helper without replacing your normal browser command:

```sh
mkdir -p ~/.local/libexec ~/.local/bin
cp integrations/helium-launch.py ~/.local/libexec/helium-launch
chmod +x ~/.local/libexec/helium-launch
```

Create `~/.local/bin/helium-agent` with:

```sh
#!/bin/sh
exec "$HOME/.local/libexec/helium-launch" --agent-profile "$@"
```

Make it executable. If the file already exists, inspect it and back it up first. `helium-agent` then opens the protected profile. Supplying a driver profile under `~/.config/helium-agent-profiles/` is supported; the personal profile is refused.

Normal mode can be used from a separate personal launcher with `--load-extension` behavior. Back up an existing launcher before intentionally replacing it. This repository's installer installs only the extension; it does not change default-browser associations, native browser settings or existing launchers.

## Playwright MCP

The [official Playwright MCP server](https://github.com/microsoft/playwright-mcp) supports an executable path, a user-data directory and sandbox/headless options. Configure your client to run its browser tools using `helium-agent`, a unique managed profile, **headless mode** and **sandbox enabled**.

Example Gemini/other JSON client definition (replace every absolute path with your own):

```json
{
  "mcpServers": {
    "helium_browser": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--executable-path", "/absolute/home/.local/bin/helium-agent",
        "--user-data-dir", "/absolute/home/.config/helium-agent-profiles/gemini",
        "--headless", "--sandbox"
      ]
    }
  }
}
```

Use the corresponding `[mcp_servers.helium_browser]` command/args section for Codex and `mcp_servers.helium_browser` in Hermes YAML. A profile can be used by only one browser instance at a time: use distinct profiles for parallel sessions or an isolated driver profile. Do not share the same profile across concurrent agents.

For CoS, use a supported MCP integration or its permitted command tool to launch the protected helper. CoS's managed browser/UI tools do not universally switch engines merely because this extension is installed. Preserve required tool-selection and browser safety rules in every client.

Suggested agent instruction:

> Prefer the configured helium_browser MCP tools for browser work when the user has not requested a specific browser or another tool is mandatory. Keep task tabs active throughout the work. When browser work finishes, close only tabs created for that task. Preserve existing user tabs, active tasks and unsaved work. State the actual browser used; never claim a managed browser was automatically redirected.

The local integration checks used the installed Playwright MCP CLI, not paid model inference. They validate the launch/browser/cleanup route, not an LLM's choice of tool on every future prompt.
