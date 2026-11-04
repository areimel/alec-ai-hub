import { getCollection } from "astro:content";

type PublishedCollection = "prompts" | "agents" | "blog";

/** Published entries (not draft, publishDate in the past), newest first. */
export async function getPublished<C extends PublishedCollection>(collection: C) {
  const now = new Date();
  const entries = await getCollection(collection, ({ data }) => {
    return !data.draft && data.publishDate < now;
  });
  return entries.sort(
    (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf(),
  );
}

/** Published entry counts per collection. */
export async function getCounts() {
  const [prompts, agents, blog] = await Promise.all([
    getPublished("prompts"),
    getPublished("agents"),
    getPublished("blog"),
  ]);
  return { prompts: prompts.length, agents: agents.length, blog: blog.length };
}
