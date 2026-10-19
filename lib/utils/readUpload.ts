// Turns a file the user picked into something /api/scan can read.
// Photos are shrunk first: phone photos are often 5 MB or more, and the
// server only accepts about 4 MB per request.

export type Upload =
  | { kind: "image"; dataUrl: string }
  | { kind: "pdf"; dataUrl: string; name: string };

const MAX_SIDE = 2000;
const MAX_PDF_BYTES = 3 * 1024 * 1024;

function readAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function shrinkImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function readUpload(file: File): Promise<Upload> {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    if (file.size > MAX_PDF_BYTES) {
      throw new Error(
        "That PDF is too big. Try one under 3 MB, or a photo of the page."
      );
    }
    return { kind: "pdf", dataUrl: await readAsDataUrl(file), name: file.name };
  }
  if (file.type.startsWith("image/")) {
    try {
      return { kind: "image", dataUrl: await shrinkImage(file) };
    } catch {
      throw new Error("Couldn't open that photo. Try a JPG or PNG.");
    }
  }
  throw new Error("Pick a photo or a PDF.");
}
