import { Image } from "expo-image";
import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import type { Product } from "@shared/products/openFoodFacts";
import { colors, radius } from "@/theme";
import { BoxIcon } from "./Icons";
import { Text } from "./Text";

export function ProductCard({ product }: { product: Product }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <View style={styles.wrap}>
      <View style={styles.shadow} />
      <View style={styles.card}>
        {product.image && !imageFailed ? (
          <Image source={{ uri: product.image }} style={styles.thumb} contentFit="contain" onError={() => setImageFailed(true)} />
        ) : (
          <View style={[styles.thumb, styles.center]}>
            <BoxIcon size={36} />
          </View>
        )}
        <View style={{ flex: 1, gap: 4 }}>
          {product.brand ? <Text variant="small" style={{ opacity: 0.8 }}>{product.brand}</Text> : null}
          <Text variant="display" style={{ fontSize: 20, lineHeight: 24 }}>{product.name || "Unnamed product"}</Text>
          {product.labelledVegan ? (
            <View style={styles.badge}>
              <Text variant="semibold" style={{ fontSize: 11, lineHeight: 14, color: colors.white }}>Labelled vegan on the pack</Text>
            </View>
          ) : null}
          {product.traces ? (
            <Text variant="small">
              <Text variant="small" style={{ fontWeight: "700" }}>Pack warning:</Text> {product.traces}. That&apos;s about
              shared factories, not an ingredient, so it doesn&apos;t change the verdict.
            </Text>
          ) : null}
          <Text variant="small" style={{ fontSize: 11 }}>
            Barcode {product.barcode}. Product data from{" "}
            <Text
              variant="small"
              style={{ fontSize: 11, textDecorationLine: "underline" }}
              onPress={() => void Linking.openURL(`https://world.openfoodfacts.org/product/${product.barcode}`)}
            >
              Open Food Facts
            </Text>
            .
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", marginRight: 4, marginBottom: 4 },
  shadow: { position: "absolute", top: 4, left: 4, right: -4, bottom: -4, borderRadius: radius.md, backgroundColor: colors.ink },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    backgroundColor: colors.white
  },
  thumb: { width: 80, height: 80, borderWidth: 2, borderColor: colors.ink, borderRadius: radius.md, backgroundColor: colors.white },
  center: { alignItems: "center", justifyContent: "center" },
  badge: {
    alignSelf: "flex-start",
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.forest
  }
});
