import React, {useState} from 'react';
import {Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {StoreProvider, useStore} from './src/store';
import {HomeScreen} from './src/screens/Home';
import {ServersScreen} from './src/screens/Servers';
import {NewsScreen} from './src/screens/News';
import {SettingsScreen} from './src/screens/Settings';
import {C} from './src/ui/theme';

type Tab = 'home' | 'servers' | 'news' | 'settings';
const TABS: {id: Tab; label: string; icon: string}[] = [
  {id: 'home', label: 'Acasă', icon: '🏠'},
  {id: 'servers', label: 'Servere', icon: '🌐'},
  {id: 'news', label: 'Știri', icon: '📰'},
  {id: 'settings', label: 'Setări', icon: '⚙️'},
];

const Shell: React.FC = () => {
  const {ready} = useStore();
  const [tab, setTab] = useState<Tab>('home');
  if (!ready) return <View style={{flex: 1, backgroundColor: C.bg}} />;
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: C.bg}}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={{flex: 1}}>
        {tab === 'home' && <HomeScreen goSettings={() => setTab('settings')} />}
        {tab === 'servers' && <ServersScreen />}
        {tab === 'news' && <NewsScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </View>
      <View style={s.bar}>
        {TABS.map(t => (
          <Pressable key={t.id} style={s.tab} onPress={() => setTab(t.id)}>
            <Text style={{fontSize: 20, opacity: tab === t.id ? 1 : 0.5}}>{t.icon}</Text>
            <Text style={{color: tab === t.id ? C.accent : C.dim, fontSize: 11, fontWeight: '600'}}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

const s = StyleSheet.create({
  bar: {flexDirection: 'row', backgroundColor: C.card, borderTopWidth: 1, borderColor: C.border, paddingVertical: 8},
  tab: {flex: 1, alignItems: 'center', gap: 2},
});
