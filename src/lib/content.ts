import { getCollection } from "astro:content";

type PublishedCollection = "prompts" | "agents" | "skills";

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
