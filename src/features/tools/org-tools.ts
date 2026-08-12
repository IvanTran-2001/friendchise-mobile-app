import { useMemo } from "react";
import { ScanLine, type LucideIcon } from "lucide-react-native";

export type ToolItem = {
  id: string;
  title: string;
  subtitle: string;
  keywords: string[];
  icon: LucideIcon;
  href: string;
};

export function getOrgTools(orgId?: string): ToolItem[] {
  return orgId
    ? [
        {
          id: "scan-to-task",
          title: "Scan to Task",
          subtitle: "Convert PDF or PNG scans into tasks.",
          keywords: ["scan", "task", "pdf", "png", "image"],
          icon: ScanLine,
          href: `/(app)/orgs/${orgId}/tools/scan-to-task`,
        },
      ]
    : [];
}

export function filterOrgTools(tools: ToolItem[], search: string) {
  const query = search.trim().toLowerCase();

  if (!query) {
    return tools;
  }

  return tools.filter((tool) => {
    const searchableText = [tool.title, tool.subtitle, ...tool.keywords].join(" ").toLowerCase();
    return searchableText.includes(query);
  });
}

export function useOrgTools(orgId?: string, search = "") {
  return useMemo(() => {
    const tools = getOrgTools(orgId);
    return {
      tools,
      filteredTools: filterOrgTools(tools, search),
    };
  }, [orgId, search]);
}