import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ComponentProps, ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { copy } from './i18n';
import { useAppSettings } from './settings';
import { useDemoAuth } from './auth';
import { useRouter } from 'expo-router';

type FeatherName = ComponentProps<typeof Feather>['name'];

export function PageShell({
  children,
  title,
  subtitle,
  keyboardAware = false,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  keyboardAware?: boolean;
}) {
  const colors = useColors();
  const { language, setLanguage } = useAppSettings();
  const { signOut } = useDemoAuth();
  const router = useRouter();
  const t = copy[language];
  const content = (
    <>
      <View style={[styles.topbar, Platform.OS === 'web' && styles.webTopInset]}>
        <View style={styles.brand}>
          <Image source={require('../assets/images/icon.png')} style={styles.brandMark} accessibilityLabel="ToddleBee bee mark" />
          <Text style={[styles.brandText, { color: colors.foreground }]}>
            <Text>Toddle</Text><Text style={{ color: colors.primary }}>Bee</Text>
          </Text>
        </View>
        <View style={styles.topActions}>
        <View style={[styles.languageSwitch, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Use English" accessibilityState={{ selected: language === 'en' }} onPress={() => setLanguage('en')} style={[styles.languageButton, language === 'en' && { backgroundColor: colors.foreground }]}>
            <Text style={[styles.languageText, { color: language === 'en' ? colors.background : colors.foreground }]}>EN</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="தமிழில் கற்க" accessibilityState={{ selected: language === 'ta' }} onPress={() => setLanguage('ta')} style={[styles.languageButton, language === 'ta' && { backgroundColor: colors.foreground }]}>
            <Text style={[styles.languageText, { color: language === 'ta' ? colors.background : colors.foreground }]}>தமிழ்</Text>
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={language === 'ta' ? 'வெளியேறு' : 'Sign out'} testID="button-sign-out" onPress={() => { signOut(); router.replace('/login'); }} style={[styles.signOut, { borderColor: colors.border, backgroundColor: colors.card }]}><Feather name="log-out" size={17} color={colors.foreground} /><Text style={[styles.signOutText, { color: colors.foreground }]}>{language === 'ta' ? 'வெளியேறு' : 'Sign out'}</Text></Pressable>
        </View>
      </View>
      {title && <View style={styles.pageHeading}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle && <Text style={[styles.body, { color: colors.mutedForeground }]}>{subtitle}</Text>}
      </View>}
      {children}
    </>
  );
  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.background }]}>
      {keyboardAware ? (
        <KeyboardAwareScrollViewCompat
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          bottomOffset={72}
          showsVerticalScrollIndicator={false}
        >{content}</KeyboardAwareScrollViewCompat>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >{content}</ScrollView>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }, style]}>{children}</View>;
}

