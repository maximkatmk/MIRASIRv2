import React from 'react';
import {ImageBackground, ImageSourcePropType, Pressable, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {C, R} from './theme';

export const Card: React.FC<{style?: ViewStyle; bg?: ImageSourcePropType; children: React.ReactNode}> = ({style, bg, children}) =>
  bg ? (
    <ImageBackground source={bg} resizeMode="cover" style={[s.card, s.cardImg, style]} imageStyle={s.cardImgInner}>
      <View style={s.cardShade} />
      <View style={s.cardPad}>{children}</View>
    </ImageBackground>
  ) : (
    <View style={[s.card, style]}>{children}</View>
  );

export const Btn: React.FC<{
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}> = ({title, onPress, kind = 'primary', disabled, style}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({pressed}) => [
      s.btn,
      kind === 'primary' ? s.btnPrimary : s.btnGhost,
      disabled && {opacity: 0.4},
      pressed && {opacity: 0.8},
      style,
    ]}>
    <Text style={[s.btnText, kind === 'ghost' && {color: C.text}]}>{title}</Text>
  </Pressable>
);

export const Chip: React.FC<{label: string; active?: boolean; onPress?: () => void}> = ({label, active, onPress}) => (
  <Pressable onPress={onPress} style={[s.chip, active && {backgroundColor: C.accent, borderColor: C.accent}]}>
    <Text style={[s.chipText, active && {color: '#fff'}]}>{label}</Text>
  </Pressable>
);

export const Bar: React.FC<{value: number; color?: string}> = ({value, color = C.accent}) => (
  <View style={s.barBg}>
    <View style={[s.barFill, {width: `${Math.max(0, Math.min(1, value)) * 100}%`, backgroundColor: color}]} />
  </View>
);

/** Grafic simplu de online (bare). */
export const Sparkline: React.FC<{data: number[]; height?: number}> = ({data, height = 46}) => {
  if (data.length < 2) return <Text style={{color: C.dim, fontSize: 12}}>Se adună date pentru grafic…</Text>;
  const max = Math.max(...data, 1);
  return (
    <View style={{height, flexDirection: 'row', alignItems: 'flex-end', gap: 2}}>
      {data.map((v, i) => (
        <View
          key={i}
          style={{flex: 1, height: Math.max(2, (v / max) * height), backgroundColor: C.accent2, borderRadius: 2, opacity: 0.4 + 0.6 * (i / data.length)}}
        />
      ))}
    </View>
  );
};

export const H: React.FC<{children: string; right?: React.ReactNode}> = ({children, right}) => (
  <View style={s.h}>
    <Text style={s.hText}>{children}</Text>
    {right}
  </View>
);

const s = StyleSheet.create({
  card: {backgroundColor: C.card, borderRadius: R, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12},
  cardImg: {padding: 0, overflow: 'hidden', backgroundColor: C.card},
  cardImgInner: {borderRadius: R},
  cardShade: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,14,20,0.62)'},
  cardPad: {padding: 16},
  btn: {paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center'},
  btnPrimary: {backgroundColor: C.accent},
  btnGhost: {backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border},
  btnText: {color: '#fff', fontWeight: '700', fontSize: 15},
  chip: {paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.cardHi},
  chipText: {color: C.dim, fontWeight: '600'},
  barBg: {height: 8, borderRadius: 4, backgroundColor: C.cardHi, overflow: 'hidden'},
  barFill: {height: 8, borderRadius: 4},
  h: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4},
  hText: {color: C.text, fontSize: 20, fontWeight: '800'},
});
