import { StyleSheet, TextInput, View } from "react-native";

type TaskNavbarActionsProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export function TaskNavbarActions({ search, onSearchChange }: TaskNavbarActionsProps) {
  return (
    <View style={styles.shell}>
      <TextInput
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search tasks"
        placeholderTextColor="#64748B"
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(148, 163, 184, 0.18)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: "center",
  },
  input: {
    color: "#0F172A",
    fontSize: 13,
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    minHeight: 38,
  },
});