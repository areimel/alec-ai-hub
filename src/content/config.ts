// 1. Import utilities from `astro:content`
import { z, defineCollection } from 'astro:content';

// 2. Define your collection(s)
const promptsCollection = defineCollection({
  schema: z.object({
    draft: z.boolean(),
    title: z.string(),
    description: z.string(),
    usage_instructions: z.string(),
    category: z.enum([
      'Coding',
      'Writing',
      'Analysis',
      'Creative',
      'Business',
      'Marketing',
      'Other'
    ]),
    sub_category: z.enum([
      'Cursor',
      'ChatGPT',
      'Claude',
      'Gemini',
      'MidJourney',
      'Other'
    ]),
    template: z.boolean().default(false).optional(), // Optional template field with default value false
    tags: z.array(z.string()),
    version: z.string().default('1.0'),
    author: z.string().default('Anonymous'),
    publishDate: z.string().transform(str => new Date(str)),
    lastUpdated: z.string().transform(str => new Date(str)),
    featured: z.boolean().default(false),
  }),
});

const agentsCollection = defineCollection({
  schema: z.object({
    draft: z.boolean(),
    title: z.string(),
    description: z.string(),
    usage_instructions: z.string(),
    category: z.enum(['Code', 'Research', 'Writing', 'Operations']),
    sub_category: z.enum(['Read-only', 'Can edit']),
    tags: z.array(z.string()),
    version: z.string().default('1.0'),
    author: z.string().default('Anonymous'),
    publishDate: z.string().transform(str => new Date(str)),
    lastUpdated: z.string().transform(str => new Date(str)),
    featured: z.boolean().default(false),
  }),
});

const skillsCollection = defineCollection({
  schema: z.object({
    draft: z.boolean(),
    title: z.string(),
    description: z.string(),
    usage_instructions: z.string(),
    category: z.enum(['Code', 'Writing', 'Docs', 'Workflow']),
    sub_category: z.enum(['Skill', 'Plugin']),
    tags: z.array(z.string()),
    version: z.string().default('1.0'),
    author: z.string().default('Anonymous'),
    publishDate: z.string().transform(str => new Date(str)),
    lastUpdated: z.string().transform(str => new Date(str)),
    featured: z.boolean().default(false),
  }),
});

// 3. Export a single `collections` object to register your collection(s)
//    This key should match your collection directory name in "src/content"
export const collections = {
  'prompts': promptsCollection,
  'agents': agentsCollection,
  'skills': skillsCollection,
};