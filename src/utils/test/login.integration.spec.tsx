import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import LoginScreen from '../../../app/login';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  let state: any = { auth: { loading: false, error: null, user: null } };
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (sel: any) => sel(state),
    __m: {
      setState: (s: any) => { state = s; },
      reset: () => mockDispatch.mockClear(),
      getState: () => state,
    },
  };
});

jest.mock('expo-router', () => {
  const replace = jest.fn();
  const push = jest.fn();
  const back = jest.fn();
  return {
    __esModule: true,
    useRouter: () => ({ replace, push, back }),
    router: { replace, push, back },
    __m: { replace, push, back },
  };
});

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { __m: rr } = require('react-redux');
    rr.setState({ auth: { loading: false, error: null, user: null } });
  });

  test('positivo: login exitoso', async () => {
    const { __m: rr } = require('react-redux');
    const { __m: router } = require('expo-router');

    const ui = render(<LoginScreen />);
    fireEvent.changeText(screen.getByPlaceholderText(/correo|email/i), 'usuario@ejemplo.com');
    fireEvent.changeText(screen.getByPlaceholderText(/contraseña|password/i), 'Pass1234!');
    fireEvent.press(screen.getByText(/iniciar sesi[óo]n/i));

    expect(mockDispatch).toHaveBeenCalled();

    await act(async () => {
      rr.setState({ auth: { loading: false, error: null, user: { id: 'u1', email: 'usuario@ejemplo.com' } } });
    });
    ui.rerender(<LoginScreen />);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(tabs)'));
  });

  test('negativo: credenciales inválidas', async () => {
    const { __m: router } = require('expo-router');

    render(<LoginScreen />);
    fireEvent.changeText(screen.getByPlaceholderText(/correo|email/i), 'usuario@falso');
    fireEvent.changeText(screen.getByPlaceholderText(/contraseña|password/i), '12345');
    fireEvent.press(screen.getByText(/iniciar sesi[óo]n/i));


    expect(router.replace).not.toHaveBeenCalled();
  });
});
