import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Hauteur de la barre d'onglets native iOS (hors zone de l'indicateur d'accueil). */
const IOS_TAB_BAR = 49;

/**
 * Espace à réserver en bas d'un écran d'onglet : sur iOS, la barre d'onglets native passe
 * PAR-DESSUS le contenu. Sur Android, la barre de navigation ne recouvre pas l'écran ;
 * sur le web (aperçus), les onglets sont en haut.
 */
export function useTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'ios' ? IOS_TAB_BAR + insets.bottom : 0;
}
