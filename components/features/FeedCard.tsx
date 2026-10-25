import NeoWindow from "@/components/ui/NeoWindow";

type Props = {
  title: string;
  description: string;
  creator: string;
};

export default function FeedCard({ title, description, creator }: Props) {
  return (
    <NeoWindow title={title} variant="maybe" size="md">
      <div className="flex flex-col gap-3">
        <div className="flex aspect-video items-center justify-center rounded-2xl border-2 border-[#20251F] bg-[#214E34]">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#20251F] bg-[#A9D94C] shadow-[2px_2px_0px_#20251F]">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#20251F" strokeWidth="2" strokeLinejoin="round"><path d="M8 5l11 7-11 7z" /></svg>
            <span className="sr-only">Video</span>
          </span>
        </div>
        <p className="text-[15px] font-medium leading-6">
          {description}
        </p>
        <p className="text-sm font-semibold text-[#214E34]">
          Creator: {creator}
        </p>
      </div>
    </NeoWindow>
  );
}
