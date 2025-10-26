import { parseQr } from '../../utils/qr';

describe('Escaneo QR: validaciones de código', () => {
  const valid = `{"productId":"12345","store":"001"}`;

    // Positivas
  it('QR válido con formato correcto', () => {
    expect(parseQr(valid)).toEqual({
      productId: '12345',
      store: '001',
      exp: undefined,
      used: undefined,
      app: undefined,
    });
  });

  it('QR decodificado exitosamente con datos completos', () => {
    const full = JSON.stringify({
      productId: '12345',
      store: '001',
      exp: Date.now() + 60_000,
      used: false,
    });
    const r = parseQr(full);
    expect(r.productId).toBe('12345');
    expect(r.store).toBe('001');
  });

  // Negativas
  it('QR con formato incorrecto o corrupto', () => {
    expect(() => parseQr('{bad')).toThrow('QR_JSON_MALFORMED');
  });

  it('QR expirado', () => {
    const past = JSON.stringify({ productId: 'x', store: 'y', exp: Date.now() - 1 });
    expect(() => parseQr(past)).toThrow('QR_EXPIRED');
  });

  it('QR ya utilizado', () => {
    const used = JSON.stringify({ productId: 'x', store: 'y', used: true });
    expect(() => parseQr(used)).toThrow('QR_ALREADY_USED');
  });

  it('QR sin información de producto', () => {
    expect(() => parseQr(JSON.stringify({ store: '001' }))).toThrow('QR_INCOMPLETE');
    expect(() => parseQr(JSON.stringify({ productId: '123' }))).toThrow('QR_INCOMPLETE');
  });

  it('Código QR de otra aplicación o sistema', () => {
    const other = JSON.stringify({ productId: '1', store: '001', app: 'otra-app' });
    expect(() => parseQr(other, 'alebrije-app')).toThrow('QR_WRONG_APP');
  });

  it('Datos JSON malformados en el QR', () => {
    expect(() => parseQr('not-json-at-all')).toThrow('QR_JSON_MALFORMED');
  });
});
