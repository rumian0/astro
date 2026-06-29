import { BLOG_PATH } from "@/content.config";
import { slugifyStr } from "./slugify";

export function getPath(
  id: string,
  filePath: string | undefined,
  pubDatetime?: Date
) {
  const blogId = id.split("/");
  const slug = blogId.length > 0 ? blogId.slice(-1)[0]! : id;

  if (pubDatetime) {
    const y = pubDatetime.getFullYear();
    const m = String(pubDatetime.getMonth() + 1).padStart(2, "0");
    const d = String(pubDatetime.getDate()).padStart(2, "0");
    return [String(y), m, d, slugifyStr(slug)].join("/");
  }

  const pathSegments = filePath
    ?.replace(BLOG_PATH, "")
    .split("/")
    .filter(p => p !== "")
    .filter(p => !p.startsWith("_"))
    .slice(0, -1)
    .map(s => slugifyStr(s));

  if (pathSegments && pathSegments.length > 0) {
    // If the last pathSegment matches slug, deduplicate
    if (pathSegments[pathSegments.length - 1] === slugifyStr(slug)) {
      return pathSegments.join("/");
    }
    return [...pathSegments, slugifyStr(slug)].join("/");
  }

  return slugifyStr(slug);
}
