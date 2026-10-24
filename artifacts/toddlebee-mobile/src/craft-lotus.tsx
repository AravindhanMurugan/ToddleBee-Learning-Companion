import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Animated, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { AppText, Card, Eyebrow, Notice, PageShell, PrimaryButton, ProgressDots } from './components';
import { useAppSettings } from './settings';
import { useColors } from '@/hooks/useColors';

const KEY = 'toddlebee-clay-lotus-v1';
type CraftState = { phaseIndex: number; actions: boolean[]; confirmations: boolean[] };
const blank = (): CraftState => ({ phaseIndex: 0, actions: Array(5).fill(false), confirmations: Array(5).fill(false) });
const phases = {
  en: [
    { title: 'Prepare safe materials', guide: 'With a grown-up, choose non-toxic air-dry clay and cover the table. Keep a little water nearby for smoothing.', action: 'Tap to set out the safe-making space.', done: 'Your making space is ready.', confirm: 'I prepared the real materials with a grown-up.' },
    { title: 'Form the center', guide: 'Roll a small ball of clay and gently flatten it into a neat, rounded center.', action: 'Press to shape the soft lotus center.', done: 'A rounded center is on your model.', confirm: 'I formed the real clay center.' },
    { title: 'Make and arrange petals', guide: 'Shape broad, soft petals. Place them around the center, then add a second layer behind the first.', action: 'Tap to arrange the layered petals.', done: 'Petals now surround the center.', confirm: 'I made and arranged the real petals.' },
    { title: 'Add stem and leaves', guide: 'Roll a short stem and make two gently pointed leaves. Press each part together softly.', action: 'Tap to add a stem and two leaves.', done: 'Stem and leaves complete the model.', confirm: 'I added the real stem and leaves.' },
    { title: 'Dry and finish', guide: 'Leave the lotus to dry exactly as the clay instructions say. Ask a grown-up before adding any paint or finish.', action: 'Tap to place your lotus on its drying rest.', done: 'Your lotus is ready to dry.', confirm: 'I placed the real lotus somewhere safe to dry.' },
  ],
  ta: [
    { title: 'பாதுகாப்பான பொருட்களைத் தயார் செய்', guide: 'பெரியவருடன் நச்சில்லாத காற்றில் உலரும் களிமண்ணைத் தேர்ந்தெடுத்து மேசையை மூடுங்கள். மென்மையாக்க சிறிது தண்ணீர் அருகில் வையுங்கள்.', action: 'பாதுகாப்பான வேலை இடத்தை அமைக்கத் தொடு.', done: 'வேலை இடம் தயார்.', confirm: 'பெரியவருடன் உண்மையான பொருட்களைத் தயார் செய்தேன்.' },
    { title: 'மையத்தை உருவாக்கு', guide: 'சிறிய களிமண் உருண்டையை உருட்டி, மெதுவாகத் தட்டி வட்டமான மையமாக்குங்கள்.', action: 'மென்மையான தாமரை மையத்தை அமைக்க அழுத்து.', done: 'வட்டமான மையம் மாதிரியில் உள்ளது.', confirm: 'உண்மையான களிமண் மையத்தை உருவாக்கினேன்.' },
    { title: 'இதழ்களைச் செய்து அடுக்கு', guide: 'அகலமான மென்மையான இதழ்களைச் செய்து மையத்தைச் சுற்றி வையுங்கள். பின்னால் இன்னொரு அடுக்கையும் சேருங்கள்.', action: 'அடுக்கான இதழ்களை அமைக்கத் தொடு.', done: 'மையத்தைச் சுற்றி இதழ்கள் உள்ளன.', confirm: 'உண்மையான இதழ்களைச் செய்து அடுக்கினேன்.' },
    { title: 'தண்டும் இலைகளும் சேர்', guide: 'குறுகிய தண்டை உருட்டி, இரண்டு மென்மையான கூர்முனை இலைகளைச் செய்யுங்கள். ஒவ்வொரு பகுதியையும் மெதுவாக இணைக்கவும்.', action: 'தண்டையும் இரண்டு இலைகளையும் சேர்க்கத் தொடு.', done: 'மாதிரியில் தண்டும் இலைகளும் உள்ளன.', confirm: 'உண்மையான தண்டையும் இலைகளையும் சேர்த்தேன்.' },
    { title: 'உலர்த்தி முடி', guide: 'களிமண் வழிமுறையின்படி தாமரையை உலர விடுங்கள். வண்ணம் அல்லது பூச்சு சேர்க்கும் முன் பெரியவரிடம் கேளுங்கள்.', action: 'உலரும் இடத்தில் தாமரையை வைக்கத் தொடு.', done: 'தாமரை பாதுகாப்பாக உலரத் தயார்.', confirm: 'உண்மையான தாமரையைப் பாதுகாப்பான இடத்தில் உலர வைத்தேன்.' },
  ],
} as const;

