---
name: image-prompt
description: >
  Generate optimized prompts for Google's Nano Banana (Imagen) image generators and
  create brand-aligned visual content. Use this skill whenever the user uploads a
  reference image and wants a prompt generated from it, asks to craft or write an
  image prompt, or uses any of these commands: /prompt, /setup, /changeStyle,
  /showBrand, /generate, /post, /carousel, /exportPDF, /recreate, /inspire, /brand.
  Also triggers when the user says "image prompt", "nano banana prompt", "generate a
  prompt for this image", "make a prompt from this photo", "help me describe this image
  for AI generation", or any time a reference image is uploaded alongside a generation
  intent. Always use this skill when brand colors, brand style, or visual identity is
  mentioned alongside image creation.
---

# Nano Banana Prompt Generator

Generate optimized prompts for Google's Nano Banana image generators, with full brand
identity support, saved brand settings, and integrations with image generation,
content creation, and PDF export.

---

## Session Startup (Run Every Time — In This Order)

**Do all of this silently before responding to the user. Never ask for brand info if brand.json exists.**

### Step 1 — Load Annotation Patterns

```bash
cat ~/.claude/projects/-Users-vasuchukka/memory/nano-banana-skill-memory.json 2>/dev/null
```

- Patterns with `count >= 2` → silently weave into every prompt. Show under KEY CHOICES as "Recurring refinements applied."
- Missing or empty → skip silently.

Pattern categories:
| Category | Where it goes in prompt |
|----------|------------------------|
| `lighting` | Lighting description clause |
| `composition` | Camera angle / framing clause |
| `color` | Color palette clause |
| `detail` | Material/texture/detail clause |
| `mood` | Mood/atmosphere clause |
| `texture` | Surface/material clause |

### Step 2 — Load Style Memory

```bash
cat ~/.config/image-prompt/style-memory.md 2>/dev/null
```

This file contains learned visual style, tone, and storytelling patterns extracted from past reference images. If it exists, silently absorb it — apply these patterns as a baseline style profile to every prompt generated in this session. Never show this file to the user unless they ask.

### Step 3 — Load Brand Settings

```bash
cat ~/.config/image-prompt/brand.json 2>/dev/null
```

- **If brand.json exists** → load silently. Never ask for brand info again.
- **If brand.json does NOT exist** → skip silently. Do NOT prompt the user. Brand setup is optional — the user can run `/setup` anytime they want it.

---

## Refinement Workspace

For iterative image annotation and inline generation, auto-start the bridge server before generating:

```bash
lsof -ti:3333 > /dev/null 2>&1 || nohup node ~/.claude/skills/image-studio-CC/nano-banana-server.js > /tmp/nb-server.log 2>&1 &
```

Then open the workspace:

```bash
open ~/.claude/skills/image-studio-CC/nano-banana-playground.html
```

The workspace lets you click or draw regions on the generated image, attach numbered annotations, and bake refined prompts — feeding patterns back into skill memory automatically.

---

---

## Commands

### `/setup` — Brand Onboarding

**Only runs when the user explicitly calls `/setup`. Never triggered automatically.**

Ask the user these questions (one at a time or as a grouped form):

1. **Brand name** — "What's your brand name?"
2. **Primary accent color** — "What's your primary brand color?" (accept hex, RGB, or name)
3. **Background color** — "What's your background/panel color?"
4. **Text color** — "What color is your body text?"
5. **Secondary/grey color** — "Any secondary or supporting color (e.g., grey)?"
6. **Visual style** — "How would you describe your brand's visual style?" (e.g., hand-drawn, minimalist, bold, editorial, photorealistic, flat illustration)
7. **Tone** — "What's the tone of your brand's visuals?" (e.g., professional, playful, premium, approachable)
8. **Font style** (optional) — "Any preferred font style?" (e.g., serif, sans-serif, script)

Then save to `~/.config/image-prompt/brand.json`:

