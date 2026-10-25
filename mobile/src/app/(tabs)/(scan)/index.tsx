import { CameraView, useCameraPermissions } from "expo-camera";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useIsFocused, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { isBarcode } from "@shared/products/openFoodFacts";
import { AppHeader } from "@/components/AppHeader";
import { HelpCard } from "@/components/HelpCard";
import {
  BarcodeIcon,
  CameraIcon,
  DocumentIcon,
  RetakeIcon,
  UploadIcon
} from "@/components/Icons";
import { NeoButton } from "@/components/NeoButton";
import { NeoSwitch } from "@/components/NeoSwitch";
import { NeoWindow } from "@/components/NeoWindow";
import { Text } from "@/components/Text";
import { lookupBarcode, scanText } from "@/lib/api";
import { storeProductScan, storeScanInput } from "@/lib/scanStore";
import { pdfDataUrl, photoDataUrl } from "@/lib/upload";
import { colors, fonts, radius } from "@/theme";

// The scan heading alternates between these, 5 seconds each.
const messages = ["SCAN AN INGREDIENT", "CONVERT A RECIPE"];

export default function ScanScreen() {
  const router = useRouter();
  const focused = useIsFocused();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<"scan" | "type">("scan");
  const [typed, setTyped] = useState("");
  const [image, setImage] = useState<string | null>(null);
  // A recipe PDF picked with Upload; photos go in `image`.
  const [pdf, setPdf] = useState<{ name: string; dataUrl: string } | null>(null);
  const [fromUpload, setFromUpload] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [barcodeTyped, setBarcodeTyped] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const lookupBusy = useRef(false);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  // Rotating heading with a short fade between messages.
  const [index, setIndex] = useState(0);
  const opacity = useSharedValue(1);
  const headingStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      opacity.value = withTiming(0, { duration: 200 });
      timeout = setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length);
        opacity.value = withTiming(1, { duration: 200 });
      }, 200);
    }, 5000);
    return () => {
      clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [opacity]);

  function clearPicture() {
    setImage(null);
    setPdf(null);
    setFromUpload(false);
  }

  async function handleCapture() {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1, skipProcessing: false });
      if (!photo) return;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScanError("");
      setImage(await photoDataUrl(photo.uri, photo.width, photo.height));
      setPdf(null);
      setFromUpload(false);
    } catch {
      setScanError("Couldn't take the photo. Try again.");
    }
  }

  async function pickPhoto() {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    try {
      setImage(await photoDataUrl(asset.uri, asset.width, asset.height));
      setPdf(null);
      setFromUpload(true);
      setScanError("");
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Couldn't open that file.");
    }
  }

  async function pickPdf() {
    const picked = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    try {
      setPdf({ name: asset.name, dataUrl: await pdfDataUrl(asset.uri, asset.size) });
      setImage(null);
      setFromUpload(true);
      setScanError("");
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Couldn't open that file.");
    }
  }

  // The website's Upload took a photo or a PDF from one picker. A phone
  // keeps those in different places, so it asks which.
  function handleUpload() {
    Alert.alert("Upload a recipe", undefined, [
      { text: "Photo", onPress: () => void pickPhoto() },
      { text: "PDF", onPress: () => void pickPdf() },
      { text: "Cancel", style: "cancel" }
    ]);
  }

  async function handleBarcode(barcode: string) {
    if (lookupBusy.current) return;
    lookupBusy.current = true;
    setLookingUp(true);
    setScanError("");
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { status, ok, product } = await lookupBarcode(barcode);
      if (status === 404 || (ok && !product)) {
        setScanError("We don't know this barcode yet. Snap the ingredient list on the back instead.");
      } else if (!ok || !product) {
        setScanError("Couldn't look up that barcode. Check your connection and try again.");
      } else if (!product.ingredients) {
        setScanError(
          `Found ${product.name || "this product"}, but it has no ingredient list yet. Snap the ingredient list on the back instead.`
        );
      } else {
        storeProductScan(product);
        setBarcodeOpen(false);
        router.push("/results");
        return;
      }
      setBarcodeOpen(false);
    } catch {
      setScanError("Couldn't look up that barcode. Check your connection and try again.");
      setBarcodeOpen(false);
    } finally {
      lookupBusy.current = false;
      setLookingUp(false);
    }
  }

  async function handleScan(payload: { imageBase64: string } | { pdfBase64: string }) {
    setLoading(true);
    setScanError("");
    try {
      const { ok, raw } = await scanText(payload);
      if (!ok || !raw.trim()) {
        setScanError(
          "pdfBase64" in payload
            ? "Couldn't read any text in that PDF."
            : "Couldn't read any text. Try a closer, brighter photo."
        );
        return;
      }
      storeScanInput(raw, "photo");
      router.push("/results");
    } catch {
      setScanError("Scan failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (mode === "type") {
      if (!typed.trim()) return;
      storeScanInput(typed.trim(), "paste");
      router.push("/results");
      return;
    }
    if (pdf) return handleScan({ pdfBase64: pdf.dataUrl });
    if (image) return handleScan({ imageBase64: image });
  }

  const hasPicture = Boolean(image || pdf);
  const cameraOn = focused && mode === "scan" && !hasPicture && permission?.granted;

  function cameraArea() {
    if (pdf) {
      return (
        <View style={styles.pdf}>
          <DocumentIcon size={48} />
          <Text variant="bold" style={{ fontSize: 14, textAlign: "center" }}>{pdf.name}</Text>
        </View>
      );
    }
    if (image) {
      return <Image source={{ uri: image }} style={styles.preview} contentFit="cover" accessibilityLabel="Your recipe photo" />;
    }
    if (!permission) return <View style={styles.preview} />;
    if (!permission.granted) {
      return (
        <View style={[styles.preview, styles.permission]}>
          <Text variant="bold" style={{ textAlign: "center" }}>
            Vegan Eyes needs the camera to read recipes and barcodes.
          </Text>
          <NeoButton tone="secondary" size="sm" onPress={() => void requestPermission()}>
            Allow camera
          </NeoButton>
        </View>
      );
    }
    return (
      <View style={styles.preview}>
        {cameraOn ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={barcodeOpen ? { barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] } : undefined}
            onBarcodeScanned={
              barcodeOpen && !lookingUp
                ? ({ data }) => {
                    if (isBarcode(data)) void handleBarcode(data);
                  }
                : undefined
            }
          />
        ) : null}
        {barcodeOpen ? <View pointerEvents="none" style={styles.guide} /> : null}
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          <AppHeader />
          <View style={styles.page}>
            <View style={styles.helpWrap}>
              <Pressable
                onPress={() => setShowHelp((open) => !open)}
                accessibilityRole="button"
                accessibilityLabel="How Vegan Eyes works"
                accessibilityState={{ expanded: showHelp }}
                hitSlop={8}
                style={[styles.help, showHelp && { backgroundColor: colors.ink }]}
              >
                <Text variant="bold" style={{ color: showHelp ? colors.white : colors.ink }}>?</Text>
              </Pressable>
            </View>
            {showHelp ? <HelpCard onClose={() => setShowHelp(false)} /> : null}

            <View style={styles.headRow}>
              <View style={styles.headingBox}>
                <Animated.Text style={[styles.heading, headingStyle]}>{messages[index]}</Animated.Text>
              </View>
              <NeoSwitch value={mode} onChange={setMode} />
            </View>

            <View style={styles.inputBox}>
              {mode === "scan" ? (
                <View style={{ gap: 16, alignItems: "center" }}>
                  {cameraArea()}
                  {barcodeOpen ? (
                    <View style={{ width: "100%", gap: 12, alignItems: "center" }}>
                      <Text variant="small">
                        {lookingUp ? "Looking it up..." : "Point at the barcode on the pack, or type its number below"}
                      </Text>
                      <View style={styles.barcodeRow}>
                        <TextInput
                          value={barcodeTyped}
                          onChangeText={setBarcodeTyped}
                          keyboardType="number-pad"
                          placeholder="Barcode number"
                          placeholderTextColor={colors.muted}
                          accessibilityLabel="Barcode number"
                          style={styles.barcodeInput}
                        />
                        <NeoButton
                          tone="secondary"
                          size="sm"
                          disabled={!isBarcode(barcodeTyped.replace(/\D/g, "")) || lookingUp}
                          onPress={() => void handleBarcode(barcodeTyped.replace(/\D/g, ""))}
                        >
                          Look up
                        </NeoButton>
                      </View>
                      <Pressable onPress={() => setBarcodeOpen(false)} style={styles.link} accessibilityRole="button">
                        <Text variant="bold" style={{ fontSize: 14, textDecorationLine: "underline" }}>Back to camera</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.sources} accessibilityLabel="Picture source">
                      <SourceButton
                        label={hasPicture ? "Retake" : "Photo"}
                        accessibilityLabel={hasPicture ? "Retake" : "Take a photo"}
                        active={!fromUpload}
                        onPress={hasPicture ? clearPicture : () => void handleCapture()}
                        Icon={hasPicture ? RetakeIcon : CameraIcon}
                      />
                      <SourceButton
                        label="Upload"
                        accessibilityLabel="Upload a photo or PDF"
                        active={fromUpload}
                        onPress={handleUpload}
                        Icon={UploadIcon}
                      />
                      <SourceButton
                        label="Barcode"
                        accessibilityLabel="Scan a barcode"
                        active={false}
                        onPress={() => {
                          clearPicture();
                          setScanError("");
                          setBarcodeOpen(true);
                        }}
                        Icon={BarcodeIcon}
                      />
                    </View>
                  )}
                </View>
              ) : (
                <TextInput
                  value={typed}
                  onChangeText={setTyped}
                  multiline
                  textAlignVertical="top"
                  placeholder="Paste a recipe or type ingredients: 2 eggs, 1 cup milk, butter..."
                  placeholderTextColor={colors.muted}
                  style={styles.textarea}
                />
              )}
            </View>

            {scanError ? (
              <NeoWindow title="Scan Error" variant="not_vegan" size="sm" boxed>
                <Text variant="semibold" style={{ fontSize: 14 }}>{scanError}</Text>
              </NeoWindow>
            ) : null}

            <NeoButton tone="secondary" onPress={() => void handleAnalyze()} disabled={loading}>
              {loading ? (
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <ActivityIndicator color={colors.ink} />
                  <Text variant="bold">Analyzing...</Text>
                </View>
              ) : (
                "Analyze"
              )}
            </NeoButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// One side of the Photo / Upload / Barcode toggle under the camera. The
