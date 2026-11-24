import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { userMessage } from '@/api/errors';
import { fetchAddresses, updateAddresses, type Address } from '@/api/mobile/account';
import { Button } from '@/components/button';
import { ErrorState, LoadingState } from '@/components/screen-state';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { colors, radius, spacing } from '@/theme/tokens';

type Kind = 'billing' | 'shipping';
const FIELDS: [keyof Address, string, object?][] = [
  ['first_name', 'Prénom', { autoComplete: 'given-name' }],
  ['last_name', 'Nom', { autoComplete: 'family-name' }],
  ['company', 'Société (facultatif)'],
  ['address_1', 'Adresse', { autoComplete: 'street-address' }],
  ['address_2', 'Complément (facultatif)'],
  ['postcode', 'Code postal', { keyboardType: 'number-pad', autoComplete: 'postal-code' }],
  ['city', 'Ville'],
  ['phone', 'Téléphone', { keyboardType: 'phone-pad', autoComplete: 'tel' }],
];

export function AddressesScreen() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['account', 'addresses'], queryFn: ({ signal }) => fetchAddresses(signal) });
  const [kind, setKind] = useState<Kind>('shipping');
  const [draft, setDraft] = useState<Partial<Record<Kind, Partial<Address>>>>({});
  const save = useMutation({
    mutationFn: () => updateAddresses({ [kind]: { ...draft[kind], country: draft[kind]?.country || q.data?.[kind].country || 'FR' } }),
    onSuccess: (data) => {
      qc.setQueryData(['account', 'addresses'], data);
      setDraft((d) => ({ ...d, [kind]: undefined }));
    },
  });

  if (q.isPending) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;

  const current = { ...q.data[kind], ...draft[kind] };
  const set = (k: keyof Address, v: string) => setDraft((d) => ({ ...d, [kind]: { ...d[kind], [k]: v } }));

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.tabs} accessibilityRole="tablist">
          {(['shipping', 'billing'] as Kind[]).map((k) => (
            <Button
              key={k}
              title={k === 'shipping' ? 'Livraison' : 'Facturation'}
              variant={kind === k ? 'primary' : 'secondary'}
              onPress={() => setKind(k)}
              style={styles.flex}
            />
          ))}
        </View>
        <View style={styles.card}>
          {FIELDS.map(([k, label, extra]) => (
            <TextField key={k} label={label} value={String(current[k] ?? '')} onChangeText={(v) => set(k, v)} {...extra} />
          ))}
          <Text variant="caption" color="muted">Pays : {current.country || 'FR'}</Text>
        </View>
        {save.isError ? <Text color="error">{userMessage(save.error)}</Text> : null}
        {save.isSuccess && !draft[kind] ? <Text color="success">Adresse enregistrée.</Text> : null}
        <Button title="Enregistrer" onPress={() => save.mutate()} loading={save.isPending} disabled={!draft[kind]} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.cream },
  body: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.md, gap: spacing.md },
});
