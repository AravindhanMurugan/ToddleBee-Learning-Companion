import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { AppText, Card, Eyebrow, Notice, PageShell, PrimaryButton } from './components';
import { useAppSettings } from './settings';
import { useColors } from '@/hooks/useColors';

const STORAGE_KEY = 'toddlebee-clay-craft-v1';

type Phase = {
  title: string;
  guidance: string;
  action: string;
  actionDone: string;
  confirmation: string;
  checklist?: string[];
};

const phases: Record<'en' | 'ta', Phase[]> = {
  en: [
    { title: 'Get ready', guidance: 'Wash your hands, cover the table, and choose non-toxic air-dry or natural clay with a grown-up.', action: 'Tap each ready step below.', actionDone: 'Your making space is ready.', confirmation: 'I finished this real-clay step.', checklist: ['I washed my hands', 'We covered the table', 'A grown-up helped choose safe clay'] },
    { title: 'Make the seat and body', guidance: 'Roll a little clay into a seat. Shape a larger, round body and gently place it on top.', action: 'Press and hold to shape the round body.', actionDone: 'A seat and round body are on the model.', confirmation: 'I finished this real-clay step.' },
    { title: 'Add the head and ears', guidance: 'Make a smaller round head. Add two broad, soft ears on either side.', action: 'Tap to add the head and two broad ears.', actionDone: 'The head and ears have joined the model.', confirmation: 'I finished this real-clay step.' },
    { title: 'Curve the trunk', guidance: 'Roll a small clay piece like a soft rope. Gently curve it down and to one side.', action: 'Trace the curve by tapping the shaping button.', actionDone: 'A gently curved trunk is in place.', confirmation: 'I finished this real-clay step.' },
    { title: 'Add arms and a modak', guidance: 'Add two simple arms. Rest a small modak in one hand; keep it firmly part of the clay figure.', action: 'Tap to place the arms and little modak.', actionDone: 'Arms and a small modak are shown.', confirmation: 'I finished this real-clay step.' },
    { title: 'Make a crown and pattern', guidance: 'Add a small crown. Press a gentle decorative pattern into the clay with a fingertip.', action: 'Tap to add a crown and pressed pattern.', actionDone: 'The crown and pattern are part of the model.', confirmation: 'I finished this real-clay step.' },
    { title: 'Let it dry', guidance: 'Let the figure dry exactly as the clay instructions say. Ask a grown-up before painting.', action: 'Tap to place the finished figure on its drying rest.', actionDone: 'Your model is ready to dry safely.', confirmation: 'I finished this real-clay step.' },
  ],
  ta: [
    { title: 'தயாராகலாம்', guidance: 'கைகளை கழுவி, மேசையை மூடி, பெரியவருடன் நச்சில்லாத காற்றில் உலரும் அல்லது இயற்கைக் களிமண்ணைத் தேர்ந்தெடுக்கவும்.', action: 'தயார்நிலைப் படிகளை ஒவ்வொன்றாகத் தொடவும்.', actionDone: 'உங்கள் வேலை செய்யும் இடம் தயார்.', confirmation: 'இந்த உண்மையான களிமண் படியை முடித்துவிட்டேன்.', checklist: ['கைகளை கழுவினேன்', 'மேசையை மூடினோம்', 'பாதுகாப்பான களிமண்ணைப் பெரியவர் தேர்ந்தெடுத்தார்'] },
    { title: 'அமர்விடம், உடல் அமைக்கலாம்', guidance: 'சிறிது களிமண்ணை உருட்டி அமர்விடம் செய்யுங்கள். பெரிய உருண்டையான உடலை அமைத்து மெதுவாக அதன் மேல் வையுங்கள்.', action: 'உருண்டையான உடலை அமைக்க அழுத்தித் தக்கவைக்கவும்.', actionDone: 'அமர்விடமும் உருண்டை உடலும் மாதிரியில் உள்ளன.', confirmation: 'இந்த உண்மையான களிமண் படியை முடித்துவிட்டேன்.' },
    { title: 'தலை, காதுகளைச் சேர்க்கலாம்', guidance: 'சிறிய உருண்டையான தலையைச் செய்யுங்கள். இருபுறமும் அகலமான, மென்மையான காதுகளைச் சேருங்கள்.', action: 'தலை, இரண்டு அகலமான காதுகளைச் சேர்க்கத் தொடவும்.', actionDone: 'தலையும் காதுகளும் மாதிரியில் சேர்ந்தன.', confirmation: 'இந்த உண்மையான களிமண் படியை முடித்துவிட்டேன்.' },
    { title: 'தும்பிக்கையை வளைப்போம்', guidance: 'சிறிய களிமண் துண்டை மென்மையான கயிறுபோல் உருட்டுங்கள். கீழே ஒரு பக்கமாக மெதுவாக வளைக்கவும்.', action: 'வடிவமைப்பு பொத்தானைத் தொட்டு வளைவைப் பாருங்கள்.', actionDone: 'மெதுவாக வளைந்த தும்பிக்கை அமைந்தது.', confirmation: 'இந்த உண்மையான களிமண் படியை முடித்துவிட்டேன்.' },
    { title: 'கைகள், கொழுக்கட்டை சேர்க்கலாம்', guidance: 'இரண்டு எளிய கைகளைச் சேருங்கள். ஒரு கையில் சிறிய கொழுக்கட்டையை வையுங்கள்; அது உருவத்துடன் நன்றாக ஒட்டியிருக்கட்டும்.', action: 'கைகளையும் சிறிய கொழுக்கட்டையையும் வைக்கத் தொடவும்.', actionDone: 'கைகளும் சிறிய கொழுக்கட்டையும் சேர்ந்தன.', confirmation: 'இந்த உண்மையான களிமண் படியை முடித்துவிட்டேன்.' },
    { title: 'கிரீடம், அலங்கார வடிவம்', guidance: 'சிறிய கிரீடத்தைச் சேருங்கள். விரலால் களிமண்ணில் மென்மையான அலங்கார வடிவத்தைப் பதியுங்கள்.', action: 'கிரீடத்தையும் பதித்த வடிவத்தையும் சேர்க்கத் தொடவும்.', actionDone: 'கிரீடமும் வடிவமும் மாதிரியில் உள்ளன.', confirmation: 'இந்த உண்மையான களிமண் படியை முடித்துவிட்டேன்.' },
    { title: 'உலர விடுங்கள்', guidance: 'களிமண் வழிமுறையின்படி உருவத்தை உலர விடுங்கள். வண்ணம் பூசுவதற்கு முன் பெரியவரிடம் கேளுங்கள்.', action: 'முடித்த உருவத்தை உலரும் இடத்தில் வைக்கத் தொடவும்.', actionDone: 'உங்கள் மாதிரி பாதுகாப்பாக உலரத் தயாராக உள்ளது.', confirmation: 'இந்த உண்மையான களிமண் படியை முடித்துவிட்டேன்.' },
  ],
};

