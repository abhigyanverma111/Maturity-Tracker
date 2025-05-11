import { useState, useEffect } from "react";
import Details from "./Details";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TouchableOpacity,
  Alert,
} from "react-native";

type Props = {
  id: string;
  name: string;
  type: string;
  maturities: { date: string; lot: number }[];
  onPress: () => void;
  onDelete: (id: string) => void;
};

export default function StockListItem({
  id,
  name,
  type,
  maturities,
  onPress,
  onDelete,
}: Props) {
  const [maturedCount, setMaturedCount] = useState(0);

  const [detailsVisible, setDetailsVisible] = useState(false);

  useEffect(() => {
    const today = new Date();
    const count = maturities.reduce((acc, entry) => {
      const purchaseDate = new Date(entry.date);
      const diffTime = today.getTime() - purchaseDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays >= 365) {
        acc += entry.lot;
      }
      return acc;
    }, 0);

    setMaturedCount(count);
  }, [maturities]);

  const handleLongPress = () => {
    Alert.alert("Delete Stock", `Are you sure you want to delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(name) },
    ]);
  };

  return (
    <Pressable onPress={onPress} onLongPress={handleLongPress}>
      <View style={styles.card}>
        <View style={styles.inlineRow}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={styles.inlineRow}>
              <Text style={styles.name}>{name}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.type}>{type}</Text>
              </View>
            </View>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>{maturedCount}</Text>
            </View>
          </View>
        </View>
        <View style={styles.maturityRow}>
          {maturities.map((entry, idx) => {
            const purchaseDate = new Date(entry.date);
            const maturityDate = new Date(
              purchaseDate.getFullYear() + 1,
              purchaseDate.getMonth(),
              purchaseDate.getDate()
            );
            const formatted = maturityDate.toISOString().split("T")[0]; // e.g., "2025-05-08"

            return (
              <View key={idx} style={styles.maturityBadge}>
                <Text style={styles.maturityText}>
                  {formatted} : {entry.lot}
                </Text>
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={() => setDetailsVisible(true)}
          style={styles.detailsLink}
        >
          <Text style={styles.detailsText}>Details</Text>
        </Pressable>
      </View>

      <Modal
        animationType="slide"
        transparent={false} // set to false for full-screen
        visible={detailsVisible}
      >
        <View style={{ flex: 1 }}>
          <Details
            maturities={maturities}
            setDetailsVisible={setDetailsVisible}
          />
        </View>
      </Modal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 1,
    marginVertical: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#d4d4d4",
    paddingBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  type: {
    fontSize: 9,
    fontWeight: "normal",
    color: "#555",
  },
  typeBadge: {
    backgroundColor: "#eee",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  counterBadge: {
    backgroundColor: "#d4fcd4",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 1,
  },
  counterText: {
    fontWeight: "bold",
    color: "#0a0",
  },

  maturityRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 6,
    rowGap: 6, // optional: for vertical spacing between lines
  },
  maturityBadge: {
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start", // Keeps it left-aligned
  },
  maturityText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  ellipsis: {
    fontSize: 12,
    color: "#777",
    marginLeft: 4,
  },
  detailsLink: {
    color: "#2563eb",
    fontSize: 13,
    marginTop: 6,
    textDecorationLine: "underline",
    alignSelf: "flex-start",
  },
  detailsText: {
    fontSize: 13,
    color: "#2563eb", // blue hyperlink-like color
    textDecorationLine: "underline",
    fontWeight: "500",
  },
});
