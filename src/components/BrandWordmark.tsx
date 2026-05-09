import React from "react";
import { Text, View } from "react-native";

interface BrandWordmarkProps {
  className?: string;
  textClassName?: string;
  light?: boolean;
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({ className = "", textClassName = "text-xl", light = false }) => (
  <View className={`flex-row items-baseline ${className}`}>
    <Text className={`font-bold ${textClassName} ${light ? "text-white" : "text-waterbase-950"}`}>Waterbase</Text>
    <View className="relative flex-row items-baseline ml-0.5">
      <Text className={`font-bold ${textClassName} text-[#0038A8]`}>P</Text>
      <Text className={`font-bold ${textClassName} text-[#CE1126]`}>H</Text>
      <View className="absolute -right-1 -top-0.5 w-1.5 h-1.5 rounded-full bg-[#FCD116]" />
    </View>
  </View>
);
