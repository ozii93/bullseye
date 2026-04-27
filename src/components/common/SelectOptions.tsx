import React, { useState, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { COLORS } from "../../assets/theme";

export type Option = {
  label: string;
  value: string;
};

export type SelectProps = {
  label: string;
  options: Option[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  backgroundColor?: string; // biar bisa custom
};

const SelectOptions: React.FC<SelectProps> = ({
  label,
  options,
  selectedValue,
  onValueChange,
  backgroundColor = "#26a69a", // default hijau ala Materialize
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedLabel = new Animated.Value(selectedValue ? 1 : 0);

  useEffect(() => {
    Animated.timing(animatedLabel, {
      toValue: isFocused || selectedValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, selectedValue]);

  const labelStyle = {
    position: "absolute" as const,
    left: 12,
    top: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 4],
    }),
    fontSize: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: isFocused ? "#fff" : "#e0e0e0",
  };

  return (
    <View style={styles.container}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <View
        style={[
          styles.pickerWrapper,
          {
            backgroundColor,
            borderColor: COLORS.lightGrey,
          },
        ]}
      >
        <Picker
          mode="dropdown"
          selectedValue={selectedValue}
          onValueChange={(itemValue) => onValueChange(itemValue)}
          style={styles.picker}
          dropdownIconColor="#959595ff"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          {options.map((opt) => (
            <Picker.Item
              key={opt.value}
              label={opt.label}
              value={opt.value}
              color="#FFF"
              style={{backgroundColor: COLORS.tertiary}}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
};

export default SelectOptions;

const styles = StyleSheet.create({
  container: {
  },
  pickerWrapper: {
    borderWidth: 1, // border 2px
    borderRadius: 12, // rounded corner
    overflow: "hidden",
  },
  picker: {
    height: 50,
    paddingLeft: 10,
    color: "#fff",
  },
});
