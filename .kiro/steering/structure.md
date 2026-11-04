# Project Structure & Organization

## Root Directory Structure
```
/
├── public/              # Static assets (images, favicon, robots.txt)
├── src/                 # Source code
├── .astro/              # Astro build cache and generated files
├── .kiro/               # Kiro AI assistant configuration
├── dist/                # Production build output
├── node_modules/        # Dependencies
├── astro.config.mjs     # Astro configuration (includes redirects for retired URLs)
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies and scripts
```

## Source Directory (`src/`)
```
src/
├── components/          # Reusable UI components (.astro and .tsx files)
│   ├── blocks/              # Navbar and footer
│   ├── FormComponents/      # Contact and prompt submission forms
│   ├── kojima/              # Instrument plates, plate links, slug barcode
│   ├── LandingComponents/   # Homepage and DIY page sections
│   ├── PromptComponents/    # Directory and detail pages for prompts, agents and skills
│   └── ui/                  # Generic UI components
├── content/             # Content collections (Markdown/MDX)
│   ├── prompts/        # AI prompt library (.mdx or .md)
│   ├── agents/         # Claude Code custom agents (.md)
│   ├── skills/         # Claude Code skills and plugins (.md)
│   └── config.ts       # Content schema definitions
├── data/               # Static JSON data files (branding, homepage and DIY page copy)
├── layouts/            # Page layout templates
├── lib/                # Content helpers (getPublished, getCounts) and collection config
├── pages/              # Site pages
│   ├── prompts/        # Prompt directory and detail pages
│   ├── custom-agents/  # Custom agents directory and detail pages
│   ├── skills-plugins/ # Skills and plugins directory and detail pages
│   └── index.astro     # Homepage
├── utils/              # Utility functions
└── assets/             # Images and other assets, including the OG image source SVG
```

## Path Aliases (TypeScript)
- `@lib/*` → `src/lib/*`
- `@utils/*` → `src/utils/*`
- `@components/*` → `src/components/*`
- `@layouts/*` → `src/layouts/*`
- `@assets/*` → `src/assets/*`
- `@pages/*` → `src/pages/*`
- `@data/*` → `src/data/*`

## Content Collections Schema
- **Prompts**: Title, description, usage instructions, category, sub_category, template flag, tags, version, author, dates, featured flag
- **Agents**: Title, description, usage instructions, category (Code, Research, Writing, Operations), sub_category (Read-only, Can edit), tags, version, author, dates, featured flag
- **Skills**: Title, description, usage instructions, category (Code, Writing, Docs, Workflow), sub_category (Skill, Plugin), tags, version, author, dates, featured flag

## File Naming Conventions
- Components: PascalCase for Astro components (e.g., `ThemeToggle.astro`)
- Pages: kebab-case for routes (e.g., `diy-prompt-library.astro`)
- Content: kebab-case for markdown files (e.g., `generate-react-component.mdx`)
- Utilities: camelCase for JavaScript files (e.g., `all.js`)

## Component Organization
- Generic UI components in `src/components/ui/`
- Feature-specific components in dedicated folders
- Layout components in `src/layouts/`
- Page components directly in `src/pages/`