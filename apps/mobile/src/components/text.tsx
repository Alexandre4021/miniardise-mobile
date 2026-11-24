import { Text as RNText, type TextProps } from 'react-native';

import { colors, typography, type TypographyVariant } from '@/theme/tokens';

type Props = TextProps & { variant?: TypographyVariant; color?: keyof typeof colors };

export function Text({ variant = 'body', color = 'ink', style, ...rest }: Props) {
  return <RNText maxFontSizeMultiplier={1.6} style={[typography[variant], { color: colors[color] }, style]} {...rest} />;
}
