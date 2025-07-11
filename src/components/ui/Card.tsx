import React from "react";
import { View, Text } from "react-native";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <View
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
    >
      {children}
    </View>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = "",
}) => {
  return <View className={`p-4 ${className}`}>{children}</View>;
};

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = "",
}) => {
  return <View className={`p-4 pt-0 ${className}`}>{children}</View>;
};

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className = "",
}) => {
  return (
    <Text className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </Text>
  );
};

export const CardDescription: React.FC<CardDescriptionProps> = ({
  children,
  className = "",
}) => {
  return (
    <Text className={`text-sm text-gray-600 mt-1 ${className}`}>
      {children}
    </Text>
  );
};
