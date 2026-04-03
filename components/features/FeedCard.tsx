import NeoWindow from "@/components/ui/NeoWindow";
import { colors } from "@/lib/theme/colors";

type Props = {
  title: string;
  description: string;
  creator: string;
};

export default function FeedCard({ title, description, creator }: Props) {
  return (
    <NeoWindow title={title} variant="maybe" size="md">
      <div className="flex flex-col gap-4">
        <div
          className="flex h-44 items-center justify-center border-[3px] border-[#000000] text-2xl font-black uppercase tracking-[0.1em] shadow-[6px_6px_0px_#000000]"
          style={{
            backgroundColor: colors.white,
            color: colors.black
          }}
        >
          Video
        </div>
        <p className="text-sm font-bold uppercase leading-6 tracking-[0.04em]">
          {description}
        </p>
        <p className="text-xs font-black uppercase tracking-[0.12em]">
          Creator: {creator}
        </p>
      </div>
    </NeoWindow>
  );
}
