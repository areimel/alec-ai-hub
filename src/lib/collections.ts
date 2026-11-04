/** Per-collection copy and routing for the directory components (cards, filters, dossier). */
export type DirectoryCollection = "prompts" | "agents" | "skills";

export interface DirectoryConfig {
  /** URL segment the collection is served from, without slashes. */
  base: string;
  /** Plural noun used in counts, e.g. "Showing 3 of 5 prompts". */
  noun: string;
  viewLabel: string;
  copyLabel: string;
  /** Singular sub-category label for cards and the dossier. */
  subCategoryLabel: string;
  /** Plural sub-category heading for the filter rail. */
  subCategoryHeading: string;
  allSubCategoriesLabel: string;
  searchPlaceholder: string;
  /** Heading above the raw text on the detail page. */
  textHeading: string;
  backLabel: string;
  backHref: string;
  listLabel: string;
}

export const directoryCollections: Record<DirectoryCollection, DirectoryConfig> = {
  prompts: {
    base: "prompts",
    noun: "prompts",
    viewLabel: "View prompt",
    copyLabel: "Copy prompt",
    subCategoryLabel: "AI tool",
    subCategoryHeading: "AI tools",
    allSubCategoriesLabel: "All tools",
    searchPlaceholder: "Search prompts",
    textHeading: "Prompt text",
    backLabel: "All prompts",
    backHref: "/prompts",
    listLabel: "Prompt list",
  },
  agents: {
    base: "custom-agents",
    noun: "agents",
    viewLabel: "View agent",
    copyLabel: "Copy agent",
    subCategoryLabel: "Access",
    subCategoryHeading: "Access",
    allSubCategoriesLabel: "All access levels",
    searchPlaceholder: "Search agents",
    textHeading: "Agent file",
    backLabel: "All agents",
    backHref: "/custom-agents",
    listLabel: "Agent list",
  },
  skills: {
    base: "skills-plugins",
    noun: "skills and plugins",
    viewLabel: "View entry",
    copyLabel: "Copy entry",
    subCategoryLabel: "Type",
    subCategoryHeading: "Types",
    allSubCategoriesLabel: "All types",
    searchPlaceholder: "Search skills and plugins",
    textHeading: "File contents",
    backLabel: "All skills and plugins",
    backHref: "/skills-plugins",
    listLabel: "Skills and plugins list",
  },
};
