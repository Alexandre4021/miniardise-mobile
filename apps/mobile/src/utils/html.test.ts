import { decodeEntities, htmlToText } from '@/utils/html';

describe('html', () => {
  it('décode les entités courantes de WordPress', () => {
    expect(decodeEntities('Amandes &#8211; 1&nbsp;kg &amp; plus')).toBe('Amandes – 1 kg & plus');
  });
  it('convertit le HTML en paragraphes sans balises ni scripts', () => {
    expect(htmlToText('<p>Ligne <strong>1</strong></p><script>alert(1)</script><p>Ligne&nbsp;2</p>')).toBe('Ligne 1\n\nLigne 2');
  });
});
