import React, {useState} from 'react';
import {Alert, ScrollView, Share, Text, TextInput, View} from 'react-native';
import {Bar, Btn, Card, H, Sparkline} from '../ui/kit';
import {C} from '../ui/theme';
import {SavedServer, useServerStatus, useStore, validNick} from '../store';
import {play, st} from './Home';

const ServerRow: React.FC<{s: SavedServer; open: boolean; toggle: () => void}> = ({s, open, toggle}) => {
  const {settings, removeServer, history} = useStore();
  const {status, error, loading} = useServerStatus(s, {players: open, everyMs: 20000});
  const [q, setQ] = useState('');
  const players = (status?.players ?? []).filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  const connect = async () => {
    if (!validNick(settings.nick)) return Alert.alert('Nume invalid', 'Setează numele în Setări.');
    try {
      await play(s, settings);
    } catch (e) {
      Alert.alert('Nu pot porni jocul', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Card>
      <Text onPress={toggle} style={{color: C.text, fontSize: 16, fontWeight: '700'}}>
        {status?.info.hostname ?? s.name}
      </Text>
      <Text style={st.dim}>
        {s.host}:{s.port} {status ? `· ping ${status.pingMs} ms` : ''}
        {status?.info.passworded ? ' · 🔒' : ''}
      </Text>
      <View style={{marginTop: 8}}>
        <Text style={st.dim}>
          {error ? 'Offline' : status ? `${status.info.players}/${status.info.maxPlayers} online` : loading ? 'Se încarcă…' : ''}
        </Text>
        {status ? <Bar value={status.info.players / Math.max(1, status.info.maxPlayers)} color={C.ok} /> : null}
      </View>
      {open ? (
        <View style={{marginTop: 12}}>
          <Sparkline data={history[s.id] ?? []} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Caută jucător…"
            placeholderTextColor={C.dim}
            style={{color: C.text, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, marginTop: 12}}
          />
          {players.slice(0, 40).map(p => (
            <View key={p.name} style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
              <Text style={{color: C.text}}>{p.name}</Text>
              <Text style={st.dim}>{p.score}</Text>
            </View>
          ))}
          {status && status.info.players > 100 ? <Text style={st.dim}>Lista de jucători nu e disponibilă pe servere mari.</Text> : null}
          <View style={{flexDirection: 'row', gap: 8, marginTop: 12}}>
            <Btn title="Conectare" onPress={connect} style={{flex: 2}} />
            <Btn title="Trimite IP" kind="ghost" onPress={() => Share.share({message: `${s.host}:${s.port}`})} style={{flex: 1}} />
          </View>
          {s.id !== 'main' ? <Btn title="Șterge" kind="ghost" onPress={() => removeServer(s.id)} style={{marginTop: 8}} /> : null}
        </View>
      ) : (
        <Text onPress={toggle} style={{color: C.accent, marginTop: 8}}>
          Detalii
        </Text>
      )}
    </Card>
  );
};

export const ServersScreen: React.FC = () => {
  const {servers, addServer} = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [addr, setAddr] = useState('');

  const add = () => {
    const m = addr.trim().match(/^([A-Za-z0-9.\-]+)(?::(\d{1,5}))?$/);
    if (!m) return Alert.alert('Adresă invalidă', 'Folosește formatul ip:port, ex. 1.2.3.4:7777');
    addServer({name: m[1], host: m[1], port: m[2] ? +m[2] : 7777});
    setAddr('');
  };

  return (
    <ScrollView contentContainerStyle={st.pad} keyboardShouldPersistTaps="handled">
      <H>Servere</H>
      <Card>
        <Text style={[st.dim, {marginBottom: 8}]}>Adaugă un server (ip:port)</Text>
        <TextInput
          value={addr}
          onChangeText={setAddr}
          placeholder="127.0.0.1:7777"
          placeholderTextColor={C.dim}
          autoCapitalize="none"
          style={{color: C.text, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, marginBottom: 10}}
        />
        <Btn title="Adaugă" onPress={add} />
      </Card>
      {servers.map(s => (
        <ServerRow key={s.id} s={s} open={open === s.id} toggle={() => setOpen(open === s.id ? null : s.id)} />
      ))}
    </ScrollView>
  );
};
