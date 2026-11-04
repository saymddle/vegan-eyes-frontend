import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

// Turns a photo or PDF into the data URL /api/scan reads. Photos are
// shrunk first: the server only accepts about 4 MB per request.

const MAX_SIDE = 2000;
const MAX_PDF_BYTES = 3 * 1024 * 1024;

export async function photoDataUrl(uri: string, width: number, height: number) {
  const context = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > MAX_SIDE) {
    context.resize(width >= height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ base64: true, compress: 0.85, format: SaveFormat.JPEG });
  if (!saved.base64) throw new Error("Couldn't open that photo. Try a JPG or PNG.");
  return `data:image/jpeg;base64,${saved.base64}`;
}

export async function pdfDataUrl(uri: string, size?: number) {
  const file = new File(uri);
  if ((size ?? file.size ?? 0) > MAX_PDF_BYTES) {
    throw new Error("That PDF is too big. Try one under 3 MB, or a photo of the page.");
  }
  return `data:application/pdf;base64,${await file.base64()}`;
}
