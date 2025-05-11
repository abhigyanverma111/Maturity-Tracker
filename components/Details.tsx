import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Maturity = {
  date: string;
  lot: number;
};

type Props = {
  maturities: Maturity[];
  setDetailsVisible: (truthvalue) => void;
};

const Details: React.FC<Props> = ({ maturities, setDetailsVisible }) => {
  // Sort maturities by date
  const sortedMaturities = maturities.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  const returnDatesMapper = (maturity: Maturity) => {
    const purchaseDate = new Date(maturity.date);
    const maturityDate = new Date(
      purchaseDate.getFullYear() + 1,
      purchaseDate.getMonth(),
      purchaseDate.getDate()
    );
    return maturityDate.toISOString().split("T")[0]; // formatted string like "2025-05-08"
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setDetailsVisible(false)}
        style={styles.closeButton}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <Text style={styles.title}>Maturity Details</Text>
      </View>
      <ScrollView contentContainerStyle={styles.maturityList}>
        {sortedMaturities.map((maturity, index) => (
          <View key={index} style={styles.maturityItem}>
            <Text style={styles.maturityText}>
              {maturity.date} : {returnDatesMapper(maturity)} {"   -   "}{" "}
              {maturity.lot} shares
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "white",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 30,
  },
  maturityList: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  maturityItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  maturityText: {
    fontSize: 16,
    color: "#333",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    left: 10,
    padding: 5, // Add padding to give the button more touch area
  },
});

export default Details;
