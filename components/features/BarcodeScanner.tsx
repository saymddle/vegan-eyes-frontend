"use client";

import { useEffect, useRef, useState } from "react";
import { isBarcode } from "@/lib/products/openFoodFacts";
import { colors } from "@/lib/theme/colors";

type Props = {
  onDetected: (barcode: string) => void;
  onCancel: () => void;
  busy?: boolean;
};

// Reads a product barcode from the back camera. Typing the number works
// too, for when the camera can't focus or isn't allowed.
export default function BarcodeScanner({ onDetected, onCancel, busy }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectedRef = useRef(onDetected);
  detectedRef.current = onDetected;
  const [cameraError, setCameraError] = useState("");
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let stopped = false;
    let stop: (() => void) | undefined;

    async function start() {
      // Loaded only when needed, so the Scan page stays light.
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] =
        await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
      if (stopped || !videoRef.current) return;

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E
      ]);
      const reader = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 150
      });

      try {
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result, _error, scanControls) => {
            if (!result || stopped) return;
            stopped = true;
            scanControls.stop();
            detectedRef.current(result.getText());
          }
        );
        stop = () => controls.stop();
        if (stopped) stop();
      } catch {
        if (!stopped) {
          setCameraError(
            "Couldn't open the camera. Type the number under the barcode instead."
          );
        }
      }
    }

    void start();
    return () => {
      stopped = true;
      stop?.();
    };
  }, []);

  const digits = typed.replace(/\D/g, "");

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {cameraError ? (
        <p className="text-sm font-semibold">
          {cameraError}
        </p>
      ) : (
        <div className="relative w-full">
          <video
            ref={videoRef}
            muted
            playsInline
            className="h-[220px] w-full rounded border-2 border-[#20251F] bg-black object-cover"
          />
          {/* A guide box: lines the barcode up in the middle of the frame. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[90px] w-[75%] -translate-x-1/2 -translate-y-1/2 border-2 border-dashed rounded-xl"
            style={{ borderColor: colors.secondary }}
          />
          <p className="mt-2 text-xs font-semibold">
            {busy
              ? "Looking it up..."
              : "Point at the barcode on the pack, or type its number below"}
          </p>
        </div>
      )}

      <form
        className="flex w-full flex-col gap-3 min-[400px]:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (isBarcode(digits)) onDetected(digits);
        }}
      >
        <label className="sr-only" htmlFor="barcode-number">
          Barcode number
        </label>
        <input
          id="barcode-number"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Barcode number"
          className="min-h-[44px] w-full min-w-0 flex-1 rounded-xl border-2 border-[#20251F] bg-white px-3 text-base font-bold outline-none placeholder:text-[#5B6158]/75 rounded-xl"
        />
        <button
          type="submit"
          disabled={!isBarcode(digits) || busy}
          className="min-h-[44px] border-2 border-[#20251F] px-4 text-xs font-bold shadow-[4px_4px_0px_#20251F] disabled:opacity-50 rounded-xl"
          style={{ backgroundColor: colors.secondary, color: colors.black }}
        >
          Look up
        </button>
      </form>

      <button
        type="button"
        onClick={onCancel}
        className="min-h-[44px] px-2 text-sm font-bold underline underline-offset-4"
      >
        Back to camera
      </button>
    </div>
  );
}
