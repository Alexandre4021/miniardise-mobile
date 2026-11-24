import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { z } from 'zod';

import { userMessage } from '@/api/errors';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/button';
import { LoadingState } from '@/components/screen-state';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { useAuth } from '@/features/auth/auth-context';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { colors, radius, spacing, tapTarget } from '@/theme/tokens';

export function AccountScreen() {
  const { status } = useAuth();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader />
      {status === 'loading' ? <LoadingState /> : status === 'signedIn' ? <AccountHome /> : <LoginForm />}
    </SafeAreaView>
  );
}

const loginSchema = z.object({
  login: z.string().trim().min(1, 'Indiquez votre e-mail ou identifiant.'),
  password: z.string().min(1, 'Indiquez votre mot de passe.'),
});

function LoginForm() {
  const { login } = useAuth();
  const tabInset = useTabBarInset();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: '', password: '' },
  });

  const submit = handleSubmit(async (v) => {
    setError(null);
    try {
      await login(v.login, v.password);
    } catch (e) {
      setError(userMessage(e));
    }
  });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.form, { paddingBottom: spacing.xxl + tabInset }]} keyboardShouldPersistTaps="handled">
        <Text variant="display">Mon compte</Text>
        <Text color="muted">Connectez-vous avec le compte de la boutique en ligne pour retrouver vos commandes et vos adresses.</Text>
        <Controller
          control={control}
          name="login"
          render={({ field, fieldState }) => (
            <TextField
              label="E-mail ou identifiant"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              keyboardType="email-address"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              label="Mot de passe"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => void submit()}
              error={fieldState.error?.message}
            />
          )}
        />
        {error ? <Text color="error" accessibilityRole="alert">{error}</Text> : null}
        <Button title="Se connecter" onPress={submit} loading={formState.isSubmitting} />
        <Link href="/mot-de-passe-oublie" asChild>
          <Pressable accessibilityRole="link" style={styles.link}>
            <Text color="goldText" style={styles.linkText}>Mot de passe oublié ?</Text>
          </Pressable>
        </Link>
        <View style={styles.sep} />
        <Text variant="bodyStrong">Nouveau client ?</Text>
        <Button title="Créer un compte" variant="secondary" onPress={() => router.push('/inscription')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ICON = {
  orders: '<path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  address: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
};

function MenuRow({ title, subtitle, icon, onPress }: { title: string; subtitle: string; icon: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
      <View style={styles.menuIco}>
        <SvgXml
          xml={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`}
          color={colors.goldText}
          width={22}
          height={22}
        />
      </View>
      <View style={styles.flex}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="small" color="muted">{subtitle}</Text>
      </View>
      <Text color="muted">›</Text>
    </Pressable>
  );
}

function AccountHome() {
  const { user, logout } = useAuth();
  const tabInset = useTabBarInset();
  const [busy, setBusy] = useState(false);
  const confirmAll = () =>
    Alert.alert('Déconnecter tous mes appareils ?', 'Vous devrez vous reconnecter sur chaque téléphone.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: () => void logout(true) },
    ]);

  return (
    <ScrollView contentContainerStyle={[styles.form, { paddingBottom: spacing.xxl + tabInset }]}>
      <View style={styles.hello}>
        <Text variant="caption" style={styles.kicker}>MON COMPTE</Text>
        <Text variant="display">Bonjour {user?.first_name || ''}</Text>
        <Text color="muted">{user?.email}</Text>
      </View>
      <MenuRow title="Mes commandes" subtitle="Suivi et historique" icon={ICON.orders} onPress={() => router.push('/commandes')} />
      <MenuRow title="Mes adresses" subtitle="Facturation et livraison" icon={ICON.address} onPress={() => router.push('/adresses')} />
      <View style={styles.sep} />
      <Button
        title="Se déconnecter"
        variant="secondary"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          await logout(false);
        }}
      />
      <Button title="Déconnecter tous mes appareils" variant="ghost" onPress={confirmAll} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  form: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  link: { minHeight: tapTarget, justifyContent: 'center', alignSelf: 'center' },
  linkText: { fontWeight: '600' },
  sep: { height: 1, backgroundColor: colors.line, marginVertical: spacing.sm },
  hello: { gap: 4, paddingVertical: spacing.sm },
  kicker: { color: colors.goldText, letterSpacing: 1.5 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.md },
  menuIco: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.champagne, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.8 },
});
