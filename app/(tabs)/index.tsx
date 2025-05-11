import {
  View,
  FlatList,
  StyleSheet,
  Modal,
  Text,
  Button,
  BackHandler,
  TouchableOpacity,
  TextInput,
} from "react-native";
import StockListItem from "@/components/StockListItem";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function Index() {
  const [stockData, setStockData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem("stockData");
        if (stored) {
          setStockData(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load data", e);
      }
    };
    loadData();
  }, []);

  const [selectedStock, setSelectedStock] = useState<{
    id: string;
    name: string;
    type: string;
    maturities: { date: string; lot: number }[];
  } | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  const [Count, setCount] = useState("");
  const [selectedDate, setselectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mode, setMode] = useState("BUY");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("STOCK");
  const [newDate, setNewDate] = useState(new Date());
  const [newLot, setNewLot] = useState("");
  const [showNewDatePicker, setShowNewDatePicker] = useState(false);

  const handleStockPress = (item: (typeof stockData)[number]) => {
    setSelectedStock(item);
    setModalVisible(true);
  };
  const isModalOpenRef = useRef(false);

  useEffect(() => {
    isModalOpenRef.current = isModalVisible;
  }, [isModalVisible]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isModalOpenRef.current) {
          setModalVisible(false);
          return true;
        } else {
          BackHandler.exitApp();
          return true;
        }
      }
    );
    return () => backHandler.remove();
  }, []);

  const buyFunc = async () => {
    if (!selectedStock || !Count) return;

    const dateStr = selectedDate.toISOString().split("T")[0];
    const updatedStockData = stockData.map((stock) => {
      if (stock.id === selectedStock.id) {
        const existing = stock.maturities.find((m) => m.date === dateStr);
        let updatedMaturities = [...stock.maturities];

        if (existing) {
          updatedMaturities = updatedMaturities.map((m) =>
            m.date === dateStr ? { ...m, lot: m.lot + parseInt(Count, 10) } : m
          );
        } else {
          updatedMaturities.push({
            date: dateStr,
            lot: parseInt(Count, 10),
          });
        }

        return { ...stock, maturities: updatedMaturities };
      }
      return stock;
    });

    try {
      await AsyncStorage.setItem("stockData", JSON.stringify(updatedStockData));
      setStockData(updatedStockData);
    } catch (e) {
      console.error("Error saving to AsyncStorage", e);
    }

    setCount("");
    setselectedDate(new Date());
    setModalVisible(false);
  };

  const sellFunc = async () => {
    if (!selectedStock || !Count) return;

    const lotToSell = parseInt(Count, 10);
    if (isNaN(lotToSell) || lotToSell <= 0) return;

    const sellDateStr = selectedDate.toISOString().split("T")[0];
    const sellDate = new Date(sellDateStr);

    // Find eligible maturities as of the sell date (FIFO order)
    const eligibleMaturities = [...selectedStock.maturities]
      .filter((m) => new Date(m.date) <= sellDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalAvailable = eligibleMaturities.reduce(
      (sum, m) => sum + m.lot,
      0
    );

    if (totalAvailable < lotToSell) {
      alert(
        `Not enough shares available as of ${sellDateStr}. You only had ${totalAvailable} shares.`
      );
      return;
    }

    // Update maturities in FIFO order
    let remainingToSell = lotToSell;
    const updatedMaturities = [...selectedStock.maturities].map((m) => ({
      ...m,
    }));

    for (let i = 0; i < updatedMaturities.length && remainingToSell > 0; i++) {
      const maturity = updatedMaturities[i];
      const maturityDate = new Date(maturity.date);

      if (maturityDate <= sellDate) {
        if (maturity.lot <= remainingToSell) {
          remainingToSell -= maturity.lot;
          maturity.lot = 0;
        } else {
          maturity.lot -= remainingToSell;
          remainingToSell = 0;
        }
      }
    }

    const cleanedMaturities = updatedMaturities.filter((m) => m.lot > 0);

    const updatedStockData = stockData.map((stock) =>
      stock.id === selectedStock.id
        ? { ...stock, maturities: cleanedMaturities }
        : stock
    );

    try {
      await AsyncStorage.setItem("stockData", JSON.stringify(updatedStockData));
      setStockData(updatedStockData);
    } catch (e) {
      console.error("Error saving to AsyncStorage", e);
    }

    setCount("");
    setselectedDate(new Date());
    setModalVisible(false);
  };

  const onDelete = async (name) => {
    const updatedData = stockData.filter((item) => item.name !== name);

    try {
      await AsyncStorage.setItem("stockData", JSON.stringify(updatedData));
      setStockData(updatedData);
    } catch (e) {
      console.error("Failed to delete stock:", e);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={stockData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StockListItem
            name={item.name}
            type={item.type}
            maturities={item.maturities}
            onPress={() => handleStockPress(item)}
            onDelete={onDelete}
          />
        )}
      />
      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        style={styles.fab}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            {/* Add spacing below the button */}
            <View style={{ height: 32 }} />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 20,
              }}
            >
              <View>
                <TouchableOpacity
                  style={{
                    width: 120,
                    height: 30,
                    borderRadius: 5,
                    backgroundColor: mode == "BUY" ? "#0284c7" : "#7dd3fc",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => setMode("BUY")}
                >
                  <Text style={{ color: "white" }}>BUY</Text>
                </TouchableOpacity>
              </View>
              <View>
                <TouchableOpacity
                  style={{
                    width: 120,
                    height: 30,
                    borderRadius: 5,
                    backgroundColor: mode == "SELL" ? "#dc2626" : "#fca5a5",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => setMode("SELL")}
                >
                  <Text style={{ color: "white" }}>SELL</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              value={Count}
              onChangeText={setCount}
              keyboardType="numeric"
              placeholder="Number of shares"
              style={styles.input}
            />

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              <Text>Select Date: {selectedDate.toDateString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    setselectedDate(selectedDate);
                  }
                  setShowDatePicker(false);
                }}
              />
            )}

            <Button
              title={mode == "BUY" ? "ADD BUY" : "ADD SELL"}
              onPress={mode == "BUY" ? buyFunc : sellFunc}
              color="green"
            />
          </View>
        </View>
      </Modal>
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            {/* Title */}
            <Text style={{ fontSize: 18, marginBottom: 0, marginTop: 25 }}>
              Add New Stock
            </Text>

            {/* Stock Name Input */}
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Stock Name"
              style={styles.input}
            />

            {/* Toggle Stock Type */}
            <TouchableOpacity
              onPress={() =>
                setNewType((prev) => (prev === "STOCK" ? "ETF" : "STOCK"))
              }
              style={[styles.dateButton, { marginTop: 12 }]}
            >
              <Text>Type: {newType}</Text>
            </TouchableOpacity>

            {/* Date Picker Trigger */}
            <TouchableOpacity
              onPress={() => setShowNewDatePicker(true)}
              style={{
                padding: 10,
                backgroundColor: "#eee",
                borderRadius: 5,
                marginBottom: 10,
                alignItems: "center",
              }}
            >
              <Text>Select Purchase Date: {newDate.toDateString()}</Text>
            </TouchableOpacity>

            {/* Date Picker Component */}
            {showNewDatePicker && (
              <DateTimePicker
                value={newDate}
                mode="date"
                display="default"
                onChange={(_, selected) => {
                  if (selected) setNewDate(selected);
                  setShowNewDatePicker(false);
                }}
              />
            )}

            {/* Lot Input */}
            <TextInput
              value={newLot}
              onChangeText={setNewLot}
              keyboardType="numeric"
              placeholder="Number of shares"
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 8,
                borderRadius: 5,
                marginTop: 0,
                marginBottom: 20,
              }}
            />

            {/* Submit Button */}
            <Button
              title="Add Stock"
              color="#16a34a"
              onPress={async () => {
                if (!newName || !newLot) return;

                const newStock = {
                  id: Date.now().toString(),
                  name: newName,
                  type: newType,
                  maturities: [
                    {
                      date: newDate.toISOString().split("T")[0],
                      lot: parseInt(newLot, 10),
                    },
                  ],
                };

                const updatedData = [...stockData, newStock];

                try {
                  await AsyncStorage.setItem(
                    "stockData",
                    JSON.stringify(updatedData)
                  );
                  setStockData(updatedData);
                  setShowAddModal(false);
                  setNewName("");
                  setNewLot("");
                  setNewDate(new Date());
                  setNewType("STOCK");
                } catch (e) {
                  console.error("Failed to add stock", e);
                }
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000aa",
  },
  modalBox: {
    width: 300,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 20, // 👈 Add this
    borderRadius: 10,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    left: 10,
    padding: 5, // Add padding to give the button more touch area
  },
  modalText: {
    marginBottom: 10,
    fontSize: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 5,
    marginTop: 30,
  },
  dateButton: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 5,
    marginTop: 30,
    marginBottom: 50,
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#10b981", // Tailwind's emerald-500
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  fabText: {
    fontSize: 30,
    color: "white",
    lineHeight: 32,
  },
});
