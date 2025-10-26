export type QrPayload = {
  productId: string;
  store: string;
  exp?: number;
  used?: boolean;
  app?: string; // opcional, para validar “otra app”
};

/** expectedAppId es opcional. Si lo pasas y no coincide, lanza QR_WRONG_APP. */
export function parseQr(text: string, expectedAppId?: string): QrPayload {
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new Error('QR_JSON_MALFORMED'); }

  const p = data as Partial<QrPayload>;
  if (!p.productId || !p.store) throw new Error('QR_INCOMPLETE');
  if (p.exp && Date.now() > p.exp) throw new Error('QR_EXPIRED');
  if (p.used) throw new Error('QR_ALREADY_USED');
  if (expectedAppId && p.app && p.app !== expectedAppId) throw new Error('QR_WRONG_APP');

  return { productId: p.productId, store: p.store, exp: p.exp, used: p.used, app: p.app };
}
