import React from 'react';
import {ScrollView, Text, TextInput, View} from 'react-native';
import {Btn, Card, Chip, H} from '../ui/kit';
import {C} from '../ui/theme';
import {LINKS} from '../config';
import {Launcher} from '../native';
import {Graphics, useStore, validNick} from '../store';
import {st} from './Home';

export const SettingsScreen: React.FC = () => {
  const {settings, setSettings, device, clientInstalled} = useStore();
  const bad = settings.nick.length > 0 && !validNick(settings.nick);
  const label = {low: 'Mică', medium: 'Medie', high: 'Mare'} as const;

  return (
    <ScrollView contentContainerStyle={st.pad} keyboardShouldPersistTaps="handled">
      <H>Setări</H>

      <Card>
        <Text style={st.dim}>Nume de joc</Text>
        <TextInput
          value={settings.nick}
          onChangeText={t => setSettings({nick: t})}
          placeholder="Nume_Prenume"
          placeholderTextColor={C.dim}
          autoCapitalize="none"
          maxLength={20}
          style={{color: C.text, fontSize: 18, borderBottomWidth: 1, borderColor: bad ? C.err : C.border, paddingVertical: 8}}
        />
        {bad ? <Text style={{color: C.err, marginTop: 6}}>3–20 caractere: litere, cifre și _ [ ] $ = @ ( ) .</Text> : null}
      </Card>

      <Card>
        <Text style={[st.dim, {marginBottom: 8}]}>Calitate grafică</Text>
        <View style={{flexDirection: 'row', gap: 8}}>
          {(['low', 'medium', 'high'] as Graphics[]).map(g => (
            <Chip key={g} label={label[g]} active={settings.graphics === g} onPress={() => setSettings({graphics: g})} />
          ))}
        </View>
        <Text style={[st.dim, {marginTop: 16, marginBottom: 8}]}>Limită FPS</Text>
        <View style={{flexDirection: 'row', gap: 8}}>
          {([30, 60, 90] as const).map(f => (
            <Chip key={f} label={`${f}`} active={settings.fpsLimit === f} onPress={() => setSettings({fpsLimit: f})} />
          ))}
        </View>
        <Text style={[st.dim, {marginTop: 16, marginBottom: 8}]}>Mărime interfață în joc</Text>
        <View style={{flexDirection: 'row', gap: 8}}>
          {[0.8, 1, 1.2].map(h => (
            <Chip key={h} label={`${Math.round(h * 100)}%`} active={settings.hudScale === h} onPress={() => setSettings({hudScale: h})} />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={st.dim}>Dispozitiv</Text>
        <Text style={{color: C.text, marginTop: 4}}>
          {device ? `${device.model} · Android API ${device.sdk} · ${device.is64 ? 'arm64 ✓' : '32-bit ✗'}` : '…'}
        </Text>
        <Text style={{color: clientInstalled ? C.ok : C.warn, marginTop: 4}}>
          Client de joc: {clientInstalled ? 'instalat' : 'neinstalat'}
        </Text>
      </Card>

      <Btn title="Discord" kind="ghost" onPress={() => Launcher.openUrl(LINKS.discord)} style={{marginBottom: 8}} />
      <Btn title="Site" kind="ghost" onPress={() => Launcher.openUrl(LINKS.site)} />
    </ScrollView>
  );
};