export function ClayLotusScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language } = useAppSettings();
  const ta = language === 'ta';
  const words = phases[language];
  const [state, setState] = useState<CraftState>(blank);
  const [loaded, setLoaded] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const bounce = useRef(new Animated.Value(1)).current;
  const index = Math.min(state.phaseIndex, 4);
  const finished = state.phaseIndex >= 5;
  const phase = words[index];
  const count = state.confirmations.filter(Boolean).length;
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(KEY).then((raw) => {
      if (!raw || !active) return;
      try {
        const parsed = JSON.parse(raw) as Partial<CraftState>;
        setState({ phaseIndex: Math.max(0, Math.min(5, Number(parsed.phaseIndex) || 0)), actions: Array.from({ length: 5 }, (_, i) => Boolean(parsed.actions?.[i])), confirmations: Array.from({ length: 5 }, (_, i) => Boolean(parsed.confirmations?.[i])) });
      } catch { setState(blank()); }
    }).catch(() => { if (active) setStorageFailed(true); }).finally(() => { if (active) setLoaded(true); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    return () => { active = false; subscription.remove(); };
  }, []);
  useEffect(() => { if (loaded) void AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => setStorageFailed(true)); }, [loaded, state]);
  const animate = () => {
    if (reduceMotion) return;
    bounce.setValue(0.9);
    Animated.spring(bounce, { toValue: 1, useNativeDriver: Platform.OS !== 'web', speed: 16, bounciness: 8 }).start();
  };
  const restart = () => Alert.alert(ta ? 'மீண்டும் தொடங்கலாமா?' : 'Start the lotus again?', ta ? 'சாதனத்தில் சேமித்த முன்னேற்றம் நீக்கப்படும்.' : 'Saved lotus progress on this device will be cleared.', [
    { text: ta ? 'வேண்டாம்' : 'Keep progress', style: 'cancel' },
    { text: ta ? 'மீண்டும் தொடங்கு' : 'Reset activity', style: 'destructive', onPress: () => { setState(blank()); setStorageFailed(false); } },
  ]);
  if (!loaded) return <PageShell title={ta ? 'களிமண் தாமரை' : 'Clay lotus'}><Card><View style={[styles.skeleton, { backgroundColor: colors.muted }]} /><View style={[styles.skeleton, styles.short, { backgroundColor: colors.muted }]} /></Card></PageShell>;
  return <PageShell title={ta ? 'களிமண் தாமரை' : 'Clay lotus'} subtitle={ta ? 'ஒவ்வொரு இதழையும் அன்புடன் உருவாக்குங்கள்.' : 'Build a small lotus, petal by petal.'}>
    <PrimaryButton label={ta ? 'களிமண் விநாயகர் செயலுக்குச் செல்' : 'Visit the clay Ganesha activity'} icon="arrow-left" secondary onPress={() => router.push('/craft')} testID="lotus-link-ganesha" />
    <Card>
      <View style={styles.progressHead}><Eyebrow>{ta ? 'உங்கள் முன்னேற்றம்' : 'YOUR PROGRESS'}</Eyebrow><AppText testID="lotus-progress-status" accessibilityLiveRegion="polite">{ta ? `${count} / 5 படிகள் முடிந்தன` : `${count} of 5 phases complete`}</AppText></View>
      <ProgressDots current={count} total={5} />
    </Card>
    <Card style={[styles.art, { backgroundColor: colors.secondary }]}>
      <View style={styles.artTitle}><Feather name="sun" size={17} color={colors.foreground} /><Eyebrow>{finished ? (ta ? 'உங்கள் களிமண் தாமரை' : 'YOUR CLAY LOTUS') : (ta ? 'மெதுவாக உருவாகிறது' : 'TAKING SHAPE')}</Eyebrow></View>
      <Animated.View style={{ transform: [{ scale: bounce }] }} accessible accessibilityRole="image" accessibilityLabel={ta ? `${count} படிகளுடன் தாமரை மாதிரி` : `Lotus model showing ${count} completed phases`}><LotusModel stage={count} colors={colors} /></Animated.View>
      <AppText style={styles.caption}>{ta ? 'திரை மாதிரி ஒரு வழிகாட்டி மட்டுமே.' : 'The screen model is only a guide.'}</AppText>
    </Card>
    {finished ? <Card><Text style={[styles.doneTitle, { color: colors.foreground }]}>{ta ? 'அழகான தாமரை!' : 'A lotus, made with care.'}</Text><AppText>{ta ? 'களிமண் வழிமுறையின்படி முழுமையாக உலர விடுங்கள்.' : 'Let it dry fully according to the clay instructions.'}</AppText><Notice>{ta ? 'உண்மையான களிமண் வேலையைச் செயலி சரிபார்க்க முடியாது.' : 'This app cannot verify physical clay work.'}</Notice></Card> : <Card style={styles.phaseCard}>
      <View style={styles.phaseHeading}><View style={[styles.number, { backgroundColor: colors.primary }]}><Text style={{ color: colors.foreground, fontFamily: 'Nunito_900Black', fontSize: 20 }}>{index + 1}</Text></View><View style={{ flex: 1, gap: 3 }}><Eyebrow>{ta ? `படி ${index + 1} / 5` : `PHASE ${index + 1} OF 5`}</Eyebrow><Text style={[styles.phaseTitle, { color: colors.foreground }]}>{phase.title}</Text></View></View>
      <AppText>{phase.guide}</AppText>
      <View style={[styles.miniPanel, { backgroundColor: colors.background, borderColor: colors.border }]}><Eyebrow>{ta ? 'திரைச் சிறு செயல்' : 'ON-SCREEN MINI ACTION'}</Eyebrow><AppText>{state.actions[index] ? phase.done : phase.action}</AppText><PrimaryButton label={state.actions[index] ? (ta ? 'செயல் முடிந்தது' : 'Mini action complete') : (ta ? 'திரையில் வடிவமை' : 'Shape it on screen')} icon={state.actions[index] ? 'check-circle' : 'edit-3'} disabled={state.actions[index]} onPress={() => { setState((old) => ({ ...old, actions: old.actions.map((v, i) => i === index ? true : v) })); animate(); }} testID="lotus-mini-action" /></View>
      <View style={[styles.realPanel, { borderColor: colors.border }]}><Eyebrow>{ta ? 'உண்மையான களிமண் படி' : 'REAL CLAY STEP'}</Eyebrow><AppText>{ta ? 'உண்மையான களிமண் வேலையை இந்தச் செயலி சரிபார்க்க முடியாது.' : 'This app cannot verify your physical clay work.'}</AppText><PrimaryButton label={ta ? 'உண்மையான படியை முடித்தேன்' : 'I finished this real-clay step'} icon="check" disabled={!state.actions[index]} onPress={() => { if (!state.actions[index]) return; setState((old) => ({ phaseIndex: Math.min(5, index + 1), actions: old.actions, confirmations: old.confirmations.map((v, i) => i === index ? true : v) })); animate(); }} testID="lotus-confirm-real-step" /></View>
    </Card>}
    <Card><View style={styles.safetyTitle}><Feather name="shield" size={18} color={colors.foreground} /><Text style={[styles.phaseTitle, { color: colors.foreground }]}>{ta ? 'பாதுகாப்பு முதலில்' : 'Safety first'}</Text></View><AppText>{ta ? 'எல்லா நேரமும் பெரியவர் உடன் இருக்க வேண்டும். கூர்மையான கருவிகள் பயன்படுத்த வேண்டாம். களிமண்ணைச் சாப்பிட வேண்டாம். நச்சில்லாத பொருட்களை மட்டும் பயன்படுத்துங்கள்.' : 'An adult must supervise. Do not use sharp tools. Do not eat clay. Use non-toxic materials only.'}</AppText></Card>
    <Card><AppText>{ta ? 'முன்னேற்றம் இந்தச் சாதனத்தில் மட்டும் சேமிக்கப்படுகிறது.' : 'Progress is saved only on this device.'}</AppText>{storageFailed && <Notice tone="error">{ta ? 'முன்னேற்றத்தைச் சேமிக்க முடியவில்லை.' : 'Progress could not be saved.'}</Notice>}<PrimaryButton label={ta ? 'செயலை மீட்டமை' : 'Reset this activity'} icon="refresh-cw" secondary onPress={restart} testID="lotus-reset" /></Card>
    <PrimaryButton label={ta ? 'களிமண் விநாயகர் செயலுக்குச் செல்' : 'Try the clay Ganesha activity'} icon="arrow-left" secondary onPress={() => router.push('/craft')} testID="lotus-link-ganesha-bottom" />
  </PageShell>;
}