```json
{
  "brand_name": "...",
  "colors": {
    "accent": "#E06E14",
    "background": "#F2EDE4",
    "text": "#1A1A1A",
    "secondary": "#827D78"
  },
  "visual_style": "hand-drawn doodle, editorial sketch",
  "tone": "approachable, conceptual",
  "font_style": "clean serif",
  "texture": "subtle paper grain overlay"
}
```

Confirm: "Brand settings saved! You can update them anytime with `/changeStyle`."

---

### `/changeStyle` — Update Brand Settings

Show the user their current settings, then ask what they want to change:

```
Current brand settings:
- Brand: [name]
- Accent: [color]
- Background: [color]
- Style: [style]
- Tone: [tone]

What would you like to update?
```

Ask only about what they want to change. Update and re-save `brand.json`. Confirm the change.

---

### `/showBrand` — Display Saved Brand Settings

Read and display `~/.config/image-prompt/brand.json` in a clean, readable format. If no settings are saved, prompt the user to run `/setup`.

---

### `/prompt` — Main Prompt Generation Flow

The default flow. Works with or without a reference image.

**With a reference image:**

1. **Analyze the image** — extract all visual dimensions (see Reference Image Analysis below)
2. **Ask the user which mode** (present as options):
   - **1. Recreate closely** — reproduce as faithfully as possible
   - **2. Style inspiration** — capture the aesthetic, apply to new content
   - **3. Brand-aligned recreation** — use saved brand colors + style for new content
   - **4. Recreate with my changes** — closely match the reference but let me describe my modifications (user types their ideas/changes freely after selecting this option)

   If the user picks **4**, ask: "What changes or ideas do you want to apply?" — accept free-form input (e.g., "change the shoes to orange", "replace the monitors with a chalkboard", "make the background warm instead of cold"). Then build the prompt as Mode 1 base + user's modifications layered on top.

3. **Build the prompt** based on the chosen mode (see Prompt Construction below)
4. **Present the prompt** with rationale (see Prompt Presentation below)
5. **Offer next steps** — refine, generate image, create post, or export

**Without a reference image:**

Ask 2–3 targeted questions to fill the gaps (subject, mood, style, lighting, purpose), then build and present the prompt.

---

### `/recreate` — Quick Recreate Mode

Skip mode selection. Go straight to Mode 1 (Recreate Closely) using the uploaded image or description. Useful when the user says "make something just like this."

---

### `/inspire` — Quick Style Inspiration Mode

Skip mode selection. Go straight to Mode 2 (Style Inspiration). Ask the user what new subject or concept they want to apply the style to.

---

### `/brand` — Quick Brand-Aligned Mode

Skip mode selection. Go straight to Mode 3 (Brand-Aligned Recreation) using saved brand colors. If no brand is saved, run `/setup` first. Ask: "What topic or concept should this new image be about?"

---

### `/generate` — Prompt + Image Generation

Generate the optimized prompt, then immediately pass it to the **nano-banana skill** to create the image, and open the refinement workspace with the prompt pre-loaded.

**Smart prompt detection — check first before doing anything:**

- **If `/prompt` was already run in this session** → reuse that prompt directly. Skip re-prompting entirely. Jump straight to step 2.
- **If no prompt exists yet and a reference image is provided** → ask the user ONE question only — which mode:
  - **1. Recreate closely** — reproduce as faithfully as possible
  - **2. Style inspiration** — capture the aesthetic, apply to new content
  - **3. Brand-aligned recreation** — use saved brand colors + style for new content
  - **4. Recreate with my changes** — closely match but I'll describe my modifications

  If user picks **4**, ask one follow-up: "What changes do you want?" — free-form input accepted. Then build silently and continue. No further questions after that.
- **If no prompt and no image** → ask the user to describe what they want in one sentence, build the prompt silently, then continue to step 2.

