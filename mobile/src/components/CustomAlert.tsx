import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
}

const CustomAlert = ({
    visible,
    title,
    message,
    type = 'info',
    onClose,
    onConfirm,
    confirmText = "OK"
}: CustomAlertProps) => {

    const getIcon = () => {
        if (type === 'success') return <Feather name="check-circle" size={48} color="#16a34a" />;
        if (type === 'error') return <Feather name="alert-triangle" size={48} color="#dc2626" />;
        return <Feather name="info" size={48} color="#2563eb" />;
    };

    const getButtonColor = () => {
        if (type === 'error') return 'bg-red-600/80';
        if (type === 'success') return 'bg-green-600';
        return 'bg-blue-600';
    };

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
                <View className="bg-white w-full rounded-3xl p-6 shadow-2xl items-center">

                    <View className="text-4xl mb-4">{getIcon()}</View>

                    <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
                        {title}
                    </Text>

                    <Text className="text-gray-500 text-center mb-8">
                        {message}
                    </Text>

                    <View className="flex-row w-full justify-between gap-3">
                        {onConfirm && (
                            <TouchableOpacity
                                onPress={onClose}
                                className="flex-1 py-3.5 rounded-xl bg-gray-100 items-center"
                            >
                                <Text className="text-gray-600 font-bold">Cancel</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={onConfirm ? onConfirm : onClose}
                            className={`flex-1 py-3.5 rounded-xl items-center shadow-sm ${getButtonColor()}`}
                        >
                            <Text className="text-white font-bold">{confirmText}</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
};

export default CustomAlert;