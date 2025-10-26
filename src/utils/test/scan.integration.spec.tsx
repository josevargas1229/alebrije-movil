import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ProductDetailScreen from '../../../app/(tabs)/(scanner)/product-details/[qrcode]';

let mockQr = '{"productId":"12345","store":"001"}';
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ qrcode: mockQr }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() })
}));


type MockState = {
  product: { product: any; loading: boolean; error: string | null };
  sales: { drafts: any; activeSaleId: string | null };
};
let mockState: MockState = {
  product: { product: null, loading: false, error: null },
  sales: { drafts: {}, activeSaleId: 'sale-1' }
};

const mockDispatch = jest.fn();
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (sel: any) =>
      sel({
        product: mockState.product,
        sales: mockState.sales
      })
  };
});

const sampleProduct = () => ({
  id: 'PROD-001',
  precio: 199.99,
  tipo: { nombre: 'Playera' },
  marca: { nombre: 'MarcaX' },
  categoria: { nombre: 'Casual' },
  tallasColoresStock: [
    {
      talla: { id: 'T-1', talla: 'M' },
      coloresStock: {
        id: 'C-1',
        color: 'Rojo',
        imagenes: [{ url: 'https://example.com/img.jpg' }]
      },
      stock: 8
    },
    {
      talla: { id: 'T-2', talla: 'L' },
      coloresStock: { id: 'C-2', color: 'Azul', imagenes: [] },
      stock: 5
    }
  ]
});



describe('Flujo visual tras escaneo de QR', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      product: { product: null, loading: false, error: null },
      sales: { drafts: { 'sale-1': { productos: [] } }, activeSaleId: 'sale-1' }
    };
    mockQr = '{"productId":"12345","store":"001"}';
  });

  test('Positivo: QR válido → muestra detalle, stock y permite agregar', async () => {
    mockState.product.product = sampleProduct();

    render(<ProductDetailScreen />);

    expect(await screen.findByText(/Playera MarcaX Casual/i)).toBeTruthy();
    expect(screen.getByText(/\$199\.99/)).toBeTruthy();


expect(await screen.findByText(/stock disponible/i)).toBeTruthy();

    const addBtn = screen.getByText(/agregar a la venta actual/i);
    expect(addBtn).toBeEnabled();

    fireEvent.press(addBtn);

  });

  test('Negativo: JSON malformado → pantalla de error', async () => {
    mockQr = '{oops'; 
    mockState.product.error = 'QR_JSON_MALFORMED';
    render(<ProductDetailScreen />);

    expect(await screen.findByText(/algo salió mal/i)).toBeTruthy();
    expect(screen.getByText(/QR_JSON_MALFORMED/i)).toBeTruthy();
  });

  test('Negativo: QR expirado → pantalla de error', async () => {
    mockQr = '{"productId":"X","store":"Y","exp":1}';
    mockState.product.error = 'QR_EXPIRED';
    render(<ProductDetailScreen />);

    expect(await screen.findByText(/algo salió mal/i)).toBeTruthy();
    expect(screen.getByText(/QR_EXPIRED/i)).toBeTruthy();
  });

  test('Negativo: QR ya utilizado → pantalla de error', async () => {
    mockQr = '{"productId":"X","store":"Y","used":true}';
    mockState.product.error = 'QR_ALREADY_USED';
    render(<ProductDetailScreen />);

    expect(await screen.findByText(/algo salió mal/i)).toBeTruthy();
    expect(screen.getByText(/QR_ALREADY_USED/i)).toBeTruthy();
  });

  test('Negativo: sin info de producto → pantalla de error', async () => {
    mockQr = '{"store":"001"}';
    mockState.product.error = 'QR_INCOMPLETE';
    render(<ProductDetailScreen />);

    expect(await screen.findByText(/algo salió mal/i)).toBeTruthy();
    expect(screen.getByText(/QR_INCOMPLETE/i)).toBeTruthy();
  });

  test('Negativo: QR de otra app → pantalla de error', async () => {
    mockQr = '{"productId":"1","store":"001","app":"otra-app"}';
    mockState.product.error = 'QR_WRONG_APP';
    render(<ProductDetailScreen />);

    expect(await screen.findByText(/algo salió mal/i)).toBeTruthy();
    expect(screen.getByText(/QR_WRONG_APP/i)).toBeTruthy();
  });

  test('Negativo: producto no encontrado tras fetch → “Producto no encontrado”', async () => {
    mockState.product.product = null; 
    mockState.product.error = null;   
    render(<ProductDetailScreen />);

    expect(await screen.findByText(/producto no encontrado/i)).toBeTruthy();
  });
});
