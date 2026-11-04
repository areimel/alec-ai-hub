# AI Hub

Alec Reimel's public collection of AI prompts, custom agents and skills, free to copy, at https://ai-hub.alecreimel.com. It's a static Astro site styled with the Kojima theme: charcoal and ivory, safety orange, instrument plates and monospaced labels.

## Features

*   **Prompt directory**: search and filter by category, AI tool and tag, and copy a prompt from its card or page
*   **Fill-in templates**: prompts with `@name` blanks generate fields, and the prompt text updates as you type
*   **Custom agents**: Claude Code subagent files, with the same directory and detail pages as prompts
*   **Skills & plugins**: Claude Code skill files and a plugin, with the same directory and detail pages
*   **Contact and prompt submission forms**: sent through Web3Forms
*   **Dark and light themes**: dark by default, with the visitor's choice saved

## Technical Stack

*   **Framework**: [Astro 5](https://astro.build/), static output
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) through the Vite plugin, with the Kojima theme in `src/styles/kojima.css`
*   **Components**: Astro, plus React and shadcn/ui parts. Only the navbar and FAQ run React in the browser
*   **Content**: [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) with schemas in `src/content/config.ts`
*   **Icons and type**: `lucide-react`, self-hosted DM Sans
*   **Tests**: Playwright and axe

## Getting Started

### Prerequisites

*   Node.js 20+
*   pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/areimel/alec-ai-hub.git
    cd alec-ai-hub
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Start development server:**
    ```bash
    pnpm dev
    ```

Visit `http://localhost:4321` to view your site.

## Available Commands

*   **`pnpm dev`**: Start development server at `localhost:4321`
*   **`pnpm build`**: Build production site to `./dist/`
*   **`pnpm preview`**: Preview production build locally
*   **`pnpm test:e2e`**: Build the site and run the browser tests (first run `pnpm exec playwright install chromium`)
*   **`pnpm img-compress`**: Optimize images in public folder

## Project Structure

```
/
├── public/                   # Static assets, fonts, favicon, robots.txt
├── scripts/                  # render-og.mjs regenerates the social image
├── src/
│   ├── components/
│   │   ├── blocks/           # Navbar and footer
│   │   ├── FormComponents/   # Forms and the shared form field
│   │   ├── kojima/           # Instrument plates, plate links, slug barcode
│   │   ├── LandingComponents/ # Homepage and DIY page sections
│   │   ├── PromptComponents/ # Directory and detail pages for prompts, agents and skills
│   │   └── ui/               # Shared UI parts
│   ├── content/              # Content collections: prompts/, agents/, skills/ and config.ts (schemas)
│   ├── data/                 # Branding, page copy and announcements (JSON)
│   ├── layouts/
│   ├── lib/                  # Content helpers and utilities
│   ├── pages/                # Site routes: /, /prompts, /custom-agents, /skills-plugins, /diy-prompt-library
│   ├── scripts/              # Browser scripts: filters, copy, templates, forms
│   └── styles/               # Theme, plus site styles in hub.css and hub/
├── tests/                    # Playwright tests
└── astro.config.mjs
```

## Content Management

### Adding New Prompts

1. Create a new `.mdx` or `.md` file in `src/content/prompts/`
2. Use the defined schema with required frontmatter:
   ```yaml
   ---
   draft: false
   title: "Your Prompt Title"
   description: "Brief description"
   usage_instructions: "How to use this prompt"
   category: "Coding" # Coding, Writing, Analysis, Creative, Business, Marketing, Other
   sub_category: "ChatGPT" # ChatGPT, Claude, Gemini, Cursor, MidJourney, Other
   tags: ["javascript", "debugging"]
   author: "Your Name"
   publishDate: "2025-01-15"
   lastUpdated: "2025-01-15"
   featured: false
   ---
   ```

### Adding Custom Agents and Skills

Custom agents and skills are Claude Code files. The body of each entry is the file a visitor saves into their project, so write it in Claude Code's format.

1. Create a new `.md` file in `src/content/agents/` for a subagent file, or in `src/content/skills/` for a skill or plugin entry
2. Copy the frontmatter from an existing entry in the same folder and follow its schema:
   *   Agents: `category` is Code, Research, Writing or Operations, and `sub_category` is Read-only, Runs commands or Can edit
   *   Skills: `category` is Code, Writing, Docs or Workflow, and `sub_category` is Skill or Plugin
3. Use `.md`, not `.mdx`, when the body contains `<` or `{`. MDX reads those characters as JSX, which can break the build

### Configuration

*   **Branding**: Edit `src/data/branding.json` for the site name, wordmark, SEO text and navigation
*   **Homepage**: Modify `src/data/homeContent.json` for landing page content
*   **Announcements**: Update `src/data/announcements.json` for site-wide notifications

## Deployment

The site is a static Astro build deployed to GitHub Pages at https://ai-hub.alecreimel.com. Every push to `main` runs `.github/workflows/deploy.yml`, which builds and publishes the site. The custom domain is set in the repository's Pages settings, so there is no `public/CNAME` file.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

The project is under the MIT license, see `LICENSE`. The Kojima theme code is under MIT + Commons Clause, see `src/components/kojima/LICENSE`: you can use it in your own site, but not resell the template as is.

## Support

Report bugs or request features through [GitHub Issues](https://github.com/areimel/alec-ai-hub/issues).

## Credits

The visual design is based on the Kojima theme ([areimel/kojima-astro-template](https://github.com/areimel/kojima-astro-template)), built on blocks from shadcnblocks.com by Rob Austin. The copied theme code is used under its MIT + Commons Clause license, see `src/components/kojima/LICENSE`.

---

Built by [Alec Reimel](https://alecreimel.com)
