import { statusTone } from '@/utils/order-status';

describe('statusTone', () => {
  it('statuts expédiés/terminés en vert, y compris les statuts personnalisés du site', () => {
    for (const s of ['completed', 'sended', 'wc-shipped', 'being-delivered']) expect(statusTone(s).text).toBe('#2F6F3A');
  });
  it('annulée / échouée en rouge', () => {
    expect(statusTone('cancelled').text).toBe('#A8261D');
    expect(statusTone('failed').text).toBe('#A8261D');
  });
  it('statut inconnu : neutre', () => expect(statusTone('xyz').text).toBe('#3D3424'));
});
