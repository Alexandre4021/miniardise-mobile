import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { userMessage } from '@/api/errors';
import { requestPasswordReset } from '@/api/mobile/auth';
import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { colors, spacing } from '@/theme/tokens';

export function PasswordResetScreen() {
  const [login, setLogin] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      setDone((await requestPasswordReset(login.trim())).message);
    } catch (e) {
      setError(userMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" style={styles.bg}>
      {done ? (
        <Text accessibilityRole="alert">{done}</Text>
      ) : (
        <>
          <Text color="muted">Indiquez l’e-mail ou l’identifiant de votre compte. Vous recevrez un lien pour choisir un nouveau mot de passe.</Text>
          <TextField label="E-mail ou identifiant" value={login} onChangeText={setLogin} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          {error ? <Text color="error">{error}</Text> : null}
          <Button title="Envoyer le lien" onPress={submit} loading={busy} disabled={!login.trim()} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: colors.cream },
  form: { padding: spacing.md, gap: spacing.md },
});
