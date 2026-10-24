import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText, Card, Notice, PrimaryButton } from './components';
import { useAppSettings } from './settings';
import { useDemoAuth } from './auth';
import { useColors } from '@/hooks/useColors';

export function LoginScreen() {
  const colors = useColors();
  const { language, setLanguage } = useAppSettings();
  const { signIn } = useDemoAuth();
  const ta = language === 'ta';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  return <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
    <View style={styles.wrap}>
      <View style={styles.top}>
        <View style={styles.brand}><Feather name="sun" size={25} color={colors.primary} /><Text style={[styles.brandText, { color: colors.foreground }]}>Toddle<Text style={{ color: colors.primary }}>Bee</Text></Text></View>
        <View style={[styles.languageSwitch, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {(['en', 'ta'] as const).map((lang) => <Pressable key={lang} accessibilityRole="button" accessibilityState={{ selected: language === lang }} testID={`login-language-${lang}`} onPress={() => setLanguage(lang)} style={[styles.languageButton, language === lang && { backgroundColor: colors.foreground }]}><Text style={{ color: language === lang ? colors.background : colors.foreground, fontFamily: 'DMSans_700Bold' }}>{lang === 'en' ? 'EN' : 'தமிழ்'}</Text></Pressable>)}
        </View>
      </View>
      <View style={styles.heading}><Text style={[styles.title, { color: colors.foreground }]}>{ta ? 'வணக்கம், மீண்டும் வந்ததற்கு மகிழ்ச்சி' : 'A little learning, together.'}</Text><AppText>{ta ? 'ToddleBee செயல்விளக்கத்தில் தொடர உள்நுழைக.' : 'Sign in to explore the ToddleBee demo.'}</AppText></View>
      <Card>
        <Text style={[styles.label, { color: colors.foreground }]}>{ta ? 'பயனர் பெயர்' : 'Username'}</Text>
        <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} accessibilityLabel="Username" placeholder={ta ? 'பயனர் பெயர்' : 'Enter username'} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} testID="login-username" />
        <Text style={[styles.label, { color: colors.foreground }]}>{ta ? 'கடவுச்சொல்' : 'Password'}</Text>
        <View style={[styles.passwordRow, { borderColor: colors.border, backgroundColor: colors.background }]}><TextInput value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" accessibilityLabel="Password" placeholder={ta ? 'கடவுச்சொல்' : 'Enter password'} placeholderTextColor={colors.mutedForeground} style={[styles.passwordInput, { color: colors.foreground }]} testID="login-password" /><Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} testID="login-password-visibility" onPress={() => setShowPassword((shown) => !shown)}><Feather name={showPassword ? 'eye-off' : 'eye'} size={19} color={colors.mutedForeground} /></Pressable></View>
        {error && <Notice tone="error">{ta ? 'பயனர் பெயர் அல்லது கடவுச்சொல் சரியில்லை.' : 'That username or password did not match.'}</Notice>}
        <PrimaryButton label={ta ? 'தொடர உள்நுழைக' : 'Sign in to continue'} icon="arrow-right" onPress={() => { const ok = signIn(username, password); setError(!ok); if (ok) setPassword(''); }} testID="login-submit" />
      </Card>
      <Card style={{ backgroundColor: colors.secondary }}>
        <Text style={[styles.hintTitle, { color: colors.foreground }]}>{ta ? 'செயல்விளக்க உள்நுழைவு' : 'Demo credentials'}</Text>
        <AppText>{ta ? 'பயனர் பெயர்: test   ·   கடவுச்சொல்: test' : 'Username: test   ·   Password: test'}</AppText>
      </Card>
      <Notice>{ta ? 'இது பொதுச் செயல்விளக்கத்திற்கான கதவு மட்டுமே; உண்மையான பாதுகாப்பு அல்ல. கற்றவர்களின் உண்மையான தரவு அல்லது கட்டணப் பரிவர்த்தனைகளைப் பாதுகாக்க இதைப் பயன்படுத்த வேண்டாம்.' : 'This public demo gate is NOT real security. Never use it to protect real learner data or payment flows.'}</Notice>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  wrap: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 18, justifyContent: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandText: { fontFamily: 'Nunito_900Black', fontSize: 23 },
  languageSwitch: { flexDirection: 'row', padding: 3, borderWidth: 1, borderRadius: 22, gap: 2 },
  languageButton: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 18 },
  heading: { gap: 8, marginTop: 12 },
  title: { fontFamily: 'Nunito_900Black', fontSize: 31, lineHeight: 38 },
  label: { fontFamily: 'DMSans_700Bold', fontSize: 14 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontFamily: 'DMSans_400Regular', fontSize: 16 },
  passwordRow: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, minHeight: 48, fontFamily: 'DMSans_400Regular', fontSize: 16 },
  hintTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18 },
});
