import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  getGetLearningProgressQueryKey,
  useCreateDemoCheckout,
  useCreateLearningSession,
  useDecideEducatorReview,
  useExplainConcept,
  useGetAgentActivity,
  useGetFractionsLesson,
  useGetLearningProgress,
  useHealthCheck,
  useListEducatorReviews,
  useListLessons,
  useListNarrationVoices,
  useListQuizQuestions,
  useRecordLearningEvent,
  useSpeakExplanation,
  useSubmitQuizAnswer,
} from '@workspace/api-client-react';
import type { QuizAnswerResult } from '@workspace/api-client-react';
import { AppText, Card, Eyebrow, FractionVisual, LoadingCard, MetricCard, Notice, PageShell, PrimaryButton, ProgressDots } from './components';
import { copy, offlineLessons } from './i18n';
import { useAppSettings } from './settings';
import { useColors } from '@/hooks/useColors';

export function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language, age, setAge, sessionId, setSession, ready, storageError } = useAppSettings();
  const t = copy[language];
  const health = useHealthCheck();
  const lessons = useListLessons();
  const createSession = useCreateLearningSession();
  const [error, setError] = useState('');

  const start = async () => {
    setError('');
    try {
      const session = await createSession.mutateAsync({ data: { language, grade: 4, age } });
      await setSession(session.id, session.isSample);
      router.push('/learn');
    } catch {
      setError(t.startError);
    }
  };

  return <PageShell>
    <Card style={[styles.heroCard, { backgroundColor: colors.background }]}>
      <Eyebrow>{t.heroEyebrow}</Eyebrow>
      <Text style={[styles.heroTitle, { color: colors.foreground }]}>{t.headline}</Text>
      <AppText>{t.heroBody}</AppText>
      <View style={styles.ageRow}>
        <AppText>{t.age}</AppText>
        <View style={[styles.ageControl, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Decrease age" disabled={age <= 8} onPress={() => setAge(age - 1)} style={styles.ageButton}><AppText style={styles.ageSign}>−</AppText></Pressable>
          <Text style={[styles.ageValue, { color: colors.foreground }]}>{age}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Increase age" disabled={age >= 12} onPress={() => setAge(age + 1)} style={styles.ageButton}><AppText style={styles.ageSign}>+</AppText></Pressable>
        </View>
      </View>
      <AppText style={styles.gradeLabel}>{t.gradeFour}</AppText>
      <PrimaryButton label={createSession.isPending ? t.loading : t.startLearning} icon="arrow-right" disabled={createSession.isPending || !ready} onPress={() => void start()} testID="button-start-learning" />
      <PrimaryButton label={language === 'ta' ? 'களிமண் விநாயகர் உருவாக்கம்' : 'Make a clay Ganesha'} icon="star" secondary onPress={() => router.push('/craft')} testID="button-home-craft" />
      <PrimaryButton label={language === 'ta' ? 'களிமண் தாமரை உருவாக்கம்' : 'Make a clay lotus'} icon="feather" secondary onPress={() => router.push('/craft-lotus')} testID="button-home-craft-lotus" />
      {sessionId && <PrimaryButton label={t.continueLearning} icon="book-open" secondary onPress={() => router.push('/learn')} testID="button-continue-learning" />}
      <PrimaryButton label={t.sampleLesson} icon="eye" secondary onPress={() => router.push('/learn')} testID="button-sample-lesson" />
      {!!error && <Notice tone="error">{error}</Notice>}
      {storageError && <Notice tone="error">Settings could not be saved on this device.</Notice>}
    </Card>

    <Card>
      <Eyebrow>{t.learnerSetup}</Eyebrow>
      <AppText>{t.learnerSetupBody}</AppText>
      <View style={styles.serviceRow}>
        <View style={[styles.statusDot, { backgroundColor: health.data?.status === 'ok' ? colors.accent : colors.destructive }]} />
        <AppText>{health.isLoading ? t.checking : health.isError ? t.serviceUnavailable : `${t.learningService}: ${t.ready}`}</AppText>
      </View>
      {!!lessons.data?.length && <AppText style={styles.smallText}>{lessons.data.length} {t.lessonsAvailable}</AppText>}
      <AppText style={styles.smallText}>{t.privacyNote}</AppText>
    </Card>

    <View style={styles.sectionTitleRow}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.benefitsTitle}</Text></View>
    {[
      [t.languageBenefit, t.languageBenefitBody],
      [t.paceBenefit, t.paceBenefitBody],
      [t.progressBenefit, t.progressBenefitBody],
      [t.humanBenefit, t.humanBenefitBody],
    ].map(([title, body]) => <Card key={title}><View style={styles.benefitHead}><AppText style={styles.benefitTitle}>{title}</AppText></View><AppText>{body}</AppText></Card>)}
  </PageShell>;
}

