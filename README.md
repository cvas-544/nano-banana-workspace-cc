# image-studio-CC

A complete AI image creation workflow skill for Claude Code. Combines intelligent prompt engineering, brand identity, style learning, and image generation into a single end-to-end pipeline — powered by the `nano-banana` skill for generation and a local refinement workspace for iteration.

---

## What It Does

`image-studio-CC` is the "brain" layer on top of raw image generation. It:

- Analyzes reference images and extracts visual fingerprints
- Asks you how you want to use the reference (recreate, inspire, brand-align, or customize)
- Builds a precise, natural-language prompt optimized for Nano Banana / Imagen
- Calls the `nano-banana` skill to generate the image
- Opens a local refinement workspace with the prompt pre-loaded for annotation and iteration
- Learns your visual style over time and saves it to a portable memory file

---

## Files

```
image-studio-CC/
├── SKILL.md                     ← Full skill logic (loaded by Claude Code)
├── nano-banana-server.js        ← Local bridge server for the refinement workspace
├── nano-banana-playground.html  ← Visual refinement workspace (opens in browser)
└── README.md                    ← This file
```

---

## Dependencies

- **`nano-banana` skill** — handles actual image generation via Gemini CLI. Must be installed at `~/.claude/skills/nano-banana/`
- **Gemini CLI** — must be installed and configured with a valid `GEMINI_API_KEY`
- **Node.js** — required to run the local bridge server

### Set your API key
```bash
export GEMINI_API_KEY="your-key-here"
```
Get your key at [aistudio.google.com](https://aistudio.google.com).

---

## How to Use

### Step 1 — Load the skill
In Claude Code, type:
```
image-studio-CC
```
Or pass a reference image path directly:
```
image-studio-CC Test.jpg
```

### Step 2 — Choose a command

| Command | What it does |
|---|---|
| `/prompt` | Analyze a reference image and generate an optimized prompt |
| `/generate` | Full pipeline — prompt → generate image → open workspace |
| `/brand` | Quick brand-aligned image creation using saved brand settings |
| `/recreate` | Instantly recreate a reference image as closely as possible |
| `/inspire` | Use a reference image's style, apply it to new content |
| `/setup` | Set up your brand identity (colors, style, tone, font) |
| `/changeStyle` | Update saved brand settings |
| `/showBrand` | View your current brand settings |
| `/carousel` | Generate 3–6 brand-aligned prompts for a carousel series |
| `/post` | Generate an image prompt + LinkedIn post + blog post together |
| `/exportPDF` | Export the prompt + image + brand settings as a PDF brief |

---

## The Full Workflow

```
You load image-studio-CC (with optional image path or attachment)
        ↓
Skill silently loads:
  - Annotation patterns (nano-banana-skill-memory.json)
  - Style memory      (~/.config/image-prompt/style-memory.md)
  - Brand settings    (~/.config/image-prompt/brand.json)
        ↓
You run /generate (or /prompt)
        ↓
Skill asks: which mode?
  1. Recreate closely
  2. Style inspiration
  3. Brand-aligned recreation
  4. Recreate with my changes  ← type your own modifications
        ↓
Prompt is built silently (no further questions)
        ↓
nano-banana skill generates the image
        ↓
Refinement workspace opens in browser
  - Prompt is pre-loaded
  - Annotate regions, add numbered notes
  - Bake refined prompts, track iteration history
  - Annotation patterns saved back to skill memory
```

---

## Mode Selection

When you provide a reference image, you pick one of four modes:

### Mode 1 — Recreate Closely
Reproduce the reference as faithfully as possible. Same composition, lighting, palette, materials, mood.

### Mode 2 — Style Inspiration
Capture the visual aesthetic from the reference and apply it to new content you specify. The style transfers, the subject changes.

### Mode 3 — Brand-Aligned Recreation
Use your saved brand colors, style, and tone as the visual language — apply it to new content inspired by the reference composition.

### Mode 4 — Recreate with My Changes
Closely match the reference but layer your own modifications on top. You type what you want changed (e.g., "change the shoes to orange", "replace left screen with an AI revolution image", "make the background warmer").

---

## Brand Setup

Run `/setup` once to save your brand identity:

```
Brand name, accent color, background color, text color,
secondary color, visual style, tone, font preference
```

Saved to: `~/.config/image-prompt/brand.json`

Once saved, brand settings load silently every session — never asked again unless you run `/setup` or `/changeStyle`.

---

## Style Memory

Every reference image you analyze is automatically added to your style memory file:

```
~/.config/image-prompt/style-memory.md
```

This file accumulates your visual style profile over time — recording visual style, color story, lighting character, composition tendencies, mood, and storytelling approach from each reference.

**This file is portable.** Paste it into ChatGPT, Gemini, or any other AI to instantly transfer your style context to that model.

Example entry:
```markdown
## Reference: Man from behind at dual monitors in minimalist studio — 2026-03-04

**Visual Style:** Cinematic editorial photography, photorealistic, fashion-tech aesthetic
**Color Story:** Near-monochromatic — white, charcoal black, chrome silver
**Lighting:** Soft diffused overhead ambient, even with no harsh shadows
**Composition:** Rear-centered, symmetrical, mid-level camera angle
**Mood:** Contemplative, focused, editorial, slightly clinical yet premium
**Storytelling:** Subject immersed in work — tension between human and screen
**Prompt patterns learned:** "seen from behind", "symmetrically framing", "near-monochromatic palette"
```

---

## Refinement Workspace

The local workspace (`nano-banana-playground.html`) lets you refine generated images visually:

- Click or draw regions on the image to pin annotations
- Each annotation ties to a numbered card in the side panel
- Annotations merge into the prompt automatically
- Repeated annotation patterns are tracked in skill memory and suggested in future sessions
- Bake versions to track your prompt evolution over time

The bridge server (`nano-banana-server.js`) runs locally on port `3333` and connects Claude Code to the workspace. It starts automatically when you run `/generate`.

### Manual server control
```bash
# Start
node ~/.claude/skills/image-studio-CC/nano-banana-server.js

# Stop
kill $(lsof -ti:3333)

# Check logs
tail -f /tmp/nb-server.log
```

---

## Smart `/generate` Behavior

`/generate` is the primary command. It's smart about context:

| Situation | What happens |
|---|---|
| `/prompt` already ran this session | Reuses that prompt — no re-prompting |
| Image provided, no prior prompt | Asks mode (1/2/3/4) → builds silently → generates → opens workspace |
| No image, no prior prompt | Asks one-line description → builds silently → generates → opens workspace |

---

## Relationship with nano-banana

`image-studio-CC` and `nano-banana` are separate, complementary skills:

| Skill | Role |
|---|---|
| `image-studio-CC` | Orchestration layer — prompt engineering, brand, style memory, workspace, mode selection |
| `nano-banana` | Generation engine — executes Gemini CLI commands to produce the image |

`image-studio-CC` calls `nano-banana` internally during `/generate`. You never need to invoke `nano-banana` directly for image studio workflows.

---

## Skill Memory Files

| File | Purpose |
|---|---|
| `~/.config/image-prompt/brand.json` | Your saved brand identity |
| `~/.config/image-prompt/style-memory.md` | Cumulative visual style journal (portable) |
| `~/.claude/projects/.../nano-banana-skill-memory.json` | Annotation patterns from workspace refinements |
