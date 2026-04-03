import NeoWindow from "@/components/ui/NeoWindow";
import NeoButton from "@/components/ui/NeoButton";
import {
  deriveRecipeTitle,
  type SavedScan
} from "@/lib/store/savedScans";

type Props = {
  scan: SavedScan;
};

export default function RecipeCard({ scan }: Props) {
  return (
    <NeoWindow
      title={deriveRecipeTitle(scan.input)}
      variant={scan.result.status}
      size="sm"
    >
      <div className="flex flex-col gap-3">
        <p className="line-clamp-3 text-sm font-bold uppercase leading-6 tracking-[0.04em]">
          {scan.input}
        </p>
        <div className="flex items-center justify-between gap-4 text-xs font-black uppercase tracking-[0.12em]">
          <p>{new Date(scan.timestamp).toLocaleDateString()}</p>
          <p>{scan.result.status.replace("_", " ")}</p>
        </div>
        <NeoButton href={`/library/recipes/${scan.id}`} tone="base">
          Open Recipe
        </NeoButton>
      </div>
    </NeoWindow>
  );
}
