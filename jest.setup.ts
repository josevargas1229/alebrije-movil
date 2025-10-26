/* eslint-disable import/first */
/* eslint-disable @typescript-eslint/no-require-imports */

import 'whatwg-fetch';
import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Cámara
jest.mock('expo-camera', () => ({
  CameraView: () => null,
  Camera: { requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })) },
}));

// AsyncStorage
const mockAsyncStorage = require('@react-native-async-storage/async-storage/jest/async-storage-mock');
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Navegación
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    // evita NavigationContainer: ejecuta como un useEffect normal
    useFocusEffect: (cb: any) => {
      const React = require('react');
      React.useEffect(() => {
        const cleanup = cb();
        return cleanup;
      }, []);
    },
  };
});


