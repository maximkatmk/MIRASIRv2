import React, {useState} from 'react';
import {Alert, Image, ImageBackground, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Bar, Btn, Card, Sparkline} from '../ui/kit';
import {C} from '../ui/theme';
import {GAME_ACTIVITY, GAME_PACKAGE, LINKS} from '../config';
import {Launcher} from '../native';
import {mainServer, useServerStatus, useStore, validNick} from '../store';
import {useGameFiles} from '../lib/gameFiles';
import {GAME_DIR, formatBytes} from '../lib/downloader';

export const play = async (
  server: {host: string; port: number},
  s: ReturnType<typeof useStore>['settings'],
) => {
  await Launcher.launchGame(GAME_PACKAGE, GAME_ACTIVITY, {
    nickname: s.nick,
    host: server.host,
    port: server.port,
    graphics: s.graphics,
    fpsLimit: s.fpsLimit,
    hudScale: s.hudScale,
    gamePath: GAME_DIR,
  });
};

export const HomeScreen: React.FC<{goSettings: () => void}> = ({goSettings}) => {
  const {settings, device, clientInstalled, refreshClient, history} = useStore();
  const {status, error, loading, refresh} = useServerStatus(mainServer);
  const files = useGameFiles();
  const [busy, setBusy] = useState(false);

  const unsupported = device && !device.is64;
  const online = status?.info.players ?? 0;
  const max = status?.info.maxPlayers ?? 1;

  const onPlay = async () => {
    if (!validNick(settings.nick)) {
      Alert.alert('Nume invalid', 'Alege un nume de 3–20 caractere în Setări.', [{text: 'Setări', onPress: goSettings}]);
      return;
    }
    setBusy(true);
    try {
      await play(mainServer, settings);
    } catch (e) {
      Alert.alert('Nu pot porni jocul', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const f = files.state;
  let action: React.ReactNode;
  if (unsupported) {
    action = <Btn title="Dispozitiv incompatibil (arm64 necesar)" onPress={() => {}} disabled />;
  } else if (!clientInstalled) {
    action = <Btn title="Instalează clientul" onPress={() => Launcher.openUrl(LINKS.site).then(refreshClient)} />;
  } else if (f.kind === 'checking') {
    action = <Btn title={f.total ? `Verific fișierele ${f.done}/${f.total}…` : 'Verific fișierele…'} onPress={() => {}} disabled />;
  } else if (f.kind === 'needs') {
    action = <Btn title={`Descarcă fișierele (${formatBytes(f.bytes)})`} onPress={files.start} />;
  } else if (f.kind === 'downloading') {
    action = <Btn title="Anulează descărcarea" kind="ghost" onPress={files.cancel} />;
  } else if (f.kind === 'error') {
    action = <Btn title="Reîncearcă" kind="ghost" onPress={files.check} />;
  } else {
    action = <Btn title={busy ? 'Pornesc…' : 'JOACĂ'} onPress={onPlay} disabled={busy} />;
  }

  return (
    <ImageBackground source={require('../assets/home-bg.jpg')} resizeMode="cover" style={st.fill}>
    <View style={st.shade} />
    <ScrollView contentContainerStyle={st.pad}>
      <Image source={require('../assets/logo.png')} resizeMode="contain" style={st.logo} accessibilityLabel="Mira City" />

      <Card bg={require('../assets/server-bg.jpg')}>
        <Text style={st.name}>{status?.info.hostname ?? mainServer.name}</Text>
        <Text style={st.dim}>
          {error ? `Server offline (${error})` : status ? `${status.info.gamemode} · ${status.info.language} · ping ${status.pingMs} ms` : loading ? 'Se conectează…' : ''}
        </Text>
        <View style={{marginVertical: 12}}>
          <View style={st.row}>
            <Text style={st.big}>{online}</Text>
            <Text style={st.dim}> / {max} jucători online</Text>
          </View>
          <Bar value={online / max} color={error ? C.err : C.ok} />
        </View>
        <Text style={[st.dim, {marginBottom: 6}]}>Online în ultimele măsurători</Text>
        <Sparkline data={history[mainServer.id] ?? []} />
        <Btn title="Reîmprospătează" kind="ghost" onPress={refresh} style={{marginTop: 12}} />
      </Card>

      {unsupported ? (
        <Card style={{borderColor: C.err}}>
          <Text style={{color: C.err, fontWeight: '700'}}>Telefon pe 32 de biți</Text>
          <Text style={st.dim}>Launcherul Mira City rulează doar pe dispozitive arm64-v8a ({device?.model}).</Text>
        </Card>
      ) : null}

      {f.kind === 'downloading' ? (
        <Card>
          <Text style={st.name}>Se descarcă… {Math.round((f.p.doneBytes / Math.max(1, f.p.totalBytes)) * 100)}%</Text>
          <Text style={st.dim}>
            {f.p.file} ({f.p.fileIndex}/{f.p.fileCount}) · {formatBytes(f.p.doneBytes)} / {formatBytes(f.p.totalBytes)}
          </Text>
          <View style={{marginTop: 10}}>
            <Bar value={f.p.doneBytes / Math.max(1, f.p.totalBytes)} color={C.accent2} />
          </View>
        </Card>
      ) : null}
      {f.kind === 'error' ? (
        <Card style={{borderColor: C.err}}>
          <Text style={{color: C.err}}>{f.message}</Text>
        </Card>
      ) : null}

      {action}
      <Text style={[st.dim, {textAlign: 'center', marginTop: 12}]}>
        Jucător: {settings.nick || '—'} · grafică {settings.graphics} · {settings.fpsLimit} FPS
      </Text>
    </ScrollView>
    </ImageBackground>
  );
};

export const st = StyleSheet.create({
  fill: {flex: 1},
  shade: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,14,20,0.45)'},
  logo: {width: '70%', height: 110, alignSelf: 'center', marginBottom: 8},
  pad: {padding: 16, paddingBottom: 32},
  name: {color: C.text, fontSize: 18, fontWeight: '700'},
  dim: {color: C.dim, fontSize: 13},
  big: {color: C.text, fontSize: 30, fontWeight: '800'},
  row: {flexDirection: 'row', alignItems: 'baseline', marginBottom: 8},
});