Steps:
1. Auto-start the bridge server if not running:
   ```bash
   lsof -ti:3333 > /dev/null 2>&1 || nohup node ~/.claude/skills/image-studio-CC/nano-banana-server.js > /tmp/nb-server.log 2>&1 &
   ```
2. Hand off to nano-banana:
   - Tell the user: "Generating your image now using Nano Banana..."
   - Invoke the nano-banana skill with the prompt
   - Save the generated image to the Desktop folder
   - Present the image to the user
3. Open the refinement workspace with the prompt pre-loaded:
   ```bash
   open ~/.claude/skills/image-studio-CC/nano-banana-playground.html
   ```
   - Display the final prompt clearly so the user can see it in the workspace
   - Tell the user: "Workspace is open — your prompt is ready for annotation and refinement."

If nano-banana is not available, present the prompt and explain how to use it in Google AI Studio.

---

### `/post` — Prompt + LinkedIn/Blog Post

Generate an image prompt AND create a paired LinkedIn post + blog post about the topic.

Steps:
1. Ask: "What's the topic or message this image is for?" (if not already clear)
2. Run `/prompt` (or `/brand` if brand colors are saved) to generate the image prompt
3. Optionally run `/generate` if the user wants the image created too
4. Hand off to **ai-topic-content-creator** skill (or **linkedin-blog-creator** skill) to write:
   - A LinkedIn post about the topic, referencing the visual concept
   - A blog post expanding on the topic with the image described
5. Present both the prompt and the content together

---

### `/carousel` — Multi-Image Series

Generate a set of 3–6 brand-aligned prompts for a carousel post (e.g., LinkedIn or Instagram carousel).

Steps:
1. Ask: "What's the topic or theme for the carousel?"
2. Ask: "How many slides? (3–6 recommended)"
3. For each slide, generate a distinct brand-aligned prompt using the same visual style, colors, and tone — but with different conceptual content that tells a sequential story
4. Present all prompts together, numbered, with a brief note on what each slide communicates
5. Offer to run `/generate` on any or all of them

---

### `/exportPDF` — Export Prompt as PDF Brief

Package the generated prompt + image (if available) + brand settings into a polished PDF brief.

Steps:
1. Collect: the prompt, the rationale notes, and brand settings
2. Hand off to the **pdf skill** to create a one-page brief with:
   - Title: "[Brand Name] — Image Brief"
   - Generated prompt (in a highlighted block)
   - Brand color swatches
   - Key choices / rationale
   - The generated image (if available)
3. Save to Desktop folder and present the file link

---

## Reference Image Analysis

When a reference image is provided, extract these dimensions carefully:

| Dimension | What to extract |
|-----------|----------------|
| **Subject** | Main focal element(s) — person, object, scene |
| **Setting** | Background, environment, spatial context |
| **Color palette** | Dominant + accent colors; warm/cool; saturation |
| **Brand colors** | Logos, brand-consistent colors, design system cues |
| **Lighting** | Direction, quality (hard/soft), color temperature |
| **Mood/Atmosphere** | Emotional register of the image |
| **Visual style** | Photorealistic, illustration, graphic, cinematic, etc. |
| **Composition** | Camera angle, framing, depth of field, negative space |
| **Textures/materials** | Fabric, metal, glass, paper — be specific |
| **Typography** | Font style, weight, placement, any text content |

---

## Style Learning (Run After Every Reference Image Analysis)

After analyzing any reference image, extract the style fingerprint and append it to the style memory file. This builds a portable style profile that can be shared with any AI model.

**Extract these for the style memory:**
- Visual style + medium (e.g., cinematic editorial, flat illustration, hand-drawn)
- Dominant color story (palette, temperature, saturation level)
- Lighting character (soft/hard, direction, mood it creates)
- Composition tendency (centered, rule-of-thirds, symmetrical, negative space)
- Mood + emotional tone (contemplative, energetic, warm, clinical, etc.)
- Storytelling approach (what the image communicates, how it does it)