type SavedProgress = { actions: boolean[]; confirmations: boolean[]; prepChecks: boolean[] };
const blankProgress = (): SavedProgress => ({ actions: Array(7).fill(false), confirmations: Array(7).fill(false), prepChecks: Array(3).fill(false) });

export function ClayCraftScreen() {
  const colors = useColors();
  const { language } = useAppSettings();
  const ta = language === 'ta';
  const copy = phases[ta ? 'ta' : 'en'];
  const [progress, setProgress] = useState<SavedProgress>(blankProgress);
  const [loaded, setLoaded] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const completed = progress.confirmations.filter(Boolean).length;
  const activeIndex = progress.confirmations.findIndex((done) => !done);
  const finished = activeIndex < 0;
  const index = finished ? 6 : activeIndex;
  const phase = copy[index];
  const prepDone = progress.prepChecks.every(Boolean);
  const actionDone = index === 0 ? prepDone : progress.actions[index];
  const stage = Math.min(7, completed + (actionDone && !finished ? 1 : 0));
  const percent = Math.round((completed / 7) * 100);
  const stageLabel = useMemo(() => ta ? `${completed} / 7 படிகள் முடிந்தன` : `${completed} of 7 phases complete`, [completed, ta]);

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (!mounted) return;
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Partial<SavedProgress>;
          setProgress({
            actions: Array.from({ length: 7 }, (_, i) => Boolean(parsed.actions?.[i])),
            confirmations: Array.from({ length: 7 }, (_, i) => Boolean(parsed.confirmations?.[i])),
            prepChecks: Array.from({ length: 3 }, (_, i) => Boolean(parsed.prepChecks?.[i])),
          });
        } catch {
          setProgress(blankProgress());
        }
      }
    }).catch(() => { if (mounted) setStorageFailed(true); }).finally(() => { if (mounted) setLoaded(true); });
    const motionSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    return () => { mounted = false; motionSubscription.remove(); };
  }, []);

  useEffect(() => {
    if (loaded) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch(() => setStorageFailed(true));
  }, [loaded, progress]);

  const animate = () => {
    if (reduceMotion) return;
    pulse.setValue(0.86);
    Animated.sequence([
      Animated.spring(pulse, { toValue: 1.06, useNativeDriver: Platform.OS !== 'web', speed: 18, bounciness: 9 }),
      Animated.spring(pulse, { toValue: 1, useNativeDriver: Platform.OS !== 'web', speed: 16, bounciness: 5 }),
    ]).start();
  };
  const performAction = () => {
    if (index === 0) return;
    setProgress((current) => ({ ...current, actions: current.actions.map((value, i) => i === index ? true : value) }));
    animate();
  };
  const togglePrep = (checkIndex: number) => {
    setProgress((current) => {
      const prepChecks = current.prepChecks.map((value, i) => i === checkIndex ? !value : value);
      return { ...current, prepChecks, actions: current.actions.map((value, i) => i === 0 ? prepChecks.every(Boolean) : value) };
    });
    animate();
  };
  const confirmPhase = () => {
    if (!actionDone) return;
    setProgress((current) => ({ ...current, actions: current.actions.map((value, i) => i === index ? true : value), confirmations: current.confirmations.map((value, i) => i === index ? true : value) }));
    animate();
  };
  const restart = () => {
    Alert.alert(
      ta ? 'மீண்டும் தொடங்கலாமா?' : 'Start again?',
      ta ? 'இந்தச் சாதனத்தில் சேமித்துள்ள களிமண் செயல் முன்னேற்றம் நீக்கப்படும்.' : 'Your saved craft progress on this device will be cleared.',
      [
        { text: ta ? 'இப்போது வேண்டாம்' : 'Keep progress', style: 'cancel' },
        { text: ta ? 'மீண்டும் தொடங்கு' : 'Reset activity', style: 'destructive', onPress: () => { setProgress(blankProgress()); setStorageFailed(false); } },
      ],
    );
  };

  if (!loaded) {
    return <PageShell title={ta ? 'களிமண் விநாயகர்' : 'Clay Ganesha'}>
      <Card><View style={[styles.loadingLine, { backgroundColor: colors.muted }]} /><View style={[styles.loadingLine, styles.loadingShort, { backgroundColor: colors.muted }]} /></Card>
    </PageShell>;
  }

  return <PageShell
    title={ta ? 'களிமண் விநாயகர்' : 'Clay Ganesha'}
    subtitle={ta ? 'ஒவ்வொரு வடிவத்தையும் மெதுவாக உருவாக்குங்கள்.' : 'Shape each part slowly, one step at a time.'}
  >
    <Card style={styles.progressCard}>
      <View style={styles.progressTop}><Eyebrow>{ta ? 'உங்கள் முன்னேற்றம்' : 'YOUR PROGRESS'}</Eyebrow><AppText testID="craft-progress-status" accessibilityLiveRegion="polite">{stageLabel}</AppText></View>
      <View accessibilityRole="progressbar" accessibilityLabel={stageLabel} accessibilityValue={{ min: 0, max: 7, now: completed }} testID="craft-progress-bar" style={[styles.track, { backgroundColor: colors.muted }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.accent }]} />
      </View>
    </Card>

    <Card style={[styles.artCard, { backgroundColor: colors.secondary }]}>
      <View style={styles.artHeading}><Feather name="sun" size={17} color={colors.foreground} /><AppText style={styles.artCaption}>{finished ? (ta ? 'உங்கள் களிமண் மாதிரி' : 'YOUR CLAY MODEL') : (ta ? 'மெதுவாக உருவாகிறது' : 'TAKING SHAPE')}</AppText></View>
      <Animated.View style={[styles.modelWrap, { transform: [{ scale: pulse }] }]} accessible accessibilityRole="image" accessibilityLabel={ta ? `${completed} படிகளுடன் வளர்ந்துவரும் களிமண் விநாயகர் மாதிரி` : `Clay Ganesha model showing ${stage} completed craft parts`}>
        <ClayModel stage={stage} colors={colors} />
      </Animated.View>
      <AppText style={styles.modelCaption}>{ta ? 'திரையில் உள்ள மாதிரி ஒரு வழிகாட்டி மட்டுமே.' : 'The on-screen model is only a guide.'}</AppText>
    </Card>

    {finished ? (
      <Card style={[styles.finishCard, { borderColor: colors.accent }]}>
        <View style={[styles.finishMark, { backgroundColor: colors.accent }]}><Feather name="check" size={24} color={colors.foreground} /></View>
        <Text style={[styles.finishTitle, { color: colors.foreground }]}>{ta ? 'அருமையாக முடித்தீர்கள்!' : 'A thoughtful finish.'}</Text>
        <AppText>{ta ? 'உங்கள் உருவத்தை களிமண் வழிமுறையின்படி உலர விடுங்கள். வண்ணம் பூச பெரியவரிடம் கேளுங்கள்.' : 'Let your figure dry according to the clay instructions. Ask a grown-up before painting.'}</AppText>
        <Notice>{ta ? 'செயலியை மீண்டும் தொடங்கினால் உங்கள் முன்னேற்றம் அழிக்கப்படும்.' : 'This app cannot verify whether any real clay work was done.'}</Notice>
      </Card>
    ) : (
      <Card style={styles.phaseCard}>
        <View style={styles.phaseTop}>
          <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}><Text style={[styles.number, { color: colors.foreground }]}>{index + 1}</Text></View>
          <View style={styles.phaseTitleBlock}><Eyebrow>{ta ? `படி ${index + 1} / 7` : `PHASE ${index + 1} OF 7`}</Eyebrow><Text style={[styles.phaseTitle, { color: colors.foreground }]}>{phase.title}</Text></View>
        </View>
        <AppText>{phase.guidance}</AppText>
        <View style={[styles.actionPanel, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Eyebrow>{ta ? 'திரைச் செயல்' : 'ON-SCREEN MINI ACTION'}</Eyebrow>
          <AppText>{actionDone ? phase.actionDone : phase.action}</AppText>
          {index === 0 && phase.checklist ? phase.checklist.map((label, i) => {
            const checked = progress.prepChecks[i];
            return <Pressable key={label} accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={label} testID={`craft-prep-check-${i + 1}`} onPress={() => togglePrep(i)} style={[styles.checkRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <View style={[styles.checkBox, { borderColor: checked ? colors.accent : colors.border, backgroundColor: checked ? colors.accent : 'transparent' }]}>{checked && <Feather name="check" size={15} color={colors.foreground} />}</View>
              <AppText style={styles.checkLabel}>{label}</AppText>
            </Pressable>;
          }) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={actionDone ? phase.actionDone : phase.action}
              accessibilityState={{ disabled: actionDone, selected: actionDone }}
              disabled={actionDone}
              testID="craft-mini-action"
              onPress={performAction}
              style={({ pressed }) => [styles.actionButton, { backgroundColor: actionDone ? colors.accent : colors.primary, opacity: pressed ? 0.78 : 1 }]}
            >
              <Animated.View style={{ transform: [{ scale: pulse }] }}><Feather name={actionDone ? 'check-circle' : 'droplet'} size={23} color={colors.foreground} /></Animated.View>
              <Text style={[styles.actionButtonText, { color: colors.foreground }]}>{actionDone ? (ta ? 'வடிவம் சேர்ந்தது' : 'Part added to model') : (ta ? 'தொடங்கி வடிவமை' : 'Shape this part')}</Text>
            </Pressable>
          )}
          {actionDone && <View accessibilityLiveRegion="polite" testID="craft-mini-action-status" style={styles.feedback}><Feather name="check-circle" size={17} color={colors.accent} /><AppText style={styles.feedbackText}>{phase.actionDone}</AppText></View>}
        </View>

        <View style={[styles.realStep, { borderColor: colors.border }]}>
          <View style={styles.confirmTitle}><Feather name="check-circle" size={17} color={colors.primary} /><Eyebrow>{ta ? 'உண்மையான களிமண் செயல்' : 'REAL CLAY STEP'}</Eyebrow></View>
          <AppText>{ta ? 'இந்தச் செயலி உங்கள் உண்மையான களிமண் வேலையைச் சரிபார்க்க முடியாது.' : 'This app cannot verify your physical clay work.'}</AppText>
          <PrimaryButton
            label={ta ? 'இந்த உண்மையான படியை முடித்தேன்' : 'I finished this real-clay phase'}
            icon="check"
            disabled={!actionDone}
            onPress={confirmPhase}
            testID="craft-confirm-real-phase"
          />
        </View>
      </Card>
    )}

    <Card style={styles.safetyCard}>
      <View style={styles.safetyHeading}><Feather name="shield" size={18} color={colors.foreground} /><Text style={[styles.safetyTitle, { color: colors.foreground }]}>{ta ? 'பாதுகாப்பும் மரியாதையும்' : 'Safety & respect'}</Text></View>
      <AppText>{ta
        ? 'களிமண்ணைச் சாப்பிட வேண்டாம். கூர்மையான கருவிகள் வேண்டாம். பொருட்கள் அல்லது வண்ணத்திற்கு பெரியவரிடம் கேளுங்கள். புனித உருவத்தைச் செய்யும்போதும் கையாளும்போதும் குடும்ப வழிகாட்டுதலைப் பின்பற்றுங்கள்.'
        : 'Do not eat clay. Use no sharp tools. Ask an adult for materials or paint. Follow your family’s guidance when making or handling a sacred figure.'}</AppText>
    </Card>

    <Card style={styles.privacyCard}>
      <Feather name="smartphone" size={16} color={colors.mutedForeground} />
      <AppText style={styles.privacyText}>{ta ? 'முன்னேற்றம் இந்தச் சாதனத்தில் மட்டும் சேமிக்கப்படுகிறது; எங்கும் அனுப்பப்படாது.' : 'Progress is saved only on this device. No personal data is collected.'}</AppText>
      {storageFailed && <Notice tone="error">{ta ? 'முன்னேற்றத்தைச் சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' : 'Progress could not be saved on this device.'}</Notice>}
      <PrimaryButton label={ta ? 'பாதுகாப்பாக மீண்டும் தொடங்கு' : 'Safely restart activity'} icon="refresh-cw" secondary onPress={restart} testID="craft-restart" />
    </Card>
  </PageShell>;
}

function ClayModel({ stage, colors }: { stage: number; colors: ReturnType<typeof useColors> }) {
  const clay = colors.destructive;
  const shade = colors.primary;
  return <Svg width="100%" height="220" viewBox="0 0 300 220" accessibilityLabel="A small clay Ganesha being built step by step">
    <Ellipse cx="150" cy="195" rx="94" ry="13" fill={colors.foreground} opacity=".08" />
    {stage >= 2 && <>
      <Path d="M98 174 Q150 146 202 174 L195 190 Q150 202 105 190 Z" fill={shade} stroke={colors.foreground} strokeWidth="2.5" />
      <Ellipse cx="150" cy="137" rx="49" ry="48" fill={clay} stroke={colors.foreground} strokeWidth="2.5" />
      <Ellipse cx="133" cy="122" rx="14" ry="8" fill="white" opacity=".24" />
    </>}
    {stage >= 3 && <>
      <Ellipse cx="150" cy="75" rx="33" ry="31" fill={clay} stroke={colors.foreground} strokeWidth="2.5" />
      <Ellipse cx="106" cy="79" rx="17" ry="25" fill={clay} stroke={colors.foreground} strokeWidth="2.5" />
      <Ellipse cx="194" cy="79" rx="17" ry="25" fill={clay} stroke={colors.foreground} strokeWidth="2.5" />
      <Ellipse cx="150" cy="77" rx="12" ry="15" fill={shade} opacity=".48" />
      <Circle cx="137" cy="70" r="2.7" fill={colors.foreground} />
      <Circle cx="163" cy="70" r="2.7" fill={colors.foreground} />
    </>}
    {stage >= 4 && <Path d="M150 84 C143 100 159 107 153 121 C149 131 140 131 137 126" fill="none" stroke={clay} strokeWidth="13" strokeLinecap="round" />}
    {stage >= 5 && <>
      <Path d="M108 124 Q83 126 84 151 Q86 163 104 157" fill="none" stroke={clay} strokeWidth="13" strokeLinecap="round" />
      <Path d="M192 124 Q217 126 216 151 Q214 163 196 157" fill="none" stroke={clay} strokeWidth="13" strokeLinecap="round" />
      <Ellipse cx="207" cy="145" rx="11" ry="9" fill={shade} stroke={colors.foreground} strokeWidth="1.8" />
      <Path d="M200 143 Q207 132 214 143" fill={shade} stroke={colors.foreground} strokeWidth="1.5" />
    </>}
    {stage >= 6 && <>
      <Path d="M126 51 L132 31 L143 43 L150 25 L158 43 L170 31 L175 52 Z" fill={shade} stroke={colors.foreground} strokeWidth="2.5" strokeLinejoin="round" />
      <Circle cx="150" cy="39" r="3.5" fill={clay} />
      <Circle cx="133" cy="54" r="2.5" fill={shade} />
      <Circle cx="167" cy="54" r="2.5" fill={shade} />
      <Path d="M131 144 Q150 155 169 144 M136 158 Q150 166 164 158" fill="none" stroke={shade} strokeWidth="3" strokeLinecap="round" />
      <Circle cx="150" cy="147" r="3" fill={shade} />
    </>}
    {stage >= 7 && <Rect x="83" y="187" width="134" height="7" rx="3.5" fill={colors.accent} opacity=".85" />}
    {stage < 2 && <>
      <Path d="M104 177 Q150 159 196 177 L190 188 Q150 198 110 188 Z" fill={shade} stroke={colors.foreground} strokeWidth="2.5" />
      <Circle cx="150" cy="139" r="33" fill={clay} stroke={colors.foreground} strokeWidth="2.5" />
      <Circle cx="139" cy="128" r="7" fill="white" opacity=".24" />
    </>}
  </Svg>;
}

const styles = StyleSheet.create({
  progressCard: { gap: 10 },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  track: { height: 9, borderRadius: 9, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 9 },
  artCard: { padding: 14, gap: 5, borderWidth: 0 },
  artHeading: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 3 },
  artCaption: { fontFamily: 'DMSans_700Bold', fontSize: 11, letterSpacing: 1.1 },
  modelWrap: { height: 220, alignItems: 'center', justifyContent: 'center' },
  modelCaption: { textAlign: 'center', fontSize: 12, opacity: .82 },
  phaseCard: { gap: 15 },
  phaseTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  numberBadge: { width: 43, height: 43, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  number: { fontFamily: 'Nunito_900Black', fontSize: 22 },
  phaseTitleBlock: { flex: 1, gap: 3 },
  phaseTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 22, lineHeight: 28 },
  actionPanel: { padding: 14, borderRadius: 18, borderWidth: 1, gap: 10 },
  actionButton: { minHeight: 58, borderRadius: 16, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  actionButtonText: { fontFamily: 'DMSans_700Bold', fontSize: 14, textAlign: 'center', flexShrink: 1 },
  checkRow: { minHeight: 48, borderRadius: 13, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkBox: { width: 25, height: 25, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { flex: 1, fontSize: 14 },
  feedback: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  feedbackText: { flex: 1, fontSize: 13 },
  realStep: { borderTopWidth: 1, paddingTop: 14, gap: 10 },
  confirmTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  safetyCard: { gap: 9 },
  safetyHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  safetyTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18 },
  privacyCard: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  privacyText: { flex: 1, minWidth: '75%', fontSize: 13 },
  finishCard: { alignItems: 'flex-start', borderWidth: 1.5 },
  finishMark: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  finishTitle: { fontFamily: 'Nunito_900Black', fontSize: 25 },
  loadingLine: { height: 15, borderRadius: 8, width: '88%' },
  loadingShort: { width: '55%' },
});