function LotusModel({ stage, colors }: { stage: number; colors: ReturnType<typeof useColors> }) {
  return <Svg width="100%" height="210" viewBox="0 0 300 210" accessibilityLabel="A clay lotus taking shape">
    <Ellipse cx="150" cy="190" rx="90" ry="11" fill={colors.foreground} opacity=".09" />
    {stage >= 4 && <><Path d="M150 164 Q147 180 150 190" stroke={colors.accent} strokeWidth="10" strokeLinecap="round" /><Path d="M146 178 Q116 157 105 175 Q126 193 146 183" fill={colors.accent} stroke={colors.foreground} strokeWidth="2" /><Path d="M154 181 Q176 157 193 172 Q180 192 154 187" fill={colors.accent} stroke={colors.foreground} strokeWidth="2" /></>}
    {stage >= 3 && <>
      <Ellipse cx="150" cy="112" rx="20" ry="51" fill={colors.destructive} stroke={colors.foreground} strokeWidth="2.5" />
      <Ellipse cx="126" cy="122" rx="20" ry="43" transform="rotate(-36 126 122)" fill={colors.primary} stroke={colors.foreground} strokeWidth="2.5" />
      <Ellipse cx="174" cy="122" rx="20" ry="43" transform="rotate(36 174 122)" fill={colors.primary} stroke={colors.foreground} strokeWidth="2.5" />
      <Ellipse cx="109" cy="139" rx="18" ry="34" transform="rotate(-64 109 139)" fill={colors.destructive} stroke={colors.foreground} strokeWidth="2.5" />
      <Ellipse cx="191" cy="139" rx="18" ry="34" transform="rotate(64 191 139)" fill={colors.destructive} stroke={colors.foreground} strokeWidth="2.5" />
    </>}
    {stage >= 2 && <><Ellipse cx="133" cy="145" rx="17" ry="30" transform="rotate(-70 133 145)" fill={colors.primary} stroke={colors.foreground} strokeWidth="2.5" /><Ellipse cx="167" cy="145" rx="17" ry="30" transform="rotate(70 167 145)" fill={colors.primary} stroke={colors.foreground} strokeWidth="2.5" /></>}
    {stage >= 1 && <Ellipse cx="150" cy="145" rx="22" ry="17" fill={colors.destructive} stroke={colors.foreground} strokeWidth="2.5" />}
    {stage < 1 && <Ellipse cx="150" cy="153" rx="30" ry="22" fill={colors.primary} stroke={colors.foreground} strokeWidth="2.5" />}
  </Svg>;
}

const styles = StyleSheet.create({
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  art: { borderWidth: 0, padding: 14, gap: 5 },
  artTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caption: { textAlign: 'center', fontSize: 12 },
  phaseCard: { gap: 14 },
  phaseHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  number: { width: 43, height: 43, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  phaseTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 21, lineHeight: 28 },
  miniPanel: { padding: 14, borderWidth: 1, borderRadius: 17, gap: 10 },
  realPanel: { paddingTop: 13, borderTopWidth: 1, gap: 10 },
  safetyTitle: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  doneTitle: { fontFamily: 'Nunito_900Black', fontSize: 25 },
  skeleton: { height: 16, width: '86%', borderRadius: 9 },
  short: { width: '58%' },
});