**Append to style memory file:**

```bash
cat >> ~/.config/image-prompt/style-memory.md << 'EOF'

---
## Reference: [brief image description] — [date]

**Visual Style:** [style/medium]
**Color Story:** [palette description]
**Lighting:** [lighting character]
**Composition:** [composition approach]
**Mood:** [emotional tone]
**Storytelling:** [what this image communicates and how]
**Prompt patterns learned:** [key phrases or constructs that worked well]
EOF
```

**Rules:**
- Always append, never overwrite — the file is a cumulative style journal
- Keep each entry concise (5–7 lines max)
- Over time this file becomes the user's personal visual style guide
- The user can share `~/.config/image-prompt/style-memory.md` with any AI to transfer their style context

---

## Prompt Construction

### Mode 1 — Recreate Closely

```
[Style/medium] of [specific subject with precise details], [exact setting],
[pose/action if applicable], [lighting — direction, quality, color temperature],
[camera angle and composition], [color palette — specific names or hex],
[material and texture details], [mood/atmosphere].
Shot to closely match [brief description of source image feel].
```

### Mode 2 — Style Inspiration

```
[Style/medium reflecting source's visual character] of [new subject],
in [adapted setting], [lighting style extracted from source],
[mood/atmosphere extracted from source], [color palette inspired by source],
[composition approach from source].
Visual style inspired by [brief characterization of source].
```

### Mode 3 — Brand-Aligned Recreation

Use saved brand settings. Always name colors explicitly — never say "brand colors."

```
[Style/medium matching brand visual language] of [new subject/content],
background [brand background color + texture],
using brand accent color [hex] for [key filled elements],
all linework in [brand text color], [brand secondary color] for shadows/details.
[Typography style if text is needed]. [Brand-consistent lighting and mood].
[Composition that fits brand conventions]. [Platform + dimensions].
Maintain brand consistency with [characterization of brand aesthetic].
```

---

## Prompt Presentation

Always present the prompt in this format:

```
PROMPT:
─────────────────────────────────────────────
[The generated prompt]
─────────────────────────────────────────────

KEY CHOICES:
- [Element]: [Why this was included / extracted from reference or brand]

NEXT STEPS:
• /generate — create the image now
• /post — generate a LinkedIn + blog post for this topic
• /carousel — generate a full image series
• Or tell me what to adjust
```

---

## Core Prompting Principles

1. **Natural language over tag soup** — Write as if briefing a human artist, not dumping keywords
2. **Specificity matters** — "weathered oak table," not "wooden surface"
3. **Name colors precisely** — Hex codes or descriptive names; never "brand colors"
4. **Include purpose context** — Helps the model infer quality and composition
5. **Text in images** — Put exact text in quotation marks; specify font style
6. **Edit, don't re-roll** — Specific corrections beat starting over

---

## Skill Integrations

| Skill | Triggered by | What it does |
|-------|-------------|--------------|
| **nano-banana** | `/generate` | Passes the prompt to Nano Banana for image creation |
| **ai-topic-content-creator** | `/post` | Writes LinkedIn post + blog post about the topic |
| **linkedin-blog-creator** | `/post` | Alternative for paired LinkedIn + Substack content |
| **pdf** | `/exportPDF` | Packages prompt + brand brief as a downloadable PDF |

---

## Model Reference

| | **Nano Banana 2** | **Nano Banana Pro** |
|---|---|---|
| **Speed** | Fast | Highest fidelity |
| **Best for** | Social content, rapid iteration | Max detail, print quality |
| **Resolution** | 512px to 4K | Up to high-res |

---

## Sources

- [7 tips for Nano Banana Pro](https://blog.google/products/gemini/prompting-tips-nano-banana-pro/)
- [Nano Banana 2](https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/)
- [Image generation docs](https://ai.google.dev/gemini-api/docs/image-generation)
