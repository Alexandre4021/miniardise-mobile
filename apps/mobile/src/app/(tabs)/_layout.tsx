import { NativeTabs } from 'expo-router/native-tabs';

import { useCartCount } from '@/features/cart/use-cart';
import { colors } from '@/theme/tokens';

export default function TabsLayout() {
  const count = useCartCount();
  return (
    <NativeTabs
      backgroundColor={colors.cream}
      indicatorColor={colors.champagne}
      iconColor={{ default: colors.muted, selected: colors.goldText }}
      labelStyle={{ default: { color: colors.muted }, selected: { color: colors.ink } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Accueil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="boutique">
        <NativeTabs.Trigger.Label>Boutique</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bag', selected: 'bag.fill' }} md="storefront" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="panier">
        <NativeTabs.Trigger.Label>Panier</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Badge hidden={count === 0}>{count > 99 ? '99+' : String(count)}</NativeTabs.Trigger.Badge>
        <NativeTabs.Trigger.Icon sf={{ default: 'cart', selected: 'cart.fill' }} md="shopping_cart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="compte">
        <NativeTabs.Trigger.Label>Compte</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
