import { Screen } from "../../../../../../components/ui/screen";
import { ScreenHeader } from "../../../../../../components/ui/screen-header";
import { Card } from "../../../../../../components/ui/card";
import { Text } from "../../../../../../components/ui/text";

export default function ScanToTaskScreen() {
  return (
    <Screen scroll>
      <ScreenHeader
        kicker="Tool"
        title="Scan to Task"
        subtitle="Turn scans into task drafts and refine them here."
      />

      <Card padding="lg">
        <Text variant="body" tone="secondary">
          Scan to Task is not available yet. We’ll add the workflow here once it’s ready.
        </Text>
      </Card>
    </Screen>
  );
}