import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'outline';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    className = ''
}) => {
    const baseStyle = 'px-2 py-1 rounded-full';
    const variantStyle = variant === 'outline'
        ? 'border border-gray-300 bg-transparent'
        : 'bg-gray-200';

    return (
        <View className={`${baseStyle} ${variantStyle} ${className}`}>
            <Text className="text-xs font-medium">
                {children}
            </Text>
        </View>
    );
};