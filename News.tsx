import React, {useCallback, useEffect, useState} from 'react';
import {ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Card} from '../ui/kit';
import {C} from '../ui/theme';
import {NEWS_URL} from '../config';
import {load, save} from '../lib/storage';
import {st} from './Home';

interface Item {
  id: number;
  title: string;
  text: string;
  date?: string;
}

export const NewsScreen: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(NEWS_URL, {headers: {'cache-control': 'no-cache'}});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Item[];
      setItems(data);
      setMsg('');
      save('news', data);
    } catch {
      // fără internet / URL neconfigurat: arătăm ultimele știri salvate
      const cached = await load<Item[]>('news', []);
      setItems(cached);
      setMsg(cached.length ? 'Offline — ultimele știri salvate.' : 'Nu sunt știri momentan.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ScrollView contentContainerStyle={st.pad} refreshControl={<RefreshControl refreshing={busy} onRefresh={refresh} tintColor={C.accent} />}>
      <ImageBackground source={require('../assets/news-banner.jpg')} resizeMode="cover" style={ns.banner} imageStyle={ns.bannerImg}>
        <View style={ns.bannerText}>
          <Text style={ns.title}>Știri</Text>
          <Text style={ns.sub}>Ce se întâmplă în Mira City</Text>
        </View>
      </ImageBackground>
      {msg ? <Text style={[st.dim, {marginBottom: 10}]}>{msg}</Text> : null}
      {items.map(n => (
        <Card key={n.id}>
          <Text style={{color: C.text, fontSize: 16, fontWeight: '700'}}>{n.title}</Text>
          {n.date ? <Text style={[st.dim, {marginVertical: 4}]}>{n.date}</Text> : null}
          <Text style={{color: C.text, opacity: 0.85}}>{n.text}</Text>
        </Card>
      ))}
    </ScrollView>
  );
};

const ns = StyleSheet.create({
  banner: {height: 150, borderRadius: 16, overflow: 'hidden', marginBottom: 14, justifyContent: 'center'},
  bannerImg: {borderRadius: 16},
  bannerText: {paddingLeft: 18, width: '55%'},
  title: {color: C.text, fontSize: 26, fontWeight: '800'},
  sub: {color: C.dim, fontSize: 13, marginTop: 2},
});
