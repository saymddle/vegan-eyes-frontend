import { NeoWindow } from "@/components/NeoWindow";
import { ScanList } from "@/components/ScanList";
import { Screen } from "@/components/Screen";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Text } from "@/components/Text";
import { getScans, type SavedScan } from "@/lib/data";
import { useAccountData } from "@/lib/useAccountData";

export default function RecentScreen() {
  const { data: records, isLoading, signedOut } = useAccountData<SavedScan[]>(getScans, []);
  return (
    <Screen crumbs={[{ label: "LIBRARY", path: "/library" }, { label: "RECENT" }]}>
      <NeoWindow title="Recent" variant="vegan" size="lg">
        <Text variant="display" style={{ fontSize: 36, lineHeight: 40 }}>Latest saved scans.</Text>
      </NeoWindow>
      {signedOut ? (
        <SignInPrompt body="Sign in to see your saved scans." />
      ) : isLoading ? (
        <NeoWindow title="Loading" variant="maybe" size="sm">
          <Text variant="semibold" style={{ fontSize: 14 }}>Loading recent scans...</Text>
        </NeoWindow>
      ) : records.length === 0 ? (
        <NeoWindow title="No saved scans yet" variant="maybe" size="sm">
          <Text variant="semibold" style={{ fontSize: 14 }}>Save a result to build your library.</Text>
        </NeoWindow>
      ) : (
        <ScanList records={records} />
      )}
    </Screen>
  );
}
