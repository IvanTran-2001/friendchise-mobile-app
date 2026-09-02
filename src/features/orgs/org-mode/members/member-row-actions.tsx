import { useState } from "react";
import { Alert } from "react-native";
import { MoreVertical } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconButton } from "../../../../../components/ui/icon-button";
import { colors } from "../../../../lib/theme";
import { deleteOrgMember, type OrgMember, type OrgRole } from "../shared/organization-api";
import { MemberEditSheet } from "./member-edit-sheet";

type MemberRowActionsProps = {
  orgId: string;
  member: OrgMember;
  allRoles: OrgRole[];
};

export function MemberRowActions({ orgId, member, allRoles }: MemberRowActionsProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const displayName = member.user?.name ?? member.botName ?? "Member";

  const deleteMutation = useMutation({
    mutationFn: () => deleteOrgMember(orgId, member.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mobile-org-members"] });
      setOpen(false);
    },
    onError: (error) => {
      Alert.alert("Could not delete member", error instanceof Error ? error.message : "Please try again.");
    },
  });

  const handleDelete = () => {
    Alert.alert("Delete member?", `Remove ${displayName} from this organization?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() },
    ]);
  };

  const openActions = () => {
    Alert.alert("Member actions", `Choose what to do with ${displayName}.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: handleDelete,
      },
      {
        text: "Edit",
        onPress: () => setOpen(true),
      },
    ]);
  };

  return (
    <>
      <IconButton accessibilityLabel={`Open actions for ${displayName}`} onPress={openActions} size="sm" variant="muted">
        <MoreVertical size={18} strokeWidth={2.3} color={colors.textSecondary} />
      </IconButton>

      <MemberEditSheet
        orgId={orgId}
        member={member}
        allRoles={allRoles}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}