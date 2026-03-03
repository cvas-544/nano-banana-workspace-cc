# Nano Banana Workspace

An integrated image generation and refinement workspace built on top of the [cc-nano-banana](https://github.com/kkoppenhaver/cc-nano-banana) Claude Code skill by [@kkoppenhaver](https://github.com/kkoppenhaver).

## What This Is

This repo extends the nano-banana skill into a full **closed-loop prompt refinement workspace** — combining inline image generation, canvas-based annotation, skill memory, and iteration tracking into a single UI.

Instead of copy-pasting prompts between tools, you generate, annotate, refine, and regenerate — all in one place.

## What's Inside

| File | Purpose |
|------|---------|
| `nano-banana-server.js` | Local bridge server that connects the playground to the Gemini CLI |
| `nano-banana-playground.html` | Integrated refinement workspace (open in browser) |

## Features

- **Inline generation** — write a prompt, click Generate, image appears directly in the workspace
- **Canvas annotation** — click to drop a numbered pin, drag to draw a region box on the image
- **Annotation panel** — categorized notes (composition, lighting, color, detail, mood, texture) with critical / nice-to-have priority
- **Hover highlight** — hover an annotation card to highlight its pin or region on the image
- **Refined prompt** — all annotations merge into a structured Nano Banana prompt automatically
- **Skill memory** — repeated annotation patterns are tracked and suggested in future sessions
- **Iteration history** — bake versions to track how your prompt evolves across rounds
- **Server UI controls** — start/stop the bridge server from the topbar without touching the terminal

## Built On

This workspace is built on the [cc-nano-banana](https://github.com/kkoppenhaver/cc-nano-banana) skill by [@kkoppenhaver](https://github.com/kkoppenhaver), which provides the core Gemini CLI integration for image generation via the nanobanana extension.

## Requirements

- [Claude Code](https://claude.ai/code) CLI
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) installed
- nanobanana extension installed:
  ```bash
  gemini extensions install https://github.com/gemini-cli-extensions/nanobanana
  ```
- A Gemini API key configured in `~/.gemini/settings.json`:
  ```json
  { "apiKey": "your-key-here" }
  ```
- Node.js (for the bridge server)

## Setup

**1. Clone the repo**
```bash
git clone https://github.com/cvas-544/nano-banana-workspace-cc.git
cd nano-banana-workspace-cc
```

**2. Start the bridge server**
```bash
node nano-banana-server.js
```

Or silently in the background:
```bash
nohup node nano-banana-server.js > /tmp/nb-server.log 2>&1 &
```

**3. Open the playground**
```bash
open nano-banana-playground.html
```

## The Refinement Loop

```
Write prompt → Generate → Observe image → Click/draw annotations
      ↑                                              ↓
Bake iteration ← Refined prompt auto-built ← Annotate with category + priority
```

Each iteration is saved to history. Annotation patterns you repeat across sessions are tracked in skill memory and surfaced as suggestions — making your prompts more precise over time.

## How This Was Built

The interactive refinement workspace (`nano-banana-playground.html`) was scaffolded using the [Claude Playground Plugin](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/playground) by Anthropic — a Claude Code plugin that generates self-contained, single-file HTML playgrounds with live controls and prompt output. It provided the structural foundation and template system for building the annotation workspace, which was then extended with canvas-based image annotation, a local bridge server, and skill memory tracking.

## Acknowledgements

- [cc-nano-banana](https://github.com/kkoppenhaver/cc-nano-banana) by [@kkoppenhaver](https://github.com/kkoppenhaver) — the Claude Code skill that powers the underlying image generation
- [Claude Playground Plugin](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/playground) by Anthropic — used to scaffold and build the interactive refinement workspace
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) by Google
- [nanobanana extension](https://github.com/gemini-cli-extensions/nanobanana) for the image generation commands
