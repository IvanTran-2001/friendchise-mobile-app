import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Menu } from "lucide-react-native";
import { IconButton } from "../../../../../components/ui/icon-button";
import { colors } from "../../../../lib/theme";
import { MembersActionSheet } from "./members-action-sheet";

type MembersNavbarActionsProps = {
  orgId: string;
};

export function MembersNavbarActions({ orgId }: MembersNavbarActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <View style={styles.shell}>
        <IconButton accessibilityLabel="Open member actions" onPress={() => setOpen(true)}>
          <Menu size={18} strokeWidth={2.4} color={colors.textPrimary} />
        </IconButton>
      </View>

      <MembersActionSheet visible={open} onClose={() => setOpen(false)} orgId={orgId} />
    </>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});