export function AppText({ children, style, ...props }: ComponentProps<typeof Text>) {
  const colors = useColors();
  return <Text {...props} style={[styles.body, { color: colors.foreground }, style]}>{children}</Text>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  const colors = useColors();
  return <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{children}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  secondary = false,
  disabled = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  icon?: FeatherName;
  secondary?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      testID={testID}
      onPress={() => {
        if (disabled) return;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: secondary ? colors.card : colors.primary,
          borderColor: secondary ? colors.border : colors.primary,
          opacity: disabled ? 0.55 : pressed ? 0.82 : 1,
        },
      ]}
    >
      {icon && <Feather name={icon} size={18} color={colors.foreground} />}
      <Text style={[styles.buttonText, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' | 'success' }) {
  const colors = useColors();
  const background = tone === 'error' ? `${colors.destructive}22` : tone === 'success' ? `${colors.accent}22` : colors.secondary;
  return <View accessibilityLiveRegion="polite" style={[styles.notice, { backgroundColor: background, borderColor: colors.border }]}><AppText>{children}</AppText></View>;
}

export function LoadingCard({ label }: { label: string }) {
  const colors = useColors();
  return <Card><View style={styles.loadingRow}><Feather name="loader" size={20} color={colors.primary} /><AppText>{label}</AppText></View></Card>;
}

export function FractionVisual({ visual }: { visual: string }) {
  const colors = useColors();
  const filled = colors.primary;
  const empty = colors.secondary;
  const stroke = colors.foreground;
  const cells = (count: number, shaded: number, shape: 'square' | 'round' = 'square') =>
    <View style={styles.visualRow}>{Array.from({ length: count }, (_, index) => <View key={index} style={{ width: 44, height: 44, borderRadius: shape === 'round' ? 24 : 10, backgroundColor: index < shaded ? filled : empty, borderWidth: 1.5, borderColor: stroke }} />)}</View>;
  if (visual === 'equivalent') {
    return <View accessibilityLabel="A half is the same as two fourths" style={styles.visualStack}>
      <AppText style={styles.visualLabel}>1/2</AppText>{cells(2, 1)}
      <AppText style={styles.visualLabel}>2/4</AppText>{cells(4, 2)}
    </View>;
  }
  if (visual === 'chocolate') {
    return <View accessibilityLabel="A chocolate bar with six equal pieces" style={styles.visualStack}>{cells(6, 3)}<AppText style={styles.visualLabel}>3/6</AppText></View>;
  }
  return <View accessibilityLabel={visual === 'orange' ? 'Two of four equal parts are shaded' : 'One of four equal parts is shaded'} style={styles.visualStack}>
    {cells(4, visual === 'orange' ? 2 : 1, 'round')}
    <AppText style={styles.visualLabel}>{visual === 'orange' ? '2/4' : '1/4'}</AppText>
  </View>;
}

export function ProgressDots({ current, total }: { current: number; total: number }) {
  const colors = useColors();
  return <View accessibilityLabel={`${copy.en.section} ${current} ${copy.en.of} ${total}`} style={styles.dots}>{Array.from({ length: total }, (_, index) => <View key={index} style={[styles.dot, { backgroundColor: index < current ? colors.primary : colors.border }]} />)}</View>;
}

export function MetricCard({ label, value, icon }: { label: string; value: string | number; icon: FeatherName }) {
  const colors = useColors();
  return <Card style={styles.metricCard}><View style={[styles.metricIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={18} color={colors.foreground} /></View><Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text><AppText style={styles.metricLabel}>{label}</AppText></Card>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 118, gap: 16 },
  topbar: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  webTopInset: { paddingTop: 67 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 34, height: 34, borderRadius: 10 },
  brandText: { fontFamily: 'Nunito_900Black', fontSize: 22 },
  languageSwitch: { flexDirection: 'row', borderWidth: 1, borderRadius: 24, padding: 3 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  signOut: { minHeight: 36, borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  signOutText: { fontFamily: 'DMSans_700Bold', fontSize: 11 },
  languageButton: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20 },
  languageText: { fontFamily: 'DMSans_700Bold', fontSize: 12 },
  pageHeading: { gap: 5, marginTop: 4 },
  pageTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 27, lineHeight: 34 },
  body: { fontFamily: 'DMSans_400Regular', fontSize: 15, lineHeight: 23 },
  eyebrow: { fontFamily: 'DMSans_700Bold', textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11 },
  card: { borderWidth: 1, padding: 17, gap: 12 },
  button: { minHeight: 52, borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  buttonText: { fontFamily: 'DMSans_700Bold', fontSize: 15, textAlign: 'center' },
  notice: { borderWidth: 1, borderRadius: 14, padding: 13 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  visualStack: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 8 },
  visualRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  visualLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17 },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 6, flex: 1, maxWidth: 42, borderRadius: 6 },
  metricCard: { flex: 1, minWidth: '44%', gap: 6 },
  metricIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontFamily: 'Nunito_900Black', fontSize: 24 },
  metricLabel: { fontSize: 12, lineHeight: 17 },
});
