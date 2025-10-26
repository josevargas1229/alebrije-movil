import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProductDetailScreen from '../../../app/(tabs)/(scanner)/product-details/[qrcode]';

jest.mock('expo-router', () => {
  const push = jest.fn();
  const back = jest.fn();
  return { __esModule: true, useLocalSearchParams: () => ({ qrcode: '{"productId":"12345","store":"001"}' }),
           useRouter: () => ({ push, back }), __m: { push, back } };
});

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  const dispatch = jest.fn();
  let state: any = {};
  return {
    ...actual,
    useDispatch: () => dispatch,
    useSelector: (sel: any) => sel(state),
    __m: {
      dispatch,
      setState: (s: any) => { state = s; },
      clearDispatch: () => dispatch.mockClear(),
    },
  };
});

const productoOK = () => ({
  id: 'PROD-001',
  precio: 120.5,
  tipo: { nombre: 'Playera' },
  marca: { nombre: 'MarcaX' },
  categoria: { nombre: 'Casual' },
  tallasColoresStock: [
    { talla: { id: 'T1', talla: 'M' }, coloresStock: { id: 'C1', color: 'Rojo', imagenes: [] }, stock: 5 },
  ],
});

beforeEach(() => {
  jest.clearAllMocks();
  const { __m: rr } = require('react-redux');
  rr.setState({
    product: { product: productoOK(), loading: false, error: null },
    sales: { drafts: { 'sale-1': { productos: [] } }, activeSaleId: 'sale-1' },
  });
  jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
    if (buttons?.[0]?.onPress) buttons[0].onPress();
    return undefined as any;
  });
});

describe('Detalle → Nueva venta (new-sale)', () => {
  test('positivo: botón habilitado, despacha y navega a /(sales)/…', async () => {
    const { __m: rr } = require('react-redux');
    const { __m: router } = require('expo-router');

    const ui = render(<ProductDetailScreen />);
    rr.clearDispatch();

    expect(await screen.findByText(/playera\s+marcax\s+casual/i)).toBeTruthy();
    expect(await screen.findByText(/stock disponible/i)).toBeTruthy();

    const newSaleBtnText = await screen.findByText(/crear nueva venta/i);
    fireEvent.press(newSaleBtnText);

    expect(rr.dispatch).toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith(expect.stringMatching(/\(sales\)/));
    ui.unmount();
  });

  test('negativo: sin stock → no despacha ni navega', async () => {
    const { __m: rr } = require('react-redux');
    const { __m: router } = require('expo-router');

    rr.setState({
      product: {
        product: { ...productoOK(), tallasColoresStock: [{ talla: { id: 'T1', talla: 'M' }, coloresStock: { id: 'C1', color: 'Rojo', imagenes: [] }, stock: 0 }] },
        loading: false, error: null,
      },
      sales: { drafts: { 'sale-1': { productos: [] } }, activeSaleId: 'sale-1' },
    });

    const ui = render(<ProductDetailScreen />);
    rr.clearDispatch();

    const newSaleBtnText = await screen.findByText(/crear nueva venta/i);

    fireEvent.press(newSaleBtnText);
    expect(rr.dispatch).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
    ui.unmount();
  });

  test('negativo: producto no encontrado', async () => {
    const { __m: rr } = require('react-redux');
    rr.setState({ product: { product: null, loading: false, error: null }, sales: { drafts: {}, activeSaleId: null } });
    render(<ProductDetailScreen />);
    expect(await screen.findByText(/producto no encontrado/i)).toBeTruthy();
  });
});