export function LessonScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language, sessionId } = useAppSettings();
  const t = copy[language];
  const query = useGetFractionsLesson({ language });
  const recordEvent = useRecordLearningEvent();
  const explain = useExplainConcept();
  const voices = useListNarrationVoices();
  const speak = useSpeakExplanation({ request: { responseType: 'blob' } });
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);
  const [index, setIndex] = useState(0);
  const [alternative, setAlternative] = useState('');
  const [done, setDone] = useState(false);
  const [audioMode, setAudioMode] = useState<'elevenlabs' | 'device' | null>(null);
  const [audioBusy, setAudioBusy] = useState(false);
  const [audioNotice, setAudioNotice] = useState('');
  const [error, setError] = useState('');
  const sections = useMemo(() => query.data?.sections?.length ? [...query.data.sections].sort((a, b) => a.order - b.order) : offlineLessons[language], [query.data, language]);
  const section = sections[Math.min(index, sections.length - 1)];
  const description = alternative || section?.explanation || '';
  const childVoice = voices.data?.voices?.find((voice) => voice.childFriendly && voice.language.toLowerCase().startsWith(language));

  useEffect(() => {
    Speech.stop();
    player.pause();
    setAudioMode(null);
    setAudioNotice('');
    setAlternative('');
  }, [language, player]);

  const playDeviceVoice = async (text: string) => {
    try {
      const available = await Speech.getAvailableVoicesAsync();
      const languageVoice = available.find((voice) => voice.language.toLowerCase().startsWith(language));
      if (language === 'ta' && !languageVoice) {
        setAudioNotice(t.voiceTamilMissing);
        setAudioMode(null);
        return;
      }
      setAudioMode('device');
      setAudioNotice(t.voiceDevice);
      Speech.speak(text, {
        language: language === 'ta' ? languageVoice?.language : languageVoice?.language ?? 'en-IN',
        rate: 0.96,
        pitch: 1.08,
        onDone: () => setAudioMode(null),
        onStopped: () => setAudioMode(null),
        onError: () => { setAudioMode(null); setAudioNotice(t.voiceError); },
      });
    } catch {
      setAudioNotice(t.voiceUnavailable);
      setAudioMode(null);
    }
  };

  const listen = async () => {
    setAudioNotice('');
    if (!childVoice || !voices.data?.available) {
      await playDeviceVoice(description);
      return;
    }
    setAudioBusy(true);
    try {
      const audio = await speak.mutateAsync({ data: { text: description, language, voiceId: childVoice.id } });
      const bytes = new Uint8Array(await audio.arrayBuffer());
      let binary = '';
      for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
      }
      const directory = FileSystem.cacheDirectory;
      if (!directory) throw new Error('Audio cache unavailable');
      const fileUri = `${directory}toddlebee-${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(fileUri, btoa(binary), { encoding: FileSystem.EncodingType.Base64 });
      await setAudioModeAsync({ playsInSilentMode: true });
      player.replace({ uri: fileUri });
      player.play();
      setAudioMode('elevenlabs');
      setAudioNotice(`${t.voiceEleven} · ${childVoice.name}`);
    } catch {
      setAudioNotice(t.voiceError);
      await playDeviceVoice(description);
    } finally {
      setAudioBusy(false);
    }
  };

  const toggleAudio = async () => {
    if (audioMode === 'elevenlabs') {
      if (playerStatus.playing) player.pause();
      else player.play();
    } else if (audioMode === 'device') {
      const speaking = await Speech.isSpeakingAsync();
      if (speaking) await Speech.pause();
      else await Speech.resume();
    } else {
      void listen();
    }
  };

  const showAnotherWay = async () => {
    setError('');
    if (!sessionId) {
      setAlternative(section.alternative);
      setAudioNotice(t.samplePreview);
      return;
    }
    try {
      const result = await explain.mutateAsync({ data: { sessionId, sectionId: section.id, language } });
      setAlternative(result.explanation);
      recordEvent.mutate({ id: sessionId, data: { type: 'alternative_explanation', sectionId: section.id, language } });
    } catch {
      setAlternative(section.alternative);
      setError(t.explanationFallback);
    }
  };

  const advance = () => {
    if (sessionId) recordEvent.mutate({ id: sessionId, data: { type: 'section_completed', sectionId: section.id, language } });
    setAlternative('');
    if (index < sections.length - 1) setIndex((current) => current + 1);
    else {
      setDone(true);
      if (sessionId) recordEvent.mutate({ id: sessionId, data: { type: 'lesson_completed', language } });
    }
  };

  if (query.isLoading && !section) return <PageShell title={t.lessonTitle}><LoadingCard label={t.loading} /></PageShell>;
  if (done) return <PageShell title={t.lessonComplete} subtitle={t.lessonCompleteBody}>
    <Card style={{ alignItems: 'center' }}><FractionVisual visual="equivalent" /><PrimaryButton label={t.goToPractice} icon="arrow-right" onPress={() => router.push('/practice')} testID="button-go-practice" /></Card>
  </PageShell>;

  return <PageShell title={t.lessonTitle} subtitle={t.lessonIntro}>
    {!sessionId && <Notice>{t.samplePreview}</Notice>}
    {query.isError && <Notice>{t.offlineLesson}</Notice>}
    <Card>
      <View style={styles.lessonMeta}><Eyebrow>{t.section} {index + 1} {t.of} {sections.length}</Eyebrow><ProgressDots current={index + 1} total={sections.length} /></View>
      <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{section.title}</Text>
      <AppText>{description}</AppText>
      <View style={[styles.visualPanel, { backgroundColor: colors.background }]}><FractionVisual visual={section.visual} /></View>
      <View style={styles.buttonStack}>
        <PrimaryButton label={language === 'ta' ? 'களிமண் விநாயகர் உருவாக்கம்' : 'Try the clay Ganesha activity'} icon="star" secondary onPress={() => router.push('/craft')} testID="button-lesson-craft" />
        <PrimaryButton label={audioBusy ? t.audioLoading : t.listen} icon="volume-2" disabled={audioBusy} onPress={() => void listen()} testID="button-listen" />
        {audioMode && <PrimaryButton label={audioMode === 'elevenlabs' && playerStatus.playing || audioMode === 'device' ? t.pause : t.resume} icon={audioMode === 'elevenlabs' && playerStatus.playing || audioMode === 'device' ? 'pause' : 'play'} secondary onPress={toggleAudio} testID="button-audio-toggle" />}
        <PrimaryButton label={t.explainAnother} icon="refresh-cw" secondary disabled={explain.isPending} onPress={() => void showAnotherWay()} testID="button-explain-another" />
        <PrimaryButton label={index === sections.length - 1 ? t.finishLesson : t.understand} icon="check" onPress={advance} testID="button-understood" />
      </View>
      {audioNotice ? <Notice>{audioNotice}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {voices.data?.available && childVoice && <AppText style={styles.smallText}>{t.voiceEleven} · {childVoice.name}</AppText>}
    </Card>
  </PageShell>;
}

export function QuizScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { language, sessionId, sessionIds } = useAppSettings();
  const t = copy[language];
  const questionsQuery = useListQuizQuestions({ language });
  const submitAnswer = useSubmitQuizAnswer();
  const recordEvent = useRecordLearningEvent();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<QuizAnswerResult | null>(null);
  const [error, setError] = useState('');
  const questionStarted = useRef(Date.now());
  const questions = questionsQuery.data ?? [];
  const item = questions[index];

  const submit = async () => {
    if (!selected) { setError(t.selectAnswer); return; }
    if (!sessionId || !item) return;
    setError('');
    try {
      const answer = await submitAnswer.mutateAsync({
        data: {
          sessionId,
          questionId: item.id,
          selectedAnswerId: selected,
          hintUsed,
          responseTimeMs: Math.max(0, Date.now() - questionStarted.current),
        },
      });
      setResult(answer);
      await queryClient.invalidateQueries({ queryKey: getGetLearningProgressQueryKey({ sessionIds: sessionIds.join(',') }) });
    } catch {
      setError(t.answerError);
    }
  };

  const next = () => {
    if (result?.nextAction === 'retry' || result?.nextAction === 'try_visual') {
      setSelected('');
      setResult(null);
      setShowHint(false);
      setHintUsed(false);
      questionStarted.current = Date.now();
      return;
    }
    setIndex((current) => current + 1);
    setSelected('');
    setResult(null);
    setShowHint(false);
    setHintUsed(false);
    questionStarted.current = Date.now();
  };

  if (!sessionId) return <PageShell title={t.quizTitle} subtitle={t.quizIntro}>
    <Notice>{t.startSessionForQuiz}</Notice><PrimaryButton label={t.home} icon="home" onPress={() => router.push('/')} />
  </PageShell>;
  if (questionsQuery.isLoading) return <PageShell title={t.quizTitle}><LoadingCard label={t.loading} /></PageShell>;
  if (questionsQuery.isError) return <PageShell title={t.quizTitle} subtitle={t.quizIntro}>
    <Notice tone="error">{t.quizLoadError}</Notice><PrimaryButton label={t.retry} icon="refresh-cw" secondary onPress={() => void questionsQuery.refetch()} />
  </PageShell>;
  if (index >= questions.length) return <PageShell title={t.quizComplete} subtitle={t.quizCompleteBody}>
    <Card><Text style={[styles.heroTitle, { color: colors.foreground }]}>5 / 5</Text><AppText>{t.quizCompleteBody}</AppText><PrimaryButton label={t.progress} icon="trending-up" onPress={() => router.push('/progress')} /></Card>
  </PageShell>;

  return <PageShell title={t.quizTitle} subtitle={t.quizIntro}>
    <Card>
      <View style={styles.lessonMeta}><Eyebrow>{t.question} {index + 1} {t.of} {questions.length}</Eyebrow><ProgressDots current={index} total={questions.length} /></View>
      <Text style={[styles.questionText, { color: colors.foreground }]}>{item.prompt}</Text>
      <View style={styles.answers}>
        {item.options.map((option, optionIndex) => {
          const isSelected = selected === option.id;
          return <Pressable key={option.id} accessibilityRole="radio" accessibilityState={{ checked: isSelected }} onPress={() => { if (!result) { setSelected(option.id); setError(''); } }} style={[styles.answerChoice, { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.secondary : colors.card }]}>
            <Text style={[styles.answerLetter, { color: colors.foreground }]}>{String.fromCharCode(65 + optionIndex)}</Text>
            <AppText style={styles.answerText}>{option.text}</AppText>
          </Pressable>;
        })}
      </View>
      {showHint && <Notice>{t.hint}</Notice>}
      {result && <Notice tone={result.isCorrect ? 'success' : 'info'}>
        <Text style={{ fontFamily: 'DMSans_700Bold' }}>{result.isCorrect ? t.correct : t.incorrect}</Text>
        {'\n'}{result.feedback}
        {result.hint ? `\n${result.hint}` : ''}
        {result.nextAction === 'educator_review' && `\n${t.reviewRequested}`}
        {result.nextAction === 'try_visual' && `\n${t.visualHelp}`}
        {'\n'}{t.attempt} {result.attemptNumber}
      </Notice>}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <View style={styles.buttonStack}>
        {!result && <PrimaryButton label={t.needHint} icon="help-circle" secondary onPress={() => { setShowHint(true); setHintUsed(true); if (sessionId) recordEvent.mutate({ id: sessionId, data: { type: 'hint_used', language } }); }} testID="button-hint" />}
        {!result && <PrimaryButton label={submitAnswer.isPending ? t.loading : t.checkAnswer} icon="check" disabled={submitAnswer.isPending} onPress={() => void submit()} testID="button-check-answer" />}
        {result && <PrimaryButton label={result.nextAction === 'retry' || result.nextAction === 'try_visual' ? t.tryAgain : t.nextQuestion} icon="arrow-right" onPress={next} testID="button-next-question" />}
      </View>
    </Card>
  </PageShell>;
}

function percent(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return '—';
  return `${Math.round(value > 1 ? value : value * 100)}%`;
}

export function ProgressScreen() {
  const colors = useColors();
  const router = useRouter();
  const { sessionIds, language } = useAppSettings();
  const t = copy[language];
  const progress = useGetLearningProgress({ sessionIds: sessionIds.join(',') });
  if (progress.isLoading) return <PageShell title={t.progressTitle}><LoadingCard label={t.loading} /></PageShell>;
  if (progress.isError) return <PageShell title={t.progressTitle}><Notice tone="error">{t.serviceUnavailable}</Notice><PrimaryButton label={t.retry} icon="refresh-cw" secondary onPress={() => void progress.refetch()} /></PageShell>;
  const data = progress.data;
  if (!data) return <PageShell title={t.progressTitle}><Notice>{t.noProgress}</Notice></PageShell>;
  return <PageShell title={t.progressTitle} subtitle={t.progressIntro}>
    {data.isSampleData && <Notice>{t.sampleData}</Notice>}
    <View style={styles.metricsGrid}>
      <MetricCard label={t.lessonsStarted} value={data.lessonsStarted} icon="book-open" />
      <MetricCard label={t.lessonsCompleted} value={data.lessonsCompleted} icon="check-circle" />
      <MetricCard label={t.questionsAttempted} value={data.questionsAttempted} icon="target" />
      <MetricCard label={t.hintsUsed} value={data.hintsUsed} icon="help-circle" />
      <MetricCard label={t.firstAccuracy} value={percent(data.firstAttemptAccuracy)} icon="activity" />
      <MetricCard label={t.finalAccuracy} value={percent(data.finalAccuracy)} icon="trending-up" />
    </View>
    <Card>
      <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{t.concepts}</Text>
      {data.concepts.length === 0 ? <AppText>{t.noProgress}</AppText> : data.concepts.map((concept) => {
        const label = concept.status === 'understood' ? t.understood : concept.status === 'improving' ? t.improving : t.needsPractice;
        const amount = concept.status === 'understood' ? '100%' : concept.status === 'improving' ? '65%' : '35%';
        return <View key={concept.concept} style={styles.conceptRow}>
          <View style={styles.conceptHead}><AppText style={styles.benefitTitle}>{concept.concept}</AppText><AppText style={styles.smallText}>{label}</AppText></View>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}><View style={[styles.progressFill, { width: amount, backgroundColor: concept.status === 'understood' ? colors.accent : colors.primary }]} /></View>
        </View>;
      })}
    </Card>
    <Card><Eyebrow>{t.nextRecommendation}</Eyebrow><AppText>{t.nextRecommendationBody}</AppText><PrimaryButton label={t.learn} icon="book-open" onPress={() => router.push('/learn')} /></Card>
    {data.recentSessions.length > 0 && <Card><Eyebrow>{t.lessonsStarted}</Eyebrow>{data.recentSessions.slice(0, 3).map((session) => <AppText key={session.id}>{session.lessonTitle} · {new Date(session.startedAt).toLocaleDateString()}</AppText>)}</Card>}
  </PageShell>;
}

export function ParentScreen() {
  const colors = useColors();
  const { language, age, setAge, sessionIds } = useAppSettings();
  const t = copy[language];
  const progress = useGetLearningProgress({ sessionIds: sessionIds.join(',') });
  const agent = useGetAgentActivity();
  const reviews = useListEducatorReviews();
  const decide = useDecideEducatorReview();
  const checkout = useCreateDemoCheckout();
  const [showEducator, setShowEducator] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [paymentNotice, setPaymentNotice] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');
  const localActivity = agent.data?.filter((entry) => entry.provider === 'local_demo') ?? [];
  const realActivity = agent.data?.filter((entry) => entry.provider === 'agenticorg') ?? [];

  const checkPayment = async () => {
    setPaymentNotice('');
    try {
      const status = await checkout.mutateAsync({ data: { plan: 'practice_pack' } });
      setPaymentNotice(status.providerAvailable ? t.paymentReady : t.paymentUnavailable);
    } catch {
      setPaymentNotice(t.paymentError);
    }
  };

  const saveDecision = async (id: string, decision: 'approve' | 'edit' | 'reject', explanation?: string) => {
    setReviewNotice('');
    try {
      await decide.mutateAsync({ id, data: { decision, explanation } });
      setReviewNotice(t.decisionSaved);
      await reviews.refetch();
    } catch {
      setReviewNotice(t.reviewError);
    }
  };

  return <PageShell title={t.parentTitle} subtitle={t.parentIntro} keyboardAware>
    <Notice>{t.parentPrivacy}</Notice>
    <Card>
      <Eyebrow>{t.childSettings}</Eyebrow>
      <AppText>{t.childAge}: {age} {t.yearsOld}</AppText>
      <View style={styles.ageRow}>
        <PrimaryButton label="−" secondary disabled={age <= 8} onPress={() => setAge(age - 1)} testID="button-parent-age-down" />
        <PrimaryButton label={`${age}`} secondary disabled testID="text-parent-age" onPress={() => undefined} />
        <PrimaryButton label="+" secondary disabled={age >= 12} onPress={() => setAge(age + 1)} testID="button-parent-age-up" />
      </View>
      <AppText style={styles.smallText}>{t.updateLanguage}</AppText>
    </Card>

    <View style={styles.metricsGrid}>
      <MetricCard label={t.lessonsCompleted} value={progress.data?.lessonsCompleted ?? '—'} icon="check-circle" />
      <MetricCard label={t.questionsAttempted} value={progress.data?.questionsAttempted ?? '—'} icon="target" />
    </View>
    {progress.data?.isSampleData && <Notice>{t.sampleData}</Notice>}

    <Card>
      <Eyebrow>{t.agentTitle}</Eyebrow>
      {realActivity.length > 0 ? <Notice tone="success">{t.agentConnected}</Notice> : <Notice>{t.agentDemo}</Notice>}
      {agent.isError && <Notice tone="error">{t.serviceUnavailable}</Notice>}
      {agent.isLoading ? <AppText>{t.loading}</AppText> : realActivity.length === 0 && localActivity.length === 0 ? <AppText>{t.noAgentActivity}</AppText> : [...realActivity, ...localActivity].slice(0, 4).map((entry) => <View key={entry.id} style={styles.activityRow}>
        <View style={[styles.statusDot, { backgroundColor: entry.provider === 'agenticorg' ? colors.accent : colors.primary }]} />
        <View style={styles.activityText}><AppText style={styles.benefitTitle}>{entry.provider === 'agenticorg' ? 'AgenticOrg' : t.localSimulation}</AppText><AppText style={styles.smallText}>{entry.summary}</AppText></View>
      </View>)}
    </Card>

    <Card>
      <Eyebrow>{t.plusTitle}</Eyebrow><AppText>{t.plusBody}</AppText>
      <AppText style={styles.smallText}>{t.noPurchase}</AppText>
      <PrimaryButton label={checkout.isPending ? t.loading : t.checkPine} icon="shield" secondary disabled={checkout.isPending} onPress={() => void checkPayment()} testID="button-check-pine" />
      {paymentNotice ? <Notice tone={paymentNotice === t.paymentReady ? 'success' : 'info'}>{paymentNotice}</Notice> : null}
    </Card>

    <Card>
      <Eyebrow>{t.educatorTitle}</Eyebrow><AppText>{t.educatorIntro}</AppText>
      <PrimaryButton label={showEducator ? t.closeEducator : t.openEducator} icon="users" secondary onPress={() => setShowEducator((open) => !open)} testID="button-educator-tools" />
      {showEducator && <>
        {reviews.isLoading && <AppText>{t.loading}</AppText>}
        {reviews.isError && <Notice tone="error">{t.serviceUnavailable}</Notice>}
        {reviews.data?.length === 0 && <AppText>{t.noReviews}</AppText>}
        {reviews.data?.map((review) => <ReviewCard key={review.id} review={review} draft={drafts[review.id] ?? review.proposedExplanation} onDraft={(value) => setDrafts((current) => ({ ...current, [review.id]: value }))} onDecision={(decision, explanation) => void saveDecision(review.id, decision, explanation)} pending={decide.isPending} />)}
        {reviewNotice ? <Notice tone={reviewNotice === t.decisionSaved ? 'success' : 'error'}>{reviewNotice}</Notice> : null}
      </>}
    </Card>
  </PageShell>;
}

function ReviewCard({
  review,
  draft,
  onDraft,
  onDecision,
  pending,
}: {
  review: { id: string; concept: string; attemptSummary: string; proposedExplanation: string; reason: string; status: string; isSample: boolean };
  draft: string;
  onDraft: (value: string) => void;
  onDecision: (decision: 'approve' | 'edit' | 'reject', explanation?: string) => void;
  pending: boolean;
}) {
  const colors = useColors();
  const { language } = useAppSettings();
  const t = copy[language];
  return <Card style={{ backgroundColor: colors.background }}>
    <AppText style={styles.benefitTitle}>{review.concept} · {review.status}</AppText>
    <AppText>{review.attemptSummary}</AppText>
    <AppText>{review.reason}</AppText>
    {review.isSample && <Notice>{t.sampleData}</Notice>}
    <TextInput
      accessibilityLabel={t.editPlaceholder}
      value={draft}
      onChangeText={onDraft}
      multiline
      maxLength={1000}
      placeholder={t.editPlaceholder}
      placeholderTextColor={colors.mutedForeground}
      style={[styles.editInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
      testID={`input-review-${review.id}`}
    />
    <View style={styles.buttonStack}>
      <PrimaryButton label={t.approve} icon="check" disabled={pending} onPress={() => onDecision('approve')} testID={`button-approve-${review.id}`} />
      <PrimaryButton label={t.edit} icon="edit-2" secondary disabled={pending || !draft.trim()} onPress={() => onDecision('edit', draft.trim())} testID={`button-edit-${review.id}`} />
      <PrimaryButton label={t.reject} icon="x" secondary disabled={pending} onPress={() => onDecision('reject')} testID={`button-reject-${review.id}`} />
    </View>
  </Card>;
}

const styles = StyleSheet.create({
  heroCard: { padding: 19, gap: 14 },
  heroTitle: { fontFamily: 'Nunito_900Black', fontSize: 36, lineHeight: 43 },
  ageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  ageControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, minHeight: 46 },
  ageButton: { width: 45, height: 44, alignItems: 'center', justifyContent: 'center' },
  ageSign: { fontFamily: 'DMSans_700Bold', fontSize: 21 },
  ageValue: { minWidth: 35, textAlign: 'center', fontFamily: 'Nunito_900Black', fontSize: 20 },
  gradeLabel: { fontFamily: 'DMSans_700Bold', fontSize: 14 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  smallText: { fontSize: 12, lineHeight: 18 },
  sectionTitleRow: { marginTop: 4 },
  sectionTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 21 },
  benefitHead: { flexDirection: 'row', alignItems: 'center' },
  benefitTitle: { fontFamily: 'DMSans_700Bold', fontSize: 15 },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionHeading: { fontFamily: 'Nunito_800ExtraBold', fontSize: 22, lineHeight: 29 },
  visualPanel: { borderRadius: 18, padding: 12 },
  buttonStack: { gap: 9 },
  questionText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 21, lineHeight: 29 },
  answers: { gap: 9 },
  answerChoice: { minHeight: 54, borderWidth: 1.5, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  answerLetter: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', fontFamily: 'DMSans_700Bold' },
  answerText: { flex: 1 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  conceptRow: { gap: 7, marginTop: 5 },
  conceptHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  progressTrack: { height: 8, borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 4 },
  activityText: { flex: 1, gap: 3 },
  editInput: { minHeight: 86, borderWidth: 1, borderRadius: 12, padding: 12, textAlignVertical: 'top', fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 20 },
});
