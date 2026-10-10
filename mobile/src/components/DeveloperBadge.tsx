import { View, Text, TouchableOpacity } from 'react-native';
import { Linking } from 'react-native';
import Constants from 'expo-constants';


const DeveloperBadge = () => {
    const appVersion = Constants.expoConfig?.version ?? '1.0.0';

    const openGitHub = () => {
        Linking.openURL('https://github.com/iprincemishra')
            .catch(err => console.error('Error opening URL:', err));
    };

    return (
        <View className="items-center pb-6 opacity-40">
            <Text className="text-gray-400 text-[10px] font-medium">
                Version {appVersion}
            </Text>
            <TouchableOpacity onPress={openGitHub} activeOpacity={0.7}>
                <Text className="text-gray-400 text-[11px] font-semibold mt-1">
                    Developed by{' '}
                    <Text className="text-blue-500 text-[13px] font-bold">
                        Prince Mishra
                    </Text>
                </Text>
            </TouchableOpacity>
        </View>
    );
}

export default DeveloperBadge