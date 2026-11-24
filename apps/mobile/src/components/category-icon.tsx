import { SvgXml } from 'react-native-svg';

import { categorySvg } from '@/theme/categories';

export function CategoryIcon({ icon, color, size = 32 }: { icon: string; color: string; size?: number }) {
  return <SvgXml xml={categorySvg(icon)} color={color} width={size} height={size} accessibilityElementsHidden importantForAccessibility="no" />;
}
