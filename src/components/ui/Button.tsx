import React from "react";
import { TouchableOpacity, Text, View } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  icon,
  className = "",
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-waterbase-500 border-waterbase-500";
      case "secondary":
        return "bg-white border-waterbase-300";
      case "outline":
        return "bg-transparent border-waterbase-300";
      default:
        return "bg-waterbase-500 border-waterbase-500";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "px-3 py-2";
      case "md":
        return "px-4 py-3";
      case "lg":
        return "px-8 py-4";
      default:
        return "px-4 py-3";
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "primary":
        return "text-white";
      case "secondary":
        return "text-waterbase-700";
      case "outline":
        return "text-waterbase-700";
      default:
        return "text-white";
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        border rounded-lg flex-row items-center justify-center
        ${disabled ? "opacity-50" : ""}
        ${className}
      `}
    >
      {icon && <View className="mr-2">{icon}</View>}
      <Text className={`font-semibold ${getTextColor()}`}>{title}</Text>
    </TouchableOpacity>
  );
};
