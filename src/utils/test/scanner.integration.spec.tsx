import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ScannerScreen from '../../../app/(tabs)/(scanner)/scanner';

jest.mock('expo-camera', () => {
  const perm = { current: 'granted' as 'granted' | 'denied' };
  const request = jest.fn(async () => ({ status: perm.current }));
  const useCameraPermissions = () =>
    [{ granted: perm.current === 'granted', status: perm.current }, request] as const;

  return {
    __esModule: true,
    CameraView: () => null,
    Camera: { requestCameraPermissionsAsync: request },
    useCameraPermissions,
    __m: { setPermission: (s: 'granted' | 'denied') => { perm.current = s; } },
  };
});

jest.mock('expo-router', () => {
  const push = jest.fn();
  const back = jest.fn();
  return { __esModule: true, useRouter: () => ({ push, back }), __m: { push, back } };
});

describe('Camara y escaneo', () => {
  test('positivo: permisos otorgados', async () => {
    const { __m } = require('expo-camera') as any;
    __m.setPermission('granted');
    render(<ScannerScreen />);
    expect(await screen.findByText(/iniciando c(á|a)mara/i)).toBeTruthy();
  });

  test('negativo: permisos denegados', async () => {
    const { __m } = require('expo-camera') as any;
    __m.setPermission('denied');
    render(<ScannerScreen />);
    expect(await screen.findByText(/necesitamos permiso para usar la c(á|a)mara/i)).toBeTruthy();
    expect(screen.getByText(/conceder permiso/i)).toBeTruthy();
  });
});