// highlighted side shows which source is in use; each still does its own
// job when tapped.
function SourceButton({
  label,
  accessibilityLabel,
  active,
  onPress,
  Icon
}: {
  label: string;
  accessibilityLabel: string;
  active: boolean;
  onPress: () => void;
  Icon: (props: { color?: string; size?: number }) => React.ReactNode;
}) {
  const color = active ? colors.cream : colors.ink;
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      style={[styles.source, active && { backgroundColor: colors.forest }]}
    >
      <Icon color={color} />
      <Text variant="bold" style={{ fontSize: 14, color }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  page: { padding: 20, gap: 24 },
  helpWrap: { position: "absolute", right: 20, top: 20, zIndex: 10 },
  help: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center"
  },
  headRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 },
  headingBox: { height: 80, maxWidth: 260, justifyContent: "flex-end", flexShrink: 1 },
  heading: { fontFamily: fonts.display, fontSize: 32, lineHeight: 34, color: colors.forest },
  inputBox: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 12,
    minHeight: 244
  },
  preview: {
    width: "100%",
    height: 260,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.ink
  },
  permission: { alignItems: "center", justifyContent: "center", gap: 16, padding: 20, backgroundColor: colors.cream },
  pdf: {
    width: "100%",
    minHeight: 160,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16
  },
  guide: {
    position: "absolute",
    left: "12.5%",
    width: "75%",
    top: "50%",
    height: 90,
    marginTop: -45,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.butter,
    borderRadius: radius.md
  },
  sources: {
    width: "100%",
    flexDirection: "row",
    gap: 2,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    padding: 3
  },
  source: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  barcodeRow: { flexDirection: "row", gap: 12, width: "100%", alignItems: "center" },
  barcodeInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.white
  },
  link: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  textarea: {
    minHeight: 220,
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 28,
    color: colors.ink
  }
});
