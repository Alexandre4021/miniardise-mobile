import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { z } from 'zod';

import { userMessage } from '@/api/errors';
import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { useAuth } from '@/features/auth/auth-context';
import { colors, spacing } from '@/theme/tokens';

const schema = z
  .object({
    first_name: z.string().trim().min(1, 'Indiquez votre prénom.').max(80),
    last_name: z.string().trim().min(1, 'Indiquez votre nom.').max(80),
    email: z.email('Adresse e-mail invalide.').trim(),
    password: z.string().min(10, '10 caractères minimum.').max(256),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Les mots de passe ne correspondent pas.' });
type Values = z.infer<typeof schema>;

export function RegisterScreen() {
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', confirm: '' },
  });

  const submit = handleSubmit(async ({ confirm: _c, ...v }) => {
    setError(null);
    try {
      await register(v);
      router.back();
    } catch (e) {
      setError(userMessage(e));
    }
  });

  const field = (name: keyof Values, label: string, extra: object = {}) => (
    <Controller
      control={control}
      name={name}
      render={({ field: f, fieldState }) => (
        <TextField label={label} value={f.value} onChangeText={f.onChange} onBlur={f.onBlur} error={fieldState.error?.message} {...extra} />
      )}
    />
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text color="muted">Votre compte est commun avec la boutique en ligne epiceriefineminiardise.fr.</Text>
        {field('first_name', 'Prénom', { autoComplete: 'given-name', textContentType: 'givenName' })}
        {field('last_name', 'Nom', { autoComplete: 'family-name', textContentType: 'familyName' })}
        {field('email', 'E-mail', { autoCapitalize: 'none', keyboardType: 'email-address', autoComplete: 'email', textContentType: 'emailAddress' })}
        {field('password', 'Mot de passe (10 caractères minimum)', { secureTextEntry: true, autoComplete: 'new-password', textContentType: 'newPassword' })}
        {field('confirm', 'Confirmer le mot de passe', { secureTextEntry: true, autoComplete: 'new-password', textContentType: 'newPassword' })}
        {error ? <Text color="error" accessibilityRole="alert">{error}</Text> : null}
        <Button title="Créer mon compte" onPress={submit} loading={formState.isSubmitting} />
        <Text variant="caption" color="muted">
          Vos données servent uniquement à gérer vos commandes. Voir notre politique de confidentialité sur le site.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.cream },
  form: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
});
