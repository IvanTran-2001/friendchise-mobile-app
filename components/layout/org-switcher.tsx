import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../src/lib/api/client";
import { SearchableCombobox } from "../ui/searchable-combobox";

type Org = {
  id: string;
  name: string;
};

type OrgResponse = {
  organizations: Org[];
};

type OrgSwitcherProps = {
  currentOrgId?: string | null;
};

async function fetchOrganizations() {
  return apiFetch<OrgResponse>("/api/mobile/me/organizations");
}

export function OrgSwitcher({ currentOrgId }: OrgSwitcherProps) {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ["mobile-orgs"],
    queryFn: fetchOrganizations,
  });

  const organizations = data?.organizations ?? [];
  const currentOrg = organizations.find((org) => org.id === currentOrgId) ?? null;

  if (isLoading || error || organizations.length === 0) {
    return null;
  }

  return (
    <SearchableCombobox
      items={organizations}
      triggerLabel="Organization"
      triggerBadgeLabel={currentOrg?.name?.[0]?.toUpperCase() ?? null}
      triggerValue={currentOrg?.name ?? "Select organization"}
      placeholder="Search organizations…"
      emptyText="No organizations found"
      onSelect={(item) => {
        router.push(`/(app)/orgs/${item.id}`);
      }}
    />
  );
}