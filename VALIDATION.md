# Validation

## Real RAM test

One before/after run used the real Helium 0.19.2.1 / Chromium 155.0.8059.39 executable on an isolated Xvfb display, with twenty public workload tabs. It did not run paid inference requests or use signed-in conversations.

The workload contained nine ChatGPT public pages, three Reddit pages, three Wikipedia pages, two GitHub pages, Hacker News and two MDN documentation pages. Every page passed initial content checks. One Wikipedia tab was explicitly protected as an in-progress agent work tab; the foreground MDN tab remained selected. One internal extension page was present in both measurement phases.

| Phase | Median RAM (process-tree PSS) |
| --- | ---: |
| All workload tabs loaded | 1604.83 MiB |
| Nine inactive non-AI tabs sleeping | 1008.67 MiB |
| Saved | **596.16 MiB / 37.15%** |

Seven Linux `smaps_rollup` measurements were taken five seconds apart per phase after settling. All browser descendants were included and shared memory was apportioned with PSS. No swap or memory-read failures were recorded. The five-minute alarm ran in real time; all observed unloads occurred at least five minutes after last access. All twenty workload tabs remained open. All nine ChatGPT tabs, the protected non-AI work tab and the foreground page stayed loaded.

This result describes sleeping-tab savings. It does not promise the same reduction while all twenty pages run, or for larger signed-in conversations. Page contents, activity and protected tabs affect the result.

Separate live checks passed for reload on selection, unchanged tab count during sleeping, unsent-form protection, explicit work protection, native opt-out for new custom sites, settings after restart, and the protected agent profile. An early test harness tried to reuse a replaced Chromium page ID after RAM measurements; the corrected independent reload check passed. That harness error did not affect the retained RAM samples.

## Agent-route integration checks

The configured Playwright MCP route was exercised for Codex, Hermes and Gemini CLI. CoS invoked the same route through its real command connector. Each check initialized the MCP server, listed its actual tools, navigated a local HTML fixture, read the fixture's DOM through a browser tool, verified the running executable was the installed Helium binary, checked that its profile disabled Memory Saver and tab freezing, verified `--no-sandbox` was absent, and closed its own session/profile.

| Route | On-demand start | Real page/Helium process | Sleeping disabled | Sandbox enabled | Cleanup |
| --- | --- | --- | --- | --- | --- |
| Codex Helium MCP | Pass | Pass | Pass | Pass | Pass |
| Hermes Helium MCP | Pass | Pass | Pass | Pass | Pass |
| Gemini CLI Helium MCP | Pass | Pass | Pass | Pass | Pass |
| CoS command → Helium MCP | Pass | Pass | Pass | Pass | Pass |

Codex's MCP registration was checked with its CLI. Gemini's CLI discovered the server and reported it connected; the main settings and both account-profile settings were registered. Hermes's YAML registers the same stdio command. Preference instructions were added for each client.

These are deterministic tool-route checks, not live LLM/model-choice tests. They demonstrate that calling the configured route activates protected Helium. They do not prove that every future agent prompt chooses that route, and they do not redirect an application's existing managed browser tools. A fresh client session or tool refresh may be needed after registration.

## Reproducible source checks

The included Node policy tests check the five-minute boundary, recent activity, AI subdomains, hostname spoofing, selected/loading/navigating tabs, draft/media protection and work/automation flags. Python installer tests check owned upgrades/backups, unrelated-directory preservation and symlink protection.

The page guard and extension worker have no remote dependencies. Optional MCP integrations use the [official Playwright MCP](https://github.com/microsoft/playwright-mcp) browser-executable and sandbox controls. [Chromium's tabs API](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-discard) documents the underlying unload/reload operation.
