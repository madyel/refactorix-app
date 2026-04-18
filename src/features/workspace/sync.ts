import type { CompareReview } from "./model";

const buildLineDiff = (localContent: string, remoteContent: string): string => {
  const left = localContent.split("\n");
  const right = remoteContent.split("\n");
  const max = Math.max(left.length, right.length);
  const rows: string[] = [];

  for (let i = 0; i < max; i += 1) {
    const l = left[i] ?? "";
    const r = right[i] ?? "";

    if (l === r) {
      rows.push(`  ${l}`);
      continue;
    }

    if (l) rows.push(`- ${l}`);
    if (r) rows.push(`+ ${r}`);
  }

  return rows.join("\n");
};

export const createCompareReview = (params: {
  localPath: string;
  remotePath: string;
  filePath: string;
  localContent: string;
  remoteContent: string;
}): CompareReview => {
  const hasChanges = params.localContent !== params.remoteContent;
  const diffPreview = buildLineDiff(params.localContent, params.remoteContent);

  return {
    ...params,
    hasChanges,
    diffPreview,
    summary: hasChanges
      ? "Sono state rilevate differenze tra locale e remoto."
      : "Locale e remoto sono allineati per questo file.",
  };
};
