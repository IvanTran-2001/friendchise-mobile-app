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
          This tool route is ready for the scan-to-task workflow.
        </Text>
      </Card>
    </Screen>
  );
}