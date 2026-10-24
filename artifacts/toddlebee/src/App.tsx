import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import type { ErrorFallbackProps } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  ArrowRight, AudioLines, BookOpen, Check, CircleHelp,
  Compass, Heart, Home, Lightbulb, LockKeyhole, Pause, RefreshCw, ShieldCheck,
  Sparkles, Volume2, X
} from 'lucide-react';
import {
  getGetAgentActivityQueryKey, getGetLearningProgressQueryKey, getListEducatorReviewsQueryKey,
  useCreateDemoCheckout, useCreateLearningSession, useDecideEducatorReview,
  useExplainConcept, useGetAgentActivity, useGetFractionsLesson, useGetLearningProgress, useHealthCheck,
  useListEducatorReviews, useListLessons, useListNarrationVoices, useRecordLearningEvent,
  useListQuizQuestions, useRequestIntervention, useSpeakExplanation, useSubmitQuizAnswer
} from '@workspace/api-client-react';
import type { EducatorReview, LessonSection, PaymentStatus, QuizAnswerResultNextAction } from '@workspace/api-client-react';

type Language = 'en' | 'ta';
const LanguageContext = createContext<{ language: Language; setLanguage: (lang: Language) => void }>({
  language: 'en', setLanguage: () => undefined
});
const useLanguage = () => useContext(LanguageContext);
const queryClient = new QueryClient();
const SESSION_HISTORY_KEY = 'toddlebee-session-history';

function getStoredSessionIds(): string[] {
  const currentSessionId = localStorage.getItem('toddlebee-session-id');
  let history: string[] = [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SESSION_HISTORY_KEY) || '[]');
    if (Array.isArray(parsed)) history = parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    history = [];
  }
  return [...new Set([currentSessionId, ...history].filter((id): id is string => Boolean(id)))].slice(0, 20);
}

const copy = {
  en: {
    home: 'Home', lesson: 'Lesson', practice: 'Practice', progress: 'My progress', grownups: 'For grown-ups',
    tagline: 'Every child can learn. Every child can grow.', headline: 'Learning that understands you.',
    subhead: 'A patient little learning companion for big ideas. Let’s make fractions feel friendly.',
    start: 'Start Learning', sampleCta: 'Explore a Sample Lesson', learnerTitle: 'A little about you', learnerText: 'So we can make your learning feel just right.',
    language: 'Learning language', age: 'Age', grade: 'Grade', grade4: 'Grade 4', continue: 'Start learning',
    lessonTitle: 'Fractions are parts of a whole', lessonIntro: 'Let’s explore fractions one small step at a time.',
    loading: 'Getting your lesson ready…', retry: 'Try again', read: 'Read aloud', reading: 'Preparing audio…',
    audioUnavailable: 'Narration is unavailable right now. You can still read along.', pause: 'Pause audio', resume: 'Resume audio', replay: 'Replay audio',
    tryAnother: 'Show me another way', next: 'Next step', finishLesson: 'Finish lesson', quiz: 'Try five questions',
    help: 'Need a hint?', hint: 'A hint is a little nudge, not the answer.', checkAnswer: 'Check answer',
    hintWillReturn: 'The learning service will include a gentle hint with your feedback after you check your answer.',
    visualHelp: 'Let’s look at a picture together.', educatorRequested: 'We’ve asked an educator to review a helpful explanation. Nothing is wrong; continue when you’re ready.',
    tryAnswerAgain: 'Try another answer', continuePractice: 'Continue',
    nextQuestion: 'Next question', finishQuiz: 'See my progress', question: 'Question', of: 'of',
    great: 'Lovely work!', tryAgain: 'That’s a good try. Let’s think it through together.',
    progressTitle: 'Look how far you’ve come', progressText: 'Every little step counts. Here’s your learning so far.',
    sessions: 'Learning sessions', completed: 'Lessons finished', accuracy: 'Final accuracy', questions: 'Questions tried',
    concepts: 'What you’re learning', recent: 'Recent learning', startPractice: 'Keep learning',
    grownupTitle: 'A steady hand, not a shortcut', grownupText: 'Small moments of encouragement make a big difference.',
    guidance: 'A few ways to help', demo: 'Demo review queue', parent: 'Parent & educator guidance',
    adminTitle: 'Educator review queue', adminText: 'Review proposed explanations before they are used.',
    pricing: 'ToddleBee Plus', pricingText: 'More room to learn, with a grown-up by your side.',
    unavailable: 'Pine Labs checkout is currently unavailable. No payment has been taken.',
    purchase: 'Check availability', languageName: 'English', sample: 'Sample data', local: 'Local demo',
    noSession: 'Start a learning session first from Home, then your progress will appear here.',
    noQueue: 'There are no review items waiting right now.', noSessions: 'No learning sessions yet.',
    quickNav: 'Quick navigation', mainNav: 'Main navigation', beeArt: 'A cheerful little bee', heroEyebrow: 'A kinder way to learn',
    heroNote: 'A little progress, every day', setupEyebrow: 'Your learning, your way', anonymous: 'No account needed. Your learning session is anonymous.',
    sessionStartError: 'We couldn’t start a session just now. Please try again in a moment.',
    serviceChecking: 'Checking learning service…', serviceUnavailable: 'Learning service status is unavailable right now.',
    lessonsUnavailable: ' · Lesson list unavailable', oneLesson: 'lesson', manyLessons: 'lessons', benefitsLabel: 'ToddleBee learning benefits',
    benefitLanguageTitle: 'Two languages, one learning path', benefitLanguage: 'Switch between English and Tamil at any time. Your choice follows you across learning screens.',
    benefitPaceTitle: 'At your own pace', benefitPace: 'Take a breath, try again, or ask for a different explanation. There is no timer.',
    benefitProgressTitle: 'Progress you can see', benefitProgress: 'Notice concepts explored, practice attempts and learning steps over time.',
    benefitSupportTitle: 'Patient human support', benefitSupport: 'Ask a grown-up to explore a picture or explain the idea in their own words.',
    benefitOversightTitle: 'Educator oversight', benefitOversight: 'When a learner needs another approach, explanations can be reviewed by a human educator. No learning pattern is a diagnosis.',
    featuredEyebrow: 'Featured lesson · Grade 4', discoverFractions: 'Discover Fractions',
    featuredDescription: 'See how equal parts, pizza slices and fruit sharing help fractions make sense.',
    exploreLesson: 'Explore lesson', featuredDetails: 'Five short steps · English and Tamil · Visual examples · No account needed to explore',
    learningService: 'Learning service', ready: 'ready', noAccount: 'No account needed.',
    gradeSubject: 'Grade 4 · Fractions', pathTitle: 'Our learning path', step: 'Step', ofSteps: 'of', takeYourTime: 'Take your time',
    allStepsComplete: 'All steps complete', pictureIt: 'Let’s picture it', parts: 'equal parts', wonderfulWork: 'Wonderful work',
    lessonDoneTitle: 'You explored fractions!', lessonDoneBody: 'You learned how equal parts make a whole, and how we name and compare fractions. That is a lot of thoughtful learning.',
    lessonFallbackError: 'The lesson service is unavailable. Showing the bundled learning activity for now.',
    lessonSample: 'Sample lesson · Progress will not be saved.', sampleSessionNotice: 'Sample session · Learning is anonymous.',
    noHintYet: 'The learning service will include a gentle hint with your feedback after you check your answer.',
    altVisualIntro: 'Let’s look at a picture together.', educatorReviewRequested: 'We’ve asked an educator to review a helpful explanation. Nothing is wrong; continue when you’re ready.',
    chooseAnswer: 'Choose an answer', questionFinished: 'finished', loadingQuestions: 'Loading practice questions',
    loadQuizError: 'Practice questions could not be loaded. Your answers and results are never guessed.',
    emptyQuiz: 'No practice questions are available right now.', quizNoSession: 'Please start a learning session on Home before answering.',
    quizAnswerError: 'The answer service is unavailable. Your answer has not been checked. Please try again.',
    quizComplete: 'Practice complete', quizCompleteBody: 'You worked through all {count} questions. Your answers were checked by the learning service.',
    quizCompleteGentle: 'Practice is a way to explore, not a test. Every answer helps you learn.',
    practiceLabel: 'Practice · fractions', quizIntro: 'Take your time. You can try again if you need to.',
    serverQuestions: 'Questions are provided by the learning service. Responses are checked by the server.',
    checking: 'Checking…', attempt: 'Attempt', educatorReviewShort: 'Educator review requested',
    hintLoading: 'Your hint will appear with the answer feedback.', learningStep: 'A growing collection of wins',
    progressLoadingError: 'Progress isn’t ready right now.', thoughtfulStep: 'One thoughtful step at a time',
    practiceFamiliar: 'Practice makes ideas feel familiar', afterHints: 'After hints and another try',
    learningRhythm: 'Learning rhythm', firstTry: 'First try', afterPractice: 'After practice',
    firstAttemptAccuracy: 'First-attempt accuracy', learningTime: 'Learning time', minutes: 'min',
    attempts: 'practice attempts', percent: '%', dateLocale: 'en-US',
    parentEyebrow: 'For the people cheering them on', parentIntro: 'Help your learner feel safe to wonder, make a mistake, and try a new way.',
    parentPrompt: 'Instead of jumping to the answer, ask: “What do you notice?” or “Could we draw the pieces together?” Let their thinking lead.',
    parentTipOne: 'Celebrate effort and curiosity, not just a correct answer.', parentTipTwo: 'Keep practice short; stop while learning still feels good.',
    parentTipThree: 'Ask your child to explain it in their own words.', respectfulTitle: 'Learning that stays respectful',
    respectfulBody: 'ToddleBee uses anonymous sessions and gentle feedback. Learning patterns can help choose a teaching approach, but they are not a diagnosis.',
    reviewHumanBody: 'When a learner repeats a tricky idea, a human educator can review an explanation before it is used.',
    viewProgress: 'View learning progress', openReview: 'Open demo educator review queue', freshIdeaTitle: 'Need a fresh teaching idea?',
    freshIdeaBody: 'Ask for a supportive suggestion based on this anonymous learning session.',
    findingNextStep: 'Finding a gentle next step…', suggestNextStep: 'Suggest a next step', supportUnavailable: 'Support suggestions are unavailable for this session right now.',
    teachingSuggestion: 'A teaching suggestion', localDemoGuidance: 'Local demo guidance, not a diagnosis.',
    adminAdult: 'Adult view', adminQueueIntro: 'This review space uses anonymous learning information. It is not a learner diagnosis.',
    adminDemoWarning: 'Demo-only review queue. Any sample items are clearly marked and are not learner records.',
    adminLoad: 'Loading educator reviews', reviewUnavailable: 'Review queue unavailable.',
    sampleItem: 'Sample item', attemptsLabel: 'Anonymized learning attempts:', reasonLabel: 'Reason for review:',
    proposedExplanation: 'Proposed explanation:', editExplanation: 'Edit explanation if needed', approve: 'Approve',
    saveEdited: 'Save edited explanation', reject: 'Reject', reviewUpdated: 'Review {action}.',
    reviewApprovePast: 'approved', reviewEditPast: 'saved', reviewRejectPast: 'rejected',
    reviewUpdateError: 'This review could not be updated. Please try again.', transparentActivity: 'Transparent activity',
    noActivity: 'No activity has been recorded.', localDemoProvider: 'Local demo', humanReview: 'Human review',
    educatorAccessTitle: 'Educator review access', educatorAccessIntro: 'This is a simple demo-only access gate. It is not production security and does not authenticate educators.',
    educatorAccessWarning: 'Demo gate only — this confirmation does not protect real learner data or replace production authentication.',
    educatorAcknowledge: 'I understand this is a demo review queue and not a secure educator account.',
    enterDemoQueue: 'Continue to demo queue', educatorAccessEyebrow: 'Educator access · Demo only',
    pricingEyebrow: 'More room for curious minds', freeAvailable: 'Available now', freePlan: 'Free', freePrice: '₹0',
    freeDescription: 'A warm place to begin learning fractions.', freeFeatureOne: 'Five-section Grade 4 fractions lesson',
    freeFeatureTwo: 'Five-question practice from the learning service', freeFeatureThree: 'English and Tamil language choice',
    freeFeatureFour: 'Progress insights and parent guidance', startLearning: 'Start learning',
    plusProposed: 'Proposed · Demo only · Not available to purchase', plusTitle: 'ToddleBee Plus',
    plusPriceDisclosure: 'Proposed pricing for a future plan. These benefits are not currently active.',
    plusFeatureOne: 'More guided fraction practice', plusFeatureTwo: 'More visual examples to explore',
    plusFeatureThree: 'Family learning summaries', plusFeatureFour: 'Human educator review workflows',
    checkoutUnavailableTitle: 'Pine Labs checkout unavailable', noPurchase: 'Plus access is not granted.',
    checkoutChecking: 'Checking availability…', noPlanAccess: 'No plan access has been granted.',
    plusDescription: 'More practice, same gentle pace', plusBody: 'A future plan for families who want extra practice and learning tools. Plans and pricing will be shared here when they are ready.',
    proposedMonthly: '₹99/month', noAuth: 'This is not production security.',
    parentNavigation: 'Parent', plusNavigation: 'Plus',
    visualRotiAlt: 'A whole roti divided into four equal parts, with one part highlighted',
    visualPizzaAlt: 'One of four pizza slices is highlighted', visualChocolateAlt: 'Three of five equal chocolate columns are shaded',
    visualEquivalentAlt: 'One half and two fourths show the same shaded amount', visualOrangeAlt: 'Two of four orange pieces are shaded',
    visualOneFourth: '1 of 4 equal parts', visualChocolateParts: '3 of 5 columns', visualOrangeParts: '2/4 pieces = 1/2',
    visualSameAmount: 'Same amount, more pieces', pauseNarration: 'Pause audio', resumeNarration: 'Resume audio', replayNarration: 'Replay audio',
    noVoiceAvailable: 'Narration is unavailable right now. You can still read along.',
    sampleProgressDisclosure: 'Sample data from the local learning demo. It may not reflect your own activity.',
    statusUnderstood: 'understood', statusImproving: 'improving', statusNeedsPractice: 'needs practice',
    conceptFractionParts: 'fraction parts', conceptNumerator: 'numerator', conceptDenominator: 'denominator',
    conceptEquivalent: 'equivalent fractions', conceptDaily: 'fractions in daily life', fallbackConcept: 'fractions',
    sessionLessonTitle: 'Grade 4 fractions', sampleTag: 'Sample',
    supportEducatorStrategy: 'An educator review can help choose another explanation.',
    supportVisualStrategy: 'Try drawing equal parts or using a familiar object together.',
    reviewPending: 'pending', reviewApproved: 'approved', reviewEdited: 'edited', reviewRejected: 'rejected',
    activityCompleted: 'completed',
    activityRepeated: 'Local demo coach noticed repeated difficulty and requested educator review.',
    activityCorrect: 'Local demo coach recorded a correct answer and encouraged the learner to continue.',
    activityHint: 'Local demo coach selected a supportive hint; no diagnosis was made.',
    activityIntervention: "Local demo intervention reviewed the learner's recent answer history.",
    proposedMonthlyLabel: 'Proposed price',
    plansIntro: 'Plans and benefits shown here are informational. Plus access is not active.',
    statusReady: 'ready', hintUsedCount: 'helpful hints used', chartAria: 'First try and final accuracy',
    parentBodyTail: 'Help your learner feel safe to wonder, make a mistake, and try a new way.',
    planComingSoon: 'Coming soon', planNotActive: 'These benefits are not currently active.',
    playLocalOnly: 'Sample practice is not saved to a learner session.',
    reviewStatus: 'Status', explanationChecked: 'Educator-reviewed explanation',
    progressHistoryUnavailable: 'No learning history yet.'
    ,supportVisualNext: 'Try a picture or a familiar object together.',
    statusCorrect: 'That’s right!', statusTryAgain: 'Good try. Let’s think it through together.',
    adminDecisionMessage: 'Review {action}.', adminReviewPending: 'pending review',
    repeatedReviewReason: 'Repeated difficulty on this concept; educator review is recommended.',
    attemptsAnonymous: '{count} attempts recorded without a learner name.',
    noActivityLabel: 'Activity', completeLabel: 'complete', chooseLanguage: 'Choose language',
    notFoundTitle: 'This page is not on our learning path yet.',
    notFoundBody: 'Let’s head back to a place to learn together.', backHome: 'Back to Home',
    statusPending: 'pending', statusFailed: 'failed', statusCancelled: 'cancelled', statusSucceeded: 'succeeded', statusUnavailable: 'unavailable',
    errorTitle: 'A small hiccup', errorBody: 'This part of the learning path needs another try. The rest is still here.'
  },
  ta: {
    home: 'முகப்பு', lesson: 'பாடம்', practice: 'பயிற்சி', progress: 'என் முன்னேற்றம்', grownups: 'பெரியவர்களுக்கு',
    tagline: 'ஒவ்வொரு குழந்தையும் கற்கலாம். ஒவ்வொரு குழந்தையும் வளரலாம்.', headline: 'உங்களைப் புரிந்துகொள்ளும் கற்றல்.',
    subhead: 'பெரிய கருத்துகளைக் கற்றுக்கொள்ள அன்பான சிறிய துணை. பின்னங்களை எளிதாகப் புரிந்துகொள்வோம்.',
    start: 'கற்கத் தொடங்கு', sampleCta: 'மாதிரிப் பாடத்தைப் பார்', learnerTitle: 'உங்களைப் பற்றி கொஞ்சம்', learnerText: 'உங்கள் கற்றலை உங்களுக்கு ஏற்றபடி அமைக்க.',
    language: 'கற்றல் மொழி', age: 'வயது', grade: 'வகுப்பு', grade4: '4ஆம் வகுப்பு', continue: 'கற்கத் தொடங்கு',
    lessonTitle: 'பின்னங்கள் ஒரு முழுமையின் பகுதிகள்', lessonIntro: 'பின்னங்களை ஒவ்வொரு சிறிய படியாகக் கற்போம்.',
    loading: 'பாடத்தைத் தயாரிக்கிறோம்…', retry: 'மீண்டும் முயற்சி', read: 'வாசித்துக் கேள்', reading: 'ஒலியைத் தயாரிக்கிறோம்…',
    audioUnavailable: 'இப்போது ஒலி கிடைக்கவில்லை. நீங்கள் வாசித்துக் கற்கலாம்.', pause: 'ஒலியை நிறுத்து', resume: 'மீண்டும் கேள்', replay: 'மீண்டும் கேள்',
    tryAnother: 'வேறு வழியில் காட்டு', next: 'அடுத்த படி', finishLesson: 'பாடத்தை முடி', quiz: 'ஐந்து கேள்விகள் முயற்சி',
    help: 'குறிப்பு வேண்டுமா?', hint: 'குறிப்பு என்பது ஒரு சிறிய உதவி; பதில் அல்ல.', checkAnswer: 'பதிலைச் சரிபார்',
    hintWillReturn: 'பதிலைச் சரிபார்த்த பிறகு, கற்றல் சேவை ஒரு சிறிய குறிப்பை வழங்கும்.',
    visualHelp: 'ஒரு படத்தைப் பார்த்து ஒன்றாகப் புரிந்துகொள்வோம்.', educatorRequested: 'உதவிகரமான விளக்கத்தை ஆசிரியர் பார்வையிடக் கேட்டுள்ளோம். கவலைப்பட ஒன்றுமில்லை; தயாரானபோது தொடரலாம்.',
    tryAnswerAgain: 'மீண்டும் முயற்சி', continuePractice: 'தொடரலாம்',
    nextQuestion: 'அடுத்த கேள்வி', finishQuiz: 'என் முன்னேற்றத்தைப் பார்', question: 'கேள்வி', of: '/',
    great: 'அருமையாகச் செய்தாய்!', tryAgain: 'நல்ல முயற்சி. ஒன்றாக யோசித்துப் பார்ப்போம்.',
    progressTitle: 'நீ எவ்வளவு தூரம் வந்திருக்கிறாய்!', progressText: 'ஒவ்வொரு சிறிய படியும் முக்கியம். இதோ உன் கற்றல்.',
    sessions: 'கற்றல் அமர்வுகள்', completed: 'முடித்த பாடங்கள்', accuracy: 'இறுதி துல்லியம்', questions: 'முயற்சித்த கேள்விகள்',
    concepts: 'நீ கற்றுக்கொள்வது', recent: 'சமீபத்திய கற்றல்', startPractice: 'தொடர்ந்து கற்போம்',
    grownupTitle: 'வழிகாட்டுங்கள்; பதிலைச் சொல்லிவிட வேண்டாம்', grownupText: 'சிறிய ஊக்க வார்த்தைகள் பெரிய மாற்றத்தைத் தரும்.',
    guidance: 'உதவ சில வழிகள்', demo: 'மாதிரி ஆய்வு வரிசை', parent: 'பெற்றோர் மற்றும் ஆசிரியர் வழிகாட்டி',
    adminTitle: 'ஆசிரியர் ஆய்வு வரிசை', adminText: 'பயன்படுத்துவதற்கு முன் பரிந்துரைக்கப்பட்ட விளக்கங்களைப் பாருங்கள்.',
    pricing: 'ToddleBee Plus', pricingText: 'பெரியவரின் துணையுடன் கற்க இன்னும் அதிக இடம்.',
    unavailable: 'Pine Labs கட்டணம் தற்போது கிடைக்கவில்லை. எந்தப் பணமும் வசூலிக்கப்படவில்லை.',
    purchase: 'கிடைப்பதைச் சரிபார்', languageName: 'தமிழ்', sample: 'மாதிரி தரவு', local: 'உள்ளூர் டெமோ',
    noSession: 'முதலில் முகப்பிலிருந்து கற்றல் அமர்வைத் தொடங்குங்கள். உங்கள் முன்னேற்றம் இங்கே தெரியும்.',
    noQueue: 'தற்போது ஆய்வுக்காக எதுவும் காத்திருக்கவில்லை.', noSessions: 'இன்னும் கற்றல் அமர்வுகள் இல்லை.',
    quickNav: 'விரைவு வழிசெலுத்தல்', mainNav: 'முதன்மை வழிசெலுத்தல்', beeArt: 'மகிழ்ச்சியான சிறிய தேனீ', heroEyebrow: 'அன்பான கற்றல் வழி',
    heroNote: 'ஒவ்வொரு நாளும் சிறு முன்னேற்றம்', setupEyebrow: 'உங்கள் கற்றல், உங்கள் வழி', anonymous: 'கணக்கு தேவையில்லை. உங்கள் கற்றல் அமர்வு பெயரில்லாதது.',
    sessionStartError: 'இப்போது அமர்வைத் தொடங்க முடியவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.',
    serviceChecking: 'கற்றல் சேவையைச் சரிபார்க்கிறோம்…', serviceUnavailable: 'கற்றல் சேவை நிலை இப்போது கிடைக்கவில்லை.',
    lessonsUnavailable: ' · பாடப் பட்டியல் கிடைக்கவில்லை', oneLesson: 'பாடம்', manyLessons: 'பாடங்கள்', benefitsLabel: 'ToddleBee கற்றல் நன்மைகள்',
    benefitLanguageTitle: 'இரு மொழிகள், ஒரே கற்றல் பயணம்', benefitLanguage: 'எப்போது வேண்டுமானாலும் ஆங்கிலம் மற்றும் தமிழுக்கு மாறலாம். உங்கள் தேர்வு எல்லா கற்றல் திரைகளிலும் தொடரும்.',
    benefitPaceTitle: 'உங்கள் வேகத்தில் கற்கலாம்', benefitPace: 'சிறிது ஓய்ந்து மீண்டும் முயற்சிக்கலாம் அல்லது வேறு விளக்கத்தைக் கேட்கலாம். நேரக் கட்டுப்பாடு இல்லை.',
    benefitProgressTitle: 'முன்னேற்றத்தைப் பாருங்கள்', benefitProgress: 'கற்ற கருத்துகள், முயற்சிகள் மற்றும் கற்றல் படிகளை காலப்போக்கில் கவனியுங்கள்.',
    benefitSupportTitle: 'அன்பான மனித உதவி', benefitSupport: 'ஒரு படத்தைப் பார்த்து ஆராயவோ, உங்கள் சொற்களில் விளக்கவோ பெரியவரிடம் கேளுங்கள்.',
    benefitOversightTitle: 'ஆசிரியர் மேற்பார்வை', benefitOversight: 'வேறு அணுகுமுறை தேவைப்பட்டால், விளக்கத்தை மனித ஆசிரியர் பரிசீலிக்கலாம். கற்றல் முறை எதுவும் நோயறிதல் அல்ல.',
    featuredEyebrow: 'சிறப்புப் பாடம் · 4ஆம் வகுப்பு', discoverFractions: 'பின்னங்களைக் கண்டறிவோம்',
    featuredDescription: 'சமப் பங்குகள், பீட்சா துண்டுகள், பழப் பகிர்வு மூலம் பின்னங்களைப் புரிந்துகொள்வோம்.',
    exploreLesson: 'பாடத்தைப் பார்', featuredDetails: 'ஐந்து சிறு படிகள் · தமிழ் மற்றும் ஆங்கிலம் · படங்கள் · ஆராய கணக்கு தேவையில்லை',
    learningService: 'கற்றல் சேவை', ready: 'தயார்', noAccount: 'கணக்கு தேவையில்லை.',
    gradeSubject: '4ஆம் வகுப்பு · பின்னங்கள்', pathTitle: 'நமது கற்றல் பாதை', step: 'படி', ofSteps: '/', takeYourTime: 'நிதானமாகக் கற்கலாம்',
    allStepsComplete: 'அனைத்துப் படிகளும் முடிந்தன', pictureIt: 'படமாகப் பார்ப்போம்', parts: 'சம பங்குகள்', wonderfulWork: 'அருமையான முயற்சி',
    lessonDoneTitle: 'பின்னங்களை ஆராய்ந்துவிட்டாய்!', lessonDoneBody: 'சமமான பகுதிகள் ஒரு முழுமையை உருவாக்குவதையும், பின்னங்களைப் பெயரிட்டு ஒப்பிடுவதையும் கற்றாய். சிறப்பாகக் கற்றுக்கொண்டாய்.',
    lessonFallbackError: 'பாடச் சேவை இப்போது கிடைக்கவில்லை. தொகுக்கப்பட்ட கற்றல் செயல்பாட்டைக் காட்டுகிறோம்.',
    lessonSample: 'மாதிரிப் பாடம் · முன்னேற்றம் சேமிக்கப்படாது.', sampleSessionNotice: 'மாதிரி அமர்வு · கற்றல் பெயரில்லாதது.',
    noHintYet: 'பதிலைச் சரிபார்த்த பிறகு, கற்றல் சேவை ஒரு சிறிய குறிப்பை வழங்கும்.',
    altVisualIntro: 'ஒரு படத்தைப் பார்த்து ஒன்றாகப் புரிந்துகொள்வோம்.', educatorReviewRequested: 'உதவிகரமான விளக்கத்தை ஆசிரியர் பரிசீலிக்கக் கேட்டுள்ளோம். கவலைப்பட ஒன்றுமில்லை; தயாரானபோது தொடரலாம்.',
    chooseAnswer: 'ஒரு பதிலைத் தேர்ந்தெடுக்கவும்', questionFinished: 'முடிந்தது', loadingQuestions: 'பயிற்சிக் கேள்விகளை ஏற்றுகிறோம்',
    loadQuizError: 'பயிற்சிக் கேள்விகளை ஏற்ற முடியவில்லை. பதிலையோ முடிவையோ ஊகித்துக் காட்டமாட்டோம்.',
    emptyQuiz: 'இப்போது பயிற்சிக் கேள்விகள் இல்லை.', quizNoSession: 'பதிலளிக்கும் முன் முகப்பில் கற்றல் அமர்வைத் தொடங்குங்கள்.',
    quizAnswerError: 'பதில் சேவை கிடைக்கவில்லை. உங்கள் பதில் சரிபார்க்கப்படவில்லை. மீண்டும் முயற்சிக்கவும்.',
    quizComplete: 'பயிற்சி முடிந்தது', quizCompleteBody: 'மொத்தம் {count} கேள்விகளையும் முயற்சித்தாய். கற்றல் சேவை உன் பதில்களைச் சரிபார்த்தது.',
    quizCompleteGentle: 'பயிற்சி என்பது ஆராய்வதற்கானது; தேர்வு அல்ல. ஒவ்வொரு பதிலும் கற்க உதவும்.',
    practiceLabel: 'பயிற்சி · பின்னங்கள்', quizIntro: 'நிதானமாக முயற்சி செய். தேவைப்பட்டால் மீண்டும் முயற்சிக்கலாம்.',
    serverQuestions: 'கேள்விகளை கற்றல் சேவை வழங்குகிறது. பதில்களை சேவையகம் சரிபார்க்கிறது.',
    checking: 'சரிபார்க்கிறோம்…', attempt: 'முயற்சி', educatorReviewShort: 'ஆசிரியர் பரிசீலனை கோரப்பட்டது',
    hintLoading: 'பதிலுடன் குறிப்பு வரும்.', learningStep: 'சிறு வெற்றிகள் சேரும் பயணம்',
    progressLoadingError: 'முன்னேற்றம் இப்போது கிடைக்கவில்லை.', thoughtfulStep: 'ஒவ்வொரு சிறு படியும் முக்கியம்',
    practiceFamiliar: 'பயிற்சி கருத்துகளைப் பழக்கமாக்கும்', afterHints: 'குறிப்புக்குப் பிறகான முயற்சி',
    learningRhythm: 'கற்றல் பயணம்', firstTry: 'முதல் முயற்சி', afterPractice: 'பயிற்சிக்குப் பின்',
    firstAttemptAccuracy: 'முதல் முயற்சி துல்லியம்', learningTime: 'கற்ற நேரம்', minutes: 'நிமிடம்',
    attempts: 'பயிற்சி முயற்சிகள்', percent: '%', dateLocale: 'ta-IN',
    parentEyebrow: 'குழந்தையை ஊக்குவிக்கும் பெரியவர்களுக்கு', parentIntro: 'கேள்வி கேட்கவும், தவறு செய்யவும், புதிய வழியை முயற்சிக்கவும் குழந்தை பாதுகாப்பாக உணர உதவுங்கள்.',
    parentPrompt: 'பதிலை உடனே சொல்லாமல், “என்ன கவனிக்கிறாய்?” அல்லது “துண்டுகளை வரைந்து பார்க்கலாமா?” என்று கேளுங்கள். அவர்களின் சிந்தனைக்கு வழிவிடுங்கள்.',
    parentTipOne: 'சரியான பதிலை மட்டும் அல்ல; முயற்சியையும் ஆர்வத்தையும் பாராட்டுங்கள்.', parentTipTwo: 'பயிற்சியைச் சுருக்கமாக வைத்துக் கொள்ளுங்கள்; ஆர்வம் இருக்கும் போதே நிறுத்தலாம்.',
    parentTipThree: 'உங்கள் குழந்தையைத் தன் சொற்களில் விளக்கச் சொல்லுங்கள்.', respectfulTitle: 'மரியாதையுடன் கற்றல்',
    respectfulBody: 'ToddleBee பெயரில்லா அமர்வுகளையும் மென்மையான பின்னூட்டத்தையும் பயன்படுத்துகிறது. கற்றல் முறைகள் கற்பித்தல் வழியைத் தேர்வுசெய்ய உதவும்; அவை நோயறிதல் அல்ல.',
    reviewHumanBody: 'ஒரு கருத்து தொடர்ந்து சவாலாக இருந்தால், பயன்படுத்துவதற்கு முன் மனித ஆசிரியர் விளக்கத்தைப் பரிசீலிக்கலாம்.',
    viewProgress: 'கற்றல் முன்னேற்றத்தைப் பார்', openReview: 'ஆசிரியர் டெமோ ஆய்வைத் திற', freshIdeaTitle: 'புதிய கற்பித்தல் யோசனை வேண்டுமா?',
    freshIdeaBody: 'இந்தப் பெயரில்லா கற்றல் அமர்வுக்கான ஆதரவான யோசனையைக் கேளுங்கள்.',
    findingNextStep: 'அடுத்த மென்மையான படியைத் தேடுகிறோம்…', suggestNextStep: 'அடுத்த படியைப் பரிந்துரை செய்', supportUnavailable: 'இந்த அமர்வுக்கான உதவி யோசனைகள் இப்போது கிடைக்கவில்லை.',
    teachingSuggestion: 'கற்பித்தல் யோசனை', localDemoGuidance: 'உள்ளூர் டெமோ வழிகாட்டல்; நோயறிதல் அல்ல.',
    adminAdult: 'பெரியவர் பகுதி', adminQueueIntro: 'இந்த ஆய்வுப் பகுதியில் பெயரில்லா கற்றல் தகவல்களே பயன்படுத்தப்படுகின்றன. இது மாணவர் நோயறிதல் அல்ல.',
    adminDemoWarning: 'டெமோ ஆய்வு வரிசை மட்டுமே. மாதிரி உருப்படிகள் தெளிவாகக் குறிக்கப்படும்; இவை உண்மையான மாணவர் பதிவுகள் அல்ல.',
    adminLoad: 'ஆசிரியர் ஆய்வுகளை ஏற்றுகிறோம்', reviewUnavailable: 'ஆய்வு வரிசை இப்போது கிடைக்கவில்லை.',
    sampleItem: 'மாதிரி உருப்படி', attemptsLabel: 'பெயரில்லா முயற்சிகள்:', reasonLabel: 'ஆய்வுக்கான காரணம்:',
    proposedExplanation: 'பரிந்துரைக்கப்பட்ட விளக்கம்:', editExplanation: 'தேவைப்பட்டால் விளக்கத்தைத் திருத்தவும்', approve: 'ஒப்புதல்',
    saveEdited: 'திருத்திய விளக்கத்தைச் சேமி', reject: 'நிராகரி', reviewUpdated: 'ஆய்வு {action}.',
    reviewApprovePast: 'ஒப்புதல் அளிக்கப்பட்டது', reviewEditPast: 'சேமிக்கப்பட்டது', reviewRejectPast: 'நிராகரிக்கப்பட்டது',
    reviewUpdateError: 'இந்த ஆய்வைப் புதுப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', transparentActivity: 'வெளிப்படையான செயல்பாடு',
    noActivity: 'செயல்பாடுகள் எதுவும் பதிவு செய்யப்படவில்லை.', localDemoProvider: 'உள்ளூர் டெமோ', humanReview: 'மனித ஆய்வு',
    educatorAccessTitle: 'ஆசிரியர் ஆய்வுக்கான அணுகல்', educatorAccessIntro: 'இது டெமோவுக்கான எளிய அணுகல் உறுதிப்படுத்தல் மட்டுமே. இது உண்மையான பாதுகாப்போ ஆசிரியர் அங்கீகாரமோ அல்ல.',
    educatorAccessWarning: 'டெமோ அணுகல் மட்டுமே — இந்த உறுதிப்படுத்தல் உண்மையான மாணவர் தரவைப் பாதுகாக்காது; உண்மையான அங்கீகாரத்திற்குப் பதிலாகவும் இருக்காது.',
    educatorAcknowledge: 'இது பாதுகாப்பான ஆசிரியர் கணக்கு அல்ல; டெமோ ஆய்வு வரிசை என்பதைப் புரிந்துகொண்டேன்.',
    enterDemoQueue: 'டெமோ ஆய்வுக்குச் செல்', educatorAccessEyebrow: 'ஆசிரியர் அணுகல் · டெமோ மட்டும்',
    pricingEyebrow: 'ஆர்வமுள்ள மனங்களுக்கு மேலும் கற்க இடம்', freeAvailable: 'இப்போது கிடைக்கிறது', freePlan: 'இலவசம்', freePrice: '₹0',
    freeDescription: 'பின்னங்களைக் கற்கத் தொடங்க அன்பான இடம்.', freeFeatureOne: '4ஆம் வகுப்பு பின்னங்களுக்கான ஐந்து படிப் பாடம்',
    freeFeatureTwo: 'கற்றல் சேவை வழங்கும் ஐந்து கேள்விப் பயிற்சி', freeFeatureThree: 'ஆங்கிலம் மற்றும் தமிழ் மொழித் தேர்வு',
    freeFeatureFour: 'முன்னேற்றக் குறிப்புகள் மற்றும் பெற்றோர் வழிகாட்டல்', startLearning: 'கற்கத் தொடங்கு',
    plusProposed: 'முன்மொழிவு · டெமோ மட்டும் · வாங்க முடியாது', plusTitle: 'ToddleBee Plus',
    plusPriceDisclosure: 'எதிர்காலத் திட்டத்திற்கான முன்மொழியப்பட்ட விலை. இந்த வசதிகள் இப்போது செயல்பாட்டில் இல்லை.',
    plusFeatureOne: 'மேலும் வழிகாட்டப்பட்ட பின்னப் பயிற்சி', plusFeatureTwo: 'ஆராய கூடுதல் பட விளக்கங்கள்',
    plusFeatureThree: 'குடும்பக் கற்றல் சுருக்கங்கள்', plusFeatureFour: 'மனித ஆசிரியர் ஆய்வு வசதிகள்',
    checkoutUnavailableTitle: 'Pine Labs கட்டணம் கிடைக்கவில்லை', noPurchase: 'Plus அணுகல் வழங்கப்படவில்லை.',
    checkoutChecking: 'கிடைப்பதைச் சரிபார்க்கிறோம்…', noPlanAccess: 'திட்ட அணுகல் எதுவும் வழங்கப்படவில்லை.',
    plusDescription: 'அதே அன்பான வேகத்தில் மேலும் பயிற்சி', plusBody: 'கூடுதல் பயிற்சி மற்றும் கற்றல் கருவிகள் கொண்ட எதிர்காலத் திட்டம். தயாரானதும் திட்ட விவரங்களும் விலையும் இங்கே பகிரப்படும்.',
    proposedMonthly: '₹99/மாதம்', noAuth: 'இது உண்மையான பாதுகாப்பு வசதி அல்ல.',
    parentNavigation: 'பெற்றோர்', plusNavigation: 'Plus',
    visualRotiAlt: 'முழு ரொட்டி நான்கு சம பங்குகளாகப் பிரிக்கப்பட்டு ஒரு பங்கு குறிக்கப்பட்டுள்ளது',
    visualPizzaAlt: 'நான்கு பீட்சா துண்டுகளில் ஒன்று குறிக்கப்பட்டுள்ளது', visualChocolateAlt: 'ஐந்து சாக்லேட் பகுதிகளில் மூன்று நிறமிடப்பட்டுள்ளன',
    visualEquivalentAlt: 'ஒரு பாதியும் நான்கில் இரண்டு பங்குகளும் ஒரே அளவைக் காட்டுகின்றன', visualOrangeAlt: 'நான்கு ஆரஞ்சுத் துண்டுகளில் இரண்டு குறிக்கப்பட்டுள்ளன',
    visualOneFourth: '4 சம பங்குகளில் 1 பங்கு', visualChocolateParts: '5 பகுதிகளில் 3', visualOrangeParts: '2/4 துண்டுகள் = 1/2',
    visualSameAmount: 'அளவு ஒன்றே; பகுதிகள் அதிகம்', pauseNarration: 'ஒலியை நிறுத்து', resumeNarration: 'மீண்டும் கேள்', replayNarration: 'மீண்டும் கேள்',
    noVoiceAvailable: 'இப்போது ஒலி கிடைக்கவில்லை. நீங்கள் வாசித்துக் கற்கலாம்.',
    sampleProgressDisclosure: 'உள்ளூர் கற்றல் டெமோவின் மாதிரி தரவு. இது உங்கள் செயல்பாடுகளைப் பிரதிபலிக்காமல் இருக்கலாம்.',
    statusUnderstood: 'புரிந்துகொண்டது', statusImproving: 'முன்னேறுகிறது', statusNeedsPractice: 'மேலும் பயிற்சி தேவை',
    conceptFractionParts: 'பின்னத்தின் பகுதிகள்', conceptNumerator: 'மேலெண்', conceptDenominator: 'கீழெண்',
    conceptEquivalent: 'சமமான பின்னங்கள்', conceptDaily: 'அன்றாட வாழ்வில் பின்னங்கள்', fallbackConcept: 'பின்னங்கள்',
    sessionLessonTitle: '4ஆம் வகுப்பு பின்னங்கள்', sampleTag: 'மாதிரி',
    supportEducatorStrategy: 'வேறு விளக்கத்தைத் தேர்வுசெய்ய ஆசிரியர் ஆய்வு உதவலாம்.',
    supportVisualStrategy: 'சமமான பகுதிகளை வரையவோ பழக்கமான பொருளைக் கொண்டு விளக்கவோ முயற்சிக்கலாம்.',
    reviewPending: 'நிலுவையில்', reviewApproved: 'ஒப்புதல் அளிக்கப்பட்டது', reviewEdited: 'திருத்தப்பட்டது', reviewRejected: 'நிராகரிக்கப்பட்டது',
    activityCompleted: 'முடிந்தது',
    activityRepeated: 'தொடர்ச்சியான சிரமத்தைக் கவனித்து, ஆசிரியர் ஆய்வைக் கோரியது உள்ளூர் டெமோ வழிகாட்டி.',
    activityCorrect: 'சரியான பதிலைப் பதிவு செய்து தொடர்ந்து முயற்சிக்க ஊக்கமளித்தது உள்ளூர் டெமோ வழிகாட்டி.',
    activityHint: 'ஆதரவான குறிப்பைத் தேர்ந்தெடுத்தது உள்ளூர் டெமோ வழிகாட்டி; இது நோயறிதல் அல்ல.',
    activityIntervention: 'கற்றவரின் அண்மைய பதில் வரலாற்றைப் பரிசீலித்தது உள்ளூர் டெமோ வழிகாட்டி.',
    proposedMonthlyLabel: 'முன்மொழியப்பட்ட விலை',
    plansIntro: 'இங்கே காட்டப்படும் திட்டங்களும் நன்மைகளும் தகவலுக்காக மட்டுமே. Plus அணுகல் இப்போது செயல்பாட்டில் இல்லை.',
    statusReady: 'தயார்', hintUsedCount: 'உதவிகரமான குறிப்புகள் பயன்படுத்தப்பட்டன', chartAria: 'முதல் முயற்சி மற்றும் இறுதி துல்லியம்',
    parentBodyTail: 'கேள்வி கேட்கவும், தவறு செய்யவும், புதிய வழியை முயற்சிக்கவும் குழந்தை பாதுகாப்பாக உணர உதவுங்கள்.',
    planComingSoon: 'விரைவில்', planNotActive: 'இந்த வசதிகள் தற்போது செயல்பாட்டில் இல்லை.',
    playLocalOnly: 'மாதிரிப் பயிற்சி கற்றல் அமர்வில் சேமிக்கப்படாது.',
    reviewStatus: 'நிலை', explanationChecked: 'ஆசிரியர் பரிசீலித்த விளக்கம்',
    progressHistoryUnavailable: 'இன்னும் கற்றல் வரலாறு இல்லை.',
    supportVisualNext: 'ஒரு படத்தையோ பழக்கமான பொருளையோ கொண்டு ஒன்றாகப் பார்ப்போம்.',
    statusCorrect: 'சரியாகச் செய்தாய்!', statusTryAgain: 'நல்ல முயற்சி. ஒன்றாக யோசித்துப் பார்ப்போம்.',
    adminDecisionMessage: 'ஆய்வு {action}.', adminReviewPending: 'ஆய்வு நிலுவையில்',
    repeatedReviewReason: 'இந்தக் கருத்தில் மீண்டும் சிரமம் ஏற்பட்டதால் ஆசிரியர் ஆய்வு பரிந்துரைக்கப்படுகிறது.',
    attemptsAnonymous: 'கற்றவரின் பெயரின்றி {count} முயற்சிகள் பதிவு செய்யப்பட்டுள்ளன.',
    noActivityLabel: 'செயல்பாடு', completeLabel: 'முடிந்தது', chooseLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    notFoundTitle: 'இந்தப் பக்கம் நமது கற்றல் பாதையில் இல்லை.',
    notFoundBody: 'ஒன்றாகக் கற்க முகப்புக்குச் செல்வோம்.', backHome: 'முகப்புக்குச் செல்',
    statusPending: 'நிலுவையில்', statusFailed: 'தோல்வியடைந்தது', statusCancelled: 'ரத்து செய்யப்பட்டது', statusSucceeded: 'வெற்றிகரமாக முடிந்தது', statusUnavailable: 'கிடைக்கவில்லை',
    errorTitle: 'சிறிய தடங்கல்', errorBody: 'கற்றல் பாதையின் இந்தப் பகுதியில் மீண்டும் முயற்சிக்கலாம். மற்றவை இங்கே உள்ளன.'
  }
};

function BeeMark({ label }: { label: string }) {
  return <svg className="bee-mark" viewBox="0 0 48 48" role="img" aria-label={label}>
    <ellipse cx="17" cy="15" rx="8" ry="10" fill="#BDE7FF" stroke="#102B50" strokeWidth="2.5" transform="rotate(-28 17 15)" />
    <ellipse cx="30" cy="15" rx="8" ry="10" fill="#BDE7FF" stroke="#102B50" strokeWidth="2.5" transform="rotate(28 30 15)" />
    <ellipse cx="24" cy="28" rx="17" ry="13" fill="#FFBF24" stroke="#102B50" strokeWidth="2.5" />
    <path d="M18 16v24M28 16v24" stroke="#102B50" strokeWidth="5" />
    <circle cx="31.5" cy="25" r="1.7" fill="#102B50" />
    <path d="M33 30q-2 3-5 1" fill="none" stroke="#102B50" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M30 15q1-7 7-7" fill="none" stroke="#102B50" strokeWidth="2" strokeLinecap="round" />
    <circle cx="37" cy="7" r="2.3" fill="#FF9278" />
  </svg>;
}

function Header() {
  const { language, setLanguage } = useLanguage();
  const t = copy[language];
  const [location] = useLocation();
  const links = [
    ['/', t.home], ['/learn', t.lesson], ['/quiz', t.practice], ['/progress', t.progress],
    ['/parent', t.grownups], ['/pricing', t.pricing]
  ];
  const mobileLinks = [
    ['/', t.home], ['/learn', t.lesson], ['/quiz', t.practice], ['/progress', t.progress],
    ['/parent', t.parentNavigation], ['/pricing', t.plusNavigation]
  ];
  return <>
    <header className="topbar">
      <Link href="/" className="brand" data-testid="link-brand"><BeeMark label="ToddleBee" /><span>ToddleBee</span></Link>
      <nav className="top-links" aria-label={t.mainNav}>
        {links.map(([href, label]) => <Link key={href} href={href} className={`nav-link ${location === href ? 'active' : ''}`} data-testid={`link-nav-${href === '/' ? 'home' : href.slice(1)}`}>{label}</Link>)}
      </nav>
      <div className="lang-switch" role="group" aria-label={t.chooseLanguage}>
        <button type="button" onClick={() => setLanguage('en')} aria-pressed={language === 'en'} data-testid="button-language-en">EN</button>
        <button type="button" onClick={() => setLanguage('ta')} aria-pressed={language === 'ta'} data-testid="button-language-ta">தமிழ்</button>
      </div>
    </header>
    <nav className="mobile-nav" aria-label={t.quickNav}>
      {mobileLinks.map(([href, label], index) => {
        const Icon = [Home, BookOpen, Lightbulb, Compass, Heart, Sparkles][index];
        return <Link key={href} href={href} className={location === href ? 'active' : ''} data-testid={`mobile-nav-${index}`}><span><Icon size={18} /></span>{label}</Link>;
      })}
    </nav>
  </>;
}

function Shell({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  return <div className="app-shell"><Header />{children}<footer className="footer">ToddleBee · {copy[language].tagline}</footer></div>;
}

function BeeHeroArt({ language }: { language: Language }) {
  const t = copy[language];
  return <div className="hero-art" aria-label={t.beeArt} role="img">
    <div className="sun-disc" /><div className="spark s1">✦</div><div className="spark s2">✦</div>
    <div className="bee-illustration"><div className="bee-wing one" /><div className="bee-wing two" /><div className="bee-body" /><i className="bee-eye" /><i className="bee-smile" /><i className="bee-antenna" /></div>
    <div className="hero-note">{t.heroNote}</div>
  </div>;
}

function HomePage() {
  const { language, setLanguage } = useLanguage();
  const t = copy[language];
  const [, setLocation] = useLocation();
  const createSession = useCreateLearningSession();
  const lessons = useListLessons();
  const health = useHealthCheck();
  const [age, setAge] = useState('9');
  const [error, setError] = useState('');
  const start = () => {
    setError('');
    createSession.mutate({ data: { language, grade: 4, age: Number(age) } }, {
      onSuccess: (session) => {
        localStorage.removeItem('toddlebee-preview-mode');
        localStorage.setItem('toddlebee-session-id', session.id);
        localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify([...new Set([session.id, ...getStoredSessionIds()])].slice(0, 20)));
        localStorage.setItem('toddlebee-session-sample', String(session.isSample));
        setLocation('/learn');
      },
      onError: () => setError(t.sessionStartError)
    });
  };
  return <main className="page">
    <section className="hero">
      <div>
        <div className="eyebrow">{t.heroEyebrow}</div>
        <h1>{t.headline.split(' ').slice(0, 2).join(' ')} <span>{t.headline.split(' ').slice(2).join(' ')}</span></h1>
        <p>{t.subhead}</p>
        <div className="content-actions" style={{ marginTop: 0 }}>
          <Link href="#start-learning" className="btn" data-testid="link-start-learning">{t.start}<ArrowRight size={18} /></Link>
          <Link href="/learn" className="btn btn-secondary" onClick={() => localStorage.setItem('toddlebee-preview-mode', 'true')} data-testid="link-explore-sample">{t.sampleCta}<BookOpen size={17} /></Link>
        </div>
      </div>
      <BeeHeroArt language={language} />
    </section>
    <section id="start-learning" className="setup-panel" aria-labelledby="setup-title">
      <div className="section-heading">
        <div><div className="eyebrow">{t.setupEyebrow}</div><h2 id="setup-title">{t.learnerTitle}</h2><p>{t.learnerText}</p></div>
        <div className="notice" style={{ maxWidth: 320 }}>{t.anonymous}</div>
      </div>
      <div className="setup-grid">
        <div className="field"><label htmlFor="language-select">{t.language}</label><select id="language-select" value={language} onChange={(event) => setLanguage(event.target.value as Language)} data-testid="select-learning-language"><option value="en">English</option><option value="ta">தமிழ்</option></select></div>
        <div className="field"><label htmlFor="age-select">{t.age}</label><select id="age-select" value={age} onChange={(event) => setAge(event.target.value)} data-testid="select-learner-age">{[8, 9, 10, 11, 12].map((value) => <option value={value} key={value}>{value}</option>)}</select></div>
        <div className="field"><label htmlFor="grade-select">{t.grade}</label><select id="grade-select" value="4" onChange={() => undefined} data-testid="select-learner-grade"><option value="4">{t.grade4}</option></select></div>
      </div>
      {error && <div className="notice status-error" role="alert" data-testid="status-session-error">{error}</div>}
      <button className="btn" onClick={start} disabled={createSession.isPending} data-testid="button-start-session">{createSession.isPending ? t.loading : t.continue}<ArrowRight size={18} /></button>
      <div className="notice" style={{ marginTop: 16 }} data-testid="status-learning-service">
        {health.isLoading ? t.serviceChecking : health.isError ? t.serviceUnavailable : `${t.learningService}: ${health.data?.status || t.ready}`}
        {!lessons.isLoading && lessons.data && <span data-testid="text-available-lessons"> · {lessons.data.length} {lessons.data.length === 1 ? t.oneLesson : t.manyLessons}</span>}
        {lessons.isError && <span data-testid="status-lessons-unavailable">{t.lessonsUnavailable}</span>}
      </div>
    </section>
    <section className="setup-panel" style={{ marginTop: 24 }}>
      <div className="section-heading"><div><div className="eyebrow">{t.featuredEyebrow}</div><h2>{t.discoverFractions}</h2><p>{t.featuredDescription}</p></div>
        <Link href="/learn" className="btn btn-secondary" onClick={() => localStorage.setItem('toddlebee-preview-mode', 'true')} data-testid="link-featured-fractions">{t.exploreLesson}<ArrowRight size={17} /></Link>
      </div>
      <div className="notice">{t.featuredDetails}</div>
    </section>
    <section className="feature-band" aria-label={t.benefitsLabel}>
      <article className="feature-tile"><div className="feature-icon"><BookOpen size={21} /></div><h3>{t.benefitLanguageTitle}</h3><p>{t.benefitLanguage}</p></article>
      <article className="feature-tile"><div className="feature-icon"><Heart size={21} /></div><h3>{t.benefitPaceTitle}</h3><p>{t.benefitPace}</p></article>
      <article className="feature-tile"><div className="feature-icon"><Compass size={21} /></div><h3>{t.benefitProgressTitle}</h3><p>{t.benefitProgress}</p></article>
      <article className="feature-tile"><div className="feature-icon"><Lightbulb size={21} /></div><h3>{t.benefitSupportTitle}</h3><p>{t.benefitSupport}</p></article>
      <article className="feature-tile"><div className="feature-icon"><ShieldCheck size={21} /></div><h3>{t.benefitOversightTitle}</h3><p>{t.benefitOversight}</p></article>
    </section>
    <div style={{ textAlign: 'center', marginTop: 27 }}><span className="eyebrow">{t.tagline}</span></div>
  </main>;
}

const fallbackSections: LessonSection[] = [
  { id: 'fraction-whole', title: 'What is a fraction?', explanation: 'A fraction tells us how many equal parts we have out of all the equal parts in one whole.', alternative: 'Imagine one whole roti. If it is cut into equal pieces, each piece is a part of that whole.', visual: 'fraction-parts', order: 1 },
  { id: 'pizza-fourths', title: 'Pizza in four equal slices', explanation: 'This pizza has 4 equal slices. One slice out of 4 is one fourth, written 1/4.', alternative: 'Count the slices: there are 4 altogether. If you take just 1, you have 1 of the 4 equal pieces: 1/4.', visual: 'pizza-fourths', order: 2 },
  { id: 'numerator-denominator', title: 'Meet the numerator and denominator', explanation: 'In 3/5, the top number 3 is the numerator: the parts we have. The bottom number 5 is the denominator: all the equal parts.', alternative: 'The top number tells what we picked. The bottom number tells how many equal pieces the whole was split into.', visual: 'chocolate-bar', order: 3 },
  { id: 'equivalent-fractions', title: 'Different numbers, same amount', explanation: 'One half is the same amount as two fourths. So 1/2 and 2/4 are equivalent fractions.', alternative: 'Shade half a shape. Now split each half in two: the shaded part becomes 2 of 4 equal pieces, but it has not grown or shrunk.', visual: 'equivalent-halves', order: 4 },
  { id: 'everyday-challenge', title: 'A fruit-sharing challenge', explanation: 'An orange is divided into 4 equal pieces. If you eat 2 pieces, you ate 2/4 of the orange. That is also 1/2.', alternative: 'Point to the two pieces that were eaten. Two out of the four pieces are gone, so the fraction is 2/4.', visual: 'orange-slices', order: 5 }
];

function FractionVisual({ visual, language }: { visual: string; language: Language }) {
  const t = copy[language];
  const isEquivalent = visual === 'equivalent-halves';
  const isChocolate = visual === 'chocolate-bar';
  const isOrange = visual === 'orange-slices';
  const isPizza = visual === 'pizza-fourths';
  const isRoti = visual === 'fraction-parts';
  return <div className="lesson-visual" aria-label={`${t.pictureIt}: ${visual}`}>
    <div className="eyebrow">{t.pictureIt}</div>
    <svg viewBox="0 0 280 156" style={{ width: 'min(100%, 350px)', height: 156 }} role="img" aria-label={
      isEquivalent ? t.visualEquivalentAlt :
      isChocolate ? t.visualChocolateAlt :
      isOrange ? t.visualOrangeAlt :
      isPizza ? t.visualPizzaAlt :
      t.visualRotiAlt
    }>
      {(isPizza || isRoti) && <>
        {isPizza && <circle cx="140" cy="78" r="60" fill="#E98543" stroke="#102B50" strokeWidth="4" />}
        <circle cx="140" cy="78" r={isPizza ? 53 : 58} fill={isPizza ? '#FFE9A9' : '#F2C88E'} stroke="#102B50" strokeWidth="3" />
        <path d="M140 20V136M82 78H198" stroke="#102B50" strokeWidth="3" />
        <path d="M140 78L140 20A58 58 0 0 1 198 78Z" fill="#FFBF24" stroke="#102B50" strokeWidth="2" />
        {isPizza && <><circle cx="158" cy="49" r="5" fill="#FF9278" /><circle cx="177" cy="66" r="5" fill="#75C99B" /><circle cx="151" cy="69" r="5" fill="#FF9278" /></>}
      </>}
      {isChocolate && <>
        <rect x="48" y="31" width="184" height="94" rx="12" fill="#A85F43" stroke="#102B50" strokeWidth="4" />
        {Array.from({ length: 15 }, (_, index) => {
          const column = index % 5;
          const row = Math.floor(index / 5);
          return <rect key={index} x={56 + column * 35} y={39 + row * 29} width="31" height="25" rx="5" fill={column < 3 ? '#FFBF24' : '#E8A17A'} stroke="#102B50" strokeWidth="1.5" />;
        })}
      </>}
      {isEquivalent && <>
        <text x="23" y="30" fill="#102B50" fontSize="13" fontWeight="700">1/2</text>
        <rect x="23" y="40" width="100" height="34" rx="8" fill="#FFBF24" stroke="#102B50" strokeWidth="2" />
        <path d="M73 40v34" stroke="#102B50" strokeWidth="2" />
        <text x="153" y="30" fill="#102B50" fontSize="13" fontWeight="700">2/4</text>
        <rect x="153" y="40" width="100" height="34" rx="8" fill="#FFBF24" stroke="#102B50" strokeWidth="2" />
        <path d="M178 40v34M203 40v34M228 40v34" stroke="#102B50" strokeWidth="2" />
        <path d="M132 57h13m-5-5 5 5-5 5" fill="none" stroke="#102B50" strokeWidth="2" />
        <text x="82" y="111" fill="#53657B" fontSize="12" fontWeight="700">{t.visualSameAmount}</text>
      </>}
      {isOrange && <>
        <circle cx="140" cy="78" r="58" fill="#FFBF24" stroke="#102B50" strokeWidth="3" />
        <path d="M140 78L140 20A58 58 0 0 1 198 78Z" fill="#FF9278" stroke="#102B50" strokeWidth="2" />
        <path d="M140 78L198 78A58 58 0 0 1 140 136Z" fill="#FF9278" stroke="#102B50" strokeWidth="2" />
        <path d="M140 20V136M82 78H198" stroke="#102B50" strokeWidth="2.5" />
        <path d="M133 18q7-15 18-8" fill="none" stroke="#75C99B" strokeWidth="6" strokeLinecap="round" />
      </>}
    </svg>
    <strong>{isEquivalent ? '1/2 = 2/4' : isChocolate ? t.visualChocolateParts : isOrange ? t.visualOrangeParts : t.visualOneFourth}</strong>
  </div>;
}

function LessonPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const query = useGetFractionsLesson({ language });
  const recordEvent = useRecordLearningEvent();
  const explain = useExplainConcept();
  const speak = useSpeakExplanation();
  const voiceCatalog = useListNarrationVoices();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [alternative, setAlternative] = useState('');
  const [audioStatus, setAudioStatus] = useState<'idle' | 'playing' | 'paused' | 'unavailable'>('idle');
  const [audioUrl, setAudioUrl] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [audioMode, setAudioMode] = useState<'elevenlabs' | 'browser' | null>(null);
  const [audioSourceNotice, setAudioSourceNotice] = useState('');
  const previousLanguage = useRef(language);
  const [localError, setLocalError] = useState('');
  const [done, setDone] = useState(false);
  const data = query.data;
  const sections = data?.sections?.length ? [...data.sections].sort((a, b) => a.order - b.order) : fallbackSections;
  const active = sections[currentIndex];
  const previewMode = localStorage.getItem('toddlebee-preview-mode') === 'true';
  const sessionId = previewMode ? '' : localStorage.getItem('toddlebee-session-id') || '';
  const sample = previewMode || localStorage.getItem('toddlebee-session-sample') === 'true';
  const description = alternative || (language === 'ta' ? tamilLesson[active.id]?.explanation || active.explanation : active.explanation);
  const stopAudio = () => {
    audioRef.current?.pause();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    audioRef.current = null;
    utteranceRef.current = null;
    setAudioMode(null);
    setAudioUrl('');
    setAudioStatus('idle');
    setAudioSourceNotice('');
  };
  useEffect(() => {
    if (previousLanguage.current !== language) {
      stopAudio();
      previousLanguage.current = language;
    }
  }, [language]);
  const markComplete = () => {
    stopAudio();
    if (sessionId) recordEvent.mutate({ id: sessionId, data: { type: 'section_completed', sectionId: active.id } });
    if (currentIndex < sections.length - 1) setCurrentIndex((i) => i + 1);
    else {
      setDone(true);
      if (sessionId) recordEvent.mutate({ id: sessionId, data: { type: 'lesson_completed' } });
    }
    setAlternative('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const showAlternative = () => {
    stopAudio();
    setLocalError('');
    if (sessionId) {
      explain.mutate({ data: { sessionId, sectionId: active.id, language } }, {
        onSuccess: (result) => setAlternative(result.explanation),
        onError: () => setAlternative(language === 'ta' ? tamilLesson[active.id]?.alternative || active.alternative : active.alternative)
      });
    } else {
      setAlternative(language === 'ta' ? tamilLesson[active.id]?.alternative || active.alternative : active.alternative);
    }
  };
  const speakInBrowser = () => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setAudioStatus('unavailable');
      setAudioSourceNotice('');
      return;
    }
    const targetLang = language === 'ta' ? 'ta-IN' : 'en-US';
    const voiceList = window.speechSynthesis.getVoices();
    const browserVoice = voiceList.find((voice) => voice.lang.toLowerCase() === targetLang.toLowerCase());
    if (!browserVoice) {
      setAudioStatus('unavailable');
      setAudioSourceNotice('');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(description);
    utterance.lang = targetLang;
    utterance.voice = browserVoice;
    utterance.onend = () => setAudioStatus('idle');
    utterance.onerror = () => setAudioStatus('unavailable');
    utteranceRef.current = utterance;
    setAudioMode('browser');
    setAudioSourceNotice(language === 'ta' ? 'Using your device’s Tamil voice (ta-IN).' : 'Using your device’s English voice (en-US).');
    setAudioStatus('playing');
    window.speechSynthesis.speak(utterance);
  };
  const playAudio = () => {
    if (audioMode === 'elevenlabs' && audioRef.current && audioUrl) {
      if (audioStatus === 'playing') {
        audioRef.current.pause();
        setAudioStatus('paused');
      } else {
        if (audioRef.current.ended) audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => setAudioStatus('playing')).catch(() => setAudioStatus('unavailable'));
      }
      return;
    }
    if (audioMode === 'browser') {
      if (audioStatus === 'playing') {
        window.speechSynthesis.pause();
        setAudioStatus('paused');
      } else if (audioStatus === 'paused') {
        window.speechSynthesis.resume();
        setAudioStatus('playing');
      } else speakInBrowser();
      return;
    }
    const verifiedVoice = voiceCatalog.data?.available
      ? voiceCatalog.data.voices.find((voice) => {
        const voiceLanguage = voice.language.toLowerCase();
        return voice.childFriendly && (voiceLanguage === language || voiceLanguage.startsWith(`${language}-`));
      })
      : undefined;
    if (!verifiedVoice) {
      speakInBrowser();
      return;
    }
    setAudioSourceNotice('');
    setAudioStatus('idle');
    speak.mutate({ data: { text: description, language, voiceId: verifiedVoice.id } }, {
      onSuccess: (blob) => {
        if (!(blob instanceof Blob) || blob.size === 0) { speakInBrowser(); return; }
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        const audio = new Audio(url);
        audioRef.current = audio;
        setAudioMode('elevenlabs');
        audio.onended = () => setAudioStatus('idle');
        audio.onerror = () => speakInBrowser();
        audio.play().then(() => setAudioStatus('playing')).catch(() => speakInBrowser());
      },
      onError: () => speakInBrowser()
    });
  };
  if (query.isLoading) return <main className="page"><div className="skeleton" style={{ width: 260 }} /><div className="skeleton" style={{ height: 280, marginTop: 20 }} role="status" aria-label={t.loading} /></main>;
  return <main className="page">
    <div className="section-heading"><div><div className="eyebrow">{t.gradeSubject}</div><h1>{t.lessonTitle}</h1><p>{t.lessonIntro}</p></div>
      <Link href="/quiz" className="btn btn-secondary btn-small" data-testid="link-lesson-practice">{t.quiz}<ArrowRight size={17} /></Link>
    </div>
    {sample && <div className="notice" data-testid="status-lesson-sample">{previewMode ? t.lessonSample : t.sampleSessionNotice}</div>}
    {query.isError && <div className="notice" role="status" data-testid="status-lesson-fallback">{t.lessonFallbackError} <button className="btn btn-small" onClick={() => query.refetch()} data-testid="button-retry-lesson">{t.retry}</button></div>}
    <div className="lesson-layout" style={{ marginTop: 20 }}>
      <aside className="lesson-side">
        <h3>{t.pathTitle}</h3>
        <div className="step-list">{sections.map((section, index) => <button key={section.id} className={`lesson-step ${currentIndex === index ? 'selected' : ''}`} onClick={() => { stopAudio(); setCurrentIndex(index); setAlternative(''); setDone(false); }} data-testid={`button-lesson-section-${section.id}`}><span className="step-dot">{index < currentIndex ? <Check size={15} /> : index + 1}</span><span>{language === 'ta' ? tamilLesson[section.id]?.title || section.title : section.title}</span></button>)}</div>
        <div className="progress-track" aria-label={`${Math.round((currentIndex + (done ? 1 : 0)) / sections.length * 100)}${t.percent} ${t.completeLabel}`}><span style={{ width: `${(currentIndex + (done ? 1 : 0)) / sections.length * 100}%` }} /></div>
        <small>{done ? t.allStepsComplete : `${t.step} ${currentIndex + 1} ${t.ofSteps} ${sections.length}`}</small>
      </aside>
      <article className="content-card" data-testid="card-lesson-section">
        {done ? <>
          <div className="feature-icon"><Check size={23} /></div><div className="eyebrow">{t.wonderfulWork}</div>
          <h2>{t.lessonDoneTitle}</h2><p>{t.lessonDoneBody}</p>
          <div className="content-actions"><Link href="/quiz" className="btn" data-testid="link-lesson-to-quiz">{t.quiz}<ArrowRight size={18} /></Link><Link href="/progress" className="btn btn-secondary" data-testid="link-lesson-to-progress">{t.progress}</Link></div>
        </> : <>
          <div className="eyebrow">{t.step} {currentIndex + 1} · {t.takeYourTime}</div>
          <h2 data-testid="text-active-lesson-title">{language === 'ta' ? tamilLesson[active.id]?.title || active.title : active.title}</h2>
          <p data-testid="text-lesson-explanation">{description}</p>
          <FractionVisual visual={active.visual} language={language} />
          {localError && <div className="notice status-error" role="alert" data-testid="status-lesson-action-error">{localError}</div>}
          <div className="content-actions">
            <button className="btn btn-secondary" onClick={playAudio} disabled={speak.isPending || voiceCatalog.isLoading} data-testid="button-read-aloud">
              {speak.isPending ? <AudioLines size={18} /> : audioStatus === 'playing' ? <Pause size={18} /> : <Volume2 size={18} />}
              {speak.isPending ? t.reading : audioStatus === 'playing' ? t.pauseNarration : audioStatus === 'paused' ? t.resumeNarration : audioMode ? t.replayNarration : t.read}
            </button>
            <button className="btn btn-secondary" onClick={showAlternative} disabled={explain.isPending} data-testid="button-alternative-explanation"><RefreshCw size={17} />{explain.isPending ? t.loading : t.tryAnother}</button>
            <button className="btn" onClick={markComplete} data-testid="button-next-lesson">{currentIndex === sections.length - 1 ? t.finishLesson : t.next}<ArrowRight size={18} /></button>
          </div>
          {audioStatus === 'unavailable' && <div className="notice" role="status" data-testid="status-audio-unavailable">{t.noVoiceAvailable}</div>}
          {audioSourceNotice && <div className="notice status-success" role="status" data-testid="status-audio-browser">{audioSourceNotice}</div>}
          {sample && <small className="muted" data-testid="text-session-sample">{t.lessonSample}</small>}
        </>}
      </article>
    </div>
  </main>;
}

const tamilLesson: Record<string, { title: string; explanation: string; alternative: string }> = {
  'fraction-whole': { title: 'பின்னம் என்றால் என்ன?', explanation: 'ஒரு முழுப் பொருளைச் சமமான பகுதிகளாகப் பிரித்தால், அதில் எத்தனை பகுதிகள் எடுக்கப்பட்டுள்ளன என்பதைப் பின்னம் காட்டுகிறது.', alternative: 'ஒரு முழு ரொட்டியை நினைத்துப் பாருங்கள். அதைச் சமமான துண்டுகளாக வெட்டினால், ஒவ்வொரு துண்டும் அந்த முழுப் பொருளின் ஒரு பகுதியாகும்.' },
  'pizza-fourths': { title: 'நான்கு சமமான துண்டுகளாக வெட்டிய பீட்சா', explanation: 'இந்தப் பீட்சா 4 சமமான துண்டுகளாகப் பிரிக்கப்பட்டுள்ளது. 4 துண்டுகளில் 1 துண்டு என்பது கால் பங்கு; அதை 1/4 என்று எழுதுகிறோம்.', alternative: 'துண்டுகளை எண்ணுங்கள்: மொத்தம் 4 உள்ளன. அதில் 1 துண்டை எடுத்தால், 4 சமமான பகுதிகளில் 1 பகுதி — அதாவது 1/4.' },
  'numerator-denominator': { title: 'மேலெண் மற்றும் கீழெண்ணை அறிந்துகொள்வோம்', explanation: '3/5-இல் மேலே உள்ள 3 மேலெண்; நம்மிடம் உள்ள பகுதிகளின் எண்ணிக்கை. கீழே உள்ள 5 கீழெண்; மொத்தச் சமமான பகுதிகளின் எண்ணிக்கை.', alternative: 'மேலெண் நாம் எடுத்த பகுதிகளைக் காட்டுகிறது. கீழெண் முழுப் பொருள் எத்தனை சமமான பகுதிகளாகப் பிரிக்கப்பட்டது என்பதைக் காட்டுகிறது.' },
  'equivalent-fractions': { title: 'எண்கள் வேறு, அளவு ஒன்று', explanation: 'ஒரு அரை என்பது நான்கு சமப் பகுதிகளில் இரண்டு பகுதிகளுக்குச் சமம். எனவே 1/2 மற்றும் 2/4 சமமான பின்னங்கள்.', alternative: 'ஒரு வடிவத்தின் பாதியை நிறமிடுங்கள். ஒவ்வொரு பாதியையும் இரண்டாகப் பிரித்தாலும், நிறமிட்ட பகுதி 4 சமமான பகுதிகளில் 2 பகுதிகளாகவே இருக்கும்; அதன் அளவு மாறாது.' },
  'everyday-challenge': { title: 'பழத்தைப் பகிரும் சவால்', explanation: 'ஒரு ஆரஞ்சுப் பழம் 4 சமமான துண்டுகளாகப் பிரிக்கப்பட்டுள்ளது. அதில் 2 துண்டுகளைச் சாப்பிட்டால், 2/4 பகுதியைச் சாப்பிட்டீர்கள். அதுவே 1/2 ஆகும்.', alternative: 'சாப்பிட்ட இரண்டு துண்டுகளை எண்ணுங்கள். நான்கு துண்டுகளில் இரண்டு சென்றுவிட்டன; ஆகவே பின்னம் 2/4.' }
};

function QuizPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const questionsQuery = useListQuizQuestions({ language });
  const submitAnswer = useSubmitQuizAnswer();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    feedback: string;
    hint?: string | null;
    nextAction: QuizAnswerResultNextAction;
    attemptNumber: number;
    repeatedDifficulty: boolean;
  } | null>(null);
  const [error, setError] = useState('');
  const questionStartedAt = useRef(performance.now());
  const previewMode = localStorage.getItem('toddlebee-preview-mode') === 'true';
  const sessionId = previewMode ? '' : localStorage.getItem('toddlebee-session-id') || '';
  const questions = (questionsQuery.data || []).slice(0, 5);
  const item = questions[index];
  const submit = () => {
    if (!selected || !sessionId) { setError(t.quizNoSession); return; }
    setError('');
    const responseTimeMs = Math.max(0, Math.min(3600000, Math.round(performance.now() - questionStartedAt.current)));
    submitAnswer.mutate({ data: { sessionId, questionId: item.id, selectedAnswerId: selected, hintUsed, responseTimeMs } }, {
      onSuccess: (answer) => {
        setResult({
          isCorrect: answer.isCorrect,
          feedback: answer.feedback,
          hint: answer.hint,
          nextAction: answer.nextAction,
          attemptNumber: answer.attemptNumber,
          repeatedDifficulty: answer.repeatedDifficulty
        });
        setHintUsed((used) => used || answer.hintUsed);
        if (!answer.isCorrect && answer.nextAction !== 'educator_review') setSelected('');
      },
      onError: () => setError(t.quizAnswerError)
    });
  };
  const nextQuestion = () => {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1); setSelected(''); setResult(null); setShowHint(false); setHintUsed(false); setError('');
      questionStartedAt.current = performance.now();
    } else {
      setIndex(questions.length);
    }
  };
  const useHint = () => {
    setShowHint(true); setHintUsed(true);
  };
  if (questionsQuery.isLoading) return <main className="page"><div className="skeleton" style={{ height: 38, width: 300 }} /><div className="skeleton" style={{ height: 420, marginTop: 22 }} role="status" aria-label={t.loadingQuestions} /></main>;
  if (questionsQuery.isError) return <main className="page"><div className="section-heading"><div><div className="eyebrow">{t.practiceLabel}</div><h1>{t.quiz}</h1></div></div><div className="notice status-error" role="alert" data-testid="status-quiz-load-error">{t.loadQuizError} <button className="btn btn-small" onClick={() => questionsQuery.refetch()} data-testid="button-retry-questions">{t.retry}</button></div></main>;
  if (!questions.length) return <main className="page"><div className="notice" role="status" data-testid="status-quiz-empty">{t.emptyQuiz}</div></main>;
  if (index >= questions.length) return <main className="page"><section className="quiz-card" style={{ textAlign: 'center' }}>
    <div className="feature-icon" style={{ margin: '0 auto 18px' }}><Sparkles size={23} /></div><div className="eyebrow">{t.quizComplete}</div>
    <h1 style={{ fontSize: 40 }}>{t.great}</h1><p>{t.quizCompleteBody.replace('{count}', String(questions.length))}</p>
    <p>{t.quizCompleteGentle}</p><div className="content-actions" style={{ justifyContent: 'center' }}><Link href="/progress" className="btn" data-testid="link-quiz-progress">{t.progress}<ArrowRight size={18} /></Link><Link href="/learn" className="btn btn-secondary" data-testid="link-quiz-lesson">{t.lesson}</Link></div>
  </section></main>;
  return <main className="page">
    <div className="section-heading"><div><div className="eyebrow">{t.practiceLabel}</div><h1>{t.quiz}</h1><p>{t.quizIntro}</p></div><div className="notice">{t.serverQuestions}</div></div>
    {!sessionId && <div className="notice" role="status" data-testid="status-quiz-no-session">{previewMode ? t.playLocalOnly : t.noSession} <Link href="/" data-testid="link-quiz-home">{t.home}</Link></div>}
    <section className="quiz-card" aria-labelledby="question-title">
      <div className="quiz-top"><span>{t.question} {index + 1} {t.of} {questions.length}</span><span>{index} {t.of} {questions.length} {t.questionFinished}</span></div>
      <div className="progress-track"><span style={{ width: `${index / questions.length * 100}%` }} /></div>
      <h2 className="question" id="question-title" data-testid="text-quiz-question">{item.prompt}</h2>
      <div className="answers" role="radiogroup" aria-label={t.chooseAnswer}>
        {item.options.map((option, answerIndex) => {
          const id = option.id;
          const locked = Boolean(result?.isCorrect || result?.nextAction === 'educator_review');
          return <button key={id} type="button" className={`answer-option ${selected === id ? 'chosen' : ''}`} aria-pressed={selected === id} disabled={locked || submitAnswer.isPending} onClick={() => setSelected(id)} data-testid={`button-answer-${index + 1}-${id}`}><span className="answer-letter">{String.fromCharCode(65 + answerIndex)}</span>{option.text}</button>;
        })}
      </div>
      {showHint && <div className="notice" role="status" data-testid="status-quiz-hint"><Lightbulb size={17} /> {t.hintWillReturn}</div>}
      {result && <div className={`feedback-box ${result.isCorrect ? 'status-success' : 'notice'}`} role="status" data-testid="status-quiz-feedback">
        <strong>{result.isCorrect ? t.great : t.tryAgain}</strong><br />{result.feedback}
        {!result.isCorrect && result.hint && <p data-testid="text-server-hint">{result.hint}</p>}
        {!result.isCorrect && result.nextAction === 'try_visual' && <div data-testid="status-alternate-visual"><p>{t.visualHelp}</p><FractionVisual language={language} visual={item.concept === 'numerator' || item.concept === 'denominator' ? 'chocolate-bar' : item.concept === 'equivalent fractions' ? 'equivalent-halves' : 'pizza-fourths'} /></div>}
        {!result.isCorrect && result.nextAction === 'educator_review' && <p data-testid="status-educator-review-requested">{t.educatorRequested}</p>}
        <small>{t.attempt} {result.attemptNumber}{result.repeatedDifficulty ? ` · ${t.educatorReviewShort}` : ''}</small>
      </div>}
      {error && <div className="notice status-error" role="alert" data-testid="status-quiz-error">{error}</div>}
      <div className="quiz-footer">
        <button className="btn btn-secondary" type="button" onClick={useHint} disabled={showHint || Boolean(result?.isCorrect || result?.nextAction === 'educator_review') || submitAnswer.isPending} data-testid="button-quiz-hint"><CircleHelp size={18} />{t.help}</button>
        {result?.isCorrect || result?.nextAction === 'educator_review'
          ? <button className="btn" type="button" onClick={nextQuestion} data-testid="button-next-question">{result.nextAction === 'educator_review' ? t.continuePractice : index === questions.length - 1 ? t.finishQuiz : t.nextQuestion}<ArrowRight size={18} /></button>
          : <button className="btn" type="button" onClick={submit} disabled={!selected || submitAnswer.isPending} data-testid="button-submit-answer">{submitAnswer.isPending ? t.checking : result ? t.tryAnswerAgain : t.checkAnswer}<ArrowRight size={18} /></button>}
      </div>
      {showHint && <small>{t.hint}</small>}
    </section>
  </main>;
}

function ProgressPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const progress = useGetLearningProgress({ sessionIds: getStoredSessionIds().join(',') });
  const data = progress.data;
  const localizeConcept = (concept: string) => ({
    'fraction parts': t.conceptFractionParts, numerator: t.conceptNumerator,
    denominator: t.conceptDenominator, 'equivalent fractions': t.conceptEquivalent,
    'fractions in daily life': t.conceptDaily, fractions: t.fallbackConcept
  }[concept.toLowerCase()] || concept);
  const localizeStatus = (status: string) => status === 'understood' ? t.statusUnderstood : status === 'improving' ? t.statusImproving : t.statusNeedsPractice;
  return <main className="page">
    <div className="section-heading"><div><div className="eyebrow">{t.learningStep}</div><h1>{t.progressTitle}</h1><p>{t.progressText}</p></div><Link href="/learn" className="btn" data-testid="link-progress-learn">{t.startPractice}<ArrowRight size={18} /></Link></div>
    {progress.isLoading ? <div className="dashboard-grid"><div className="skeleton" style={{ height: 150 }} /><div className="skeleton" style={{ height: 150 }} /></div> : progress.isError ? <div className="notice status-error" role="alert" data-testid="status-progress-error">{t.progressLoadingError} <button className="btn btn-small" onClick={() => progress.refetch()} data-testid="button-retry-progress">{t.retry}</button></div> : !data ? <div className="notice" data-testid="status-progress-empty">{t.noSession}</div> : <>
      {data.isSampleData && <div className="notice" data-testid="status-progress-sample">{t.sampleProgressDisclosure}</div>}
      <div className="dashboard-grid" style={{ marginTop: 17 }}>
        <section className="stat-card"><div className="stat-label">{t.sessions}</div><div className="stat-value" data-testid="value-session-count">{data.lessonsStarted}</div><span>{t.thoughtfulStep}</span></section>
        <section className="stat-card"><div className="stat-label">{t.completed}</div><div className="stat-value" data-testid="value-completed-count">{data.lessonsCompleted}</div><span>{t.practiceFamiliar}</span></section>
        <section className="stat-card"><div className="stat-label">{t.accuracy}</div><div className="stat-value" data-testid="value-final-accuracy">{Math.round(data.finalAccuracy * 100)}<small style={{ fontSize: 20 }}>{t.percent}</small></div><span>{t.afterHints}</span></section>
        <section className="stat-card"><div className="stat-label">{t.questions}</div><div className="stat-value" data-testid="value-question-count">{data.questionsAttempted}</div><span>{data.hintsUsed} {t.hintUsedCount}</span></section>
      </div>
      <div className="dashboard-grid" style={{ marginTop: 17 }}>
        <section className="panel"><h2>{t.concepts}</h2>{data.concepts.length ? data.concepts.map((concept, index) => <div className="concept-row" key={`${concept.concept}-${index}`} data-testid={`row-concept-${index}`}><div><strong>{localizeConcept(concept.concept)}</strong><div style={{ color: '#53657b', fontSize: 13, marginTop: 4 }}>{concept.attempts} {t.attempts}</div></div><span className={`tag ${concept.status === 'needs_practice' ? 'practice' : ''}`}>{localizeStatus(concept.status)}</span></div>) : <div className="notice">{t.noSession}</div>}</section>
        <section className="panel"><h2>{t.learningRhythm}</h2><div className="bar-chart" aria-label={t.chartAria}><div className="bar-col"><div className="bar" style={{ height: `${Math.max(8, data.firstAttemptAccuracy * 100)}%` }} /><span>{t.firstTry}</span></div><div className="bar-col"><div className="bar current" style={{ height: `${Math.max(8, data.finalAccuracy * 100)}%` }} /><span>{t.afterPractice}</span></div></div><div className="concept-row"><span>{t.firstAttemptAccuracy}</span><strong>{Math.round(data.firstAttemptAccuracy * 100)}{t.percent}</strong></div><div className="concept-row"><span>{t.learningTime}</span><strong>{data.learningMinutes ?? 0} {t.minutes}</strong></div></section>
        <section className="panel" style={{ gridColumn: '1 / -1' }}><h2>{t.recent}</h2>{data.recentSessions.length ? data.recentSessions.map((session) => <div className="concept-row" key={session.id} data-testid={`row-recent-session-${session.id}`}><div><strong>{session.lessonTitle.toLowerCase().includes('fraction') ? t.sessionLessonTitle : session.lessonTitle}</strong><div style={{ color: '#53657b', fontSize: 13 }}>{new Date(session.startedAt).toLocaleDateString(t.dateLocale)}</div></div>{session.isSample && <span className="tag practice">{t.sampleTag}</span>}</div>) : <p>{t.noSessions}</p>}</section>
      </div>
    </>}
  </main>;
}

function ParentPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const requestIntervention = useRequestIntervention();
  const [support, setSupport] = useState('');
  const [supportError, setSupportError] = useState('');
  const sessionId = localStorage.getItem('toddlebee-session-id') || '';
  const askForSupport = () => {
    if (!sessionId) { setSupportError(t.noSession); return; }
    setSupportError('');
    requestIntervention.mutate({ data: { sessionId } }, {
      onSuccess: (result) => setSupport(`${result.nextAction === 'educator_review' ? t.supportEducatorStrategy : t.supportVisualStrategy} ${result.explanation}`),
      onError: () => setSupportError(t.supportUnavailable)
    });
  };
  return <main className="page">
    <div className="eyebrow">{t.parentEyebrow}</div><h1>{t.parent}</h1><p style={{ color: '#53657b', maxWidth: 700, fontSize: 17, lineHeight: 1.7 }}>{t.grownupText} {t.parentBodyTail}</p>
    <div className="guidance-grid" style={{ marginTop: 24 }}>
      <section className="guidance-card tint"><div className="feature-icon"><Heart size={21} /></div><h2>{t.grownupTitle}</h2><p>{t.parentPrompt}</p><ul><li>{t.parentTipOne}</li><li>{t.parentTipTwo}</li><li>{t.parentTipThree}</li></ul></section>
      <section className="guidance-card"><div className="feature-icon"><ShieldCheck size={21} /></div><h2>{t.respectfulTitle}</h2><p>{t.respectfulBody}</p><p>{t.reviewHumanBody}</p><Link href="/progress" className="btn btn-secondary btn-small" data-testid="link-parent-progress">{t.viewProgress}<ArrowRight size={17} /></Link></section>
    </div>
    <div style={{ marginTop: 18 }}><Link href="/admin" className="btn btn-secondary btn-small" data-testid="link-parent-review-queue">{t.openReview}<ArrowRight size={16} /></Link></div>
    <section className="panel" style={{ marginTop: 18 }}><h2>{t.freshIdeaTitle}</h2><p>{t.freshIdeaBody}</p><button className="btn" onClick={askForSupport} disabled={requestIntervention.isPending} data-testid="button-request-support">{requestIntervention.isPending ? t.findingNextStep : t.suggestNextStep}<Sparkles size={17} /></button>
      {supportError && <div className="notice status-error" role="status" data-testid="status-support-error">{supportError}</div>}
      {support && <div className="notice status-success" style={{ marginTop: 14 }} data-testid="status-support-suggestion"><strong>{t.teachingSuggestion}</strong><br />{support}<br /><small>{t.localDemoGuidance}</small></div>}
    </section>
  </main>;
}

function AdminPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('toddlebee-demo-educator-access') === 'confirmed');
  const [acknowledged, setAcknowledged] = useState(false);
  if (!unlocked) return <main className="page">
    <section className="plan-card" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="feature-icon"><LockKeyhole size={21} /></div>
      <div className="eyebrow">{t.educatorAccessEyebrow}</div>
      <h1>{t.educatorAccessTitle}</h1>
      <p style={{ color: '#53657b', lineHeight: 1.7 }}>{t.educatorAccessIntro}</p>
      <div className="notice status-error" role="alert" data-testid="warning-admin-not-production">{t.educatorAccessWarning}</div>
      <label style={{ display: 'flex', gap: 11, alignItems: 'flex-start', margin: '20px 0', lineHeight: 1.5 }}>
        <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} data-testid="checkbox-admin-demo-acknowledgment" />
        <span>{t.educatorAcknowledge}</span>
      </label>
      <button className="btn" disabled={!acknowledged} onClick={() => { sessionStorage.setItem('toddlebee-demo-educator-access', 'confirmed'); setUnlocked(true); }} data-testid="button-enter-demo-review">{t.enterDemoQueue}<ArrowRight size={17} /></button>
    </section>
  </main>;
  return <AdminQueue />;
}

function AdminQueue() {
  const { language } = useLanguage();
  const t = copy[language];
  const reviews = useListEducatorReviews();
  const activity = useGetAgentActivity();
  const decide = useDecideEducatorReview();
  const client = useQueryClient();
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const localizeReviewStatus = (status: string) => ({
    pending: t.reviewPending, approved: t.reviewApproved, edited: t.reviewEdited, rejected: t.reviewRejected
  }[status] || status);
  const localizeConcept = (concept: string) => ({
    numerator: t.conceptNumerator, denominator: t.conceptDenominator,
    'equivalent fractions': t.conceptEquivalent, 'fractions in daily life': t.conceptDaily,
    'fraction parts': t.conceptFractionParts, fractions: t.fallbackConcept
  }[concept.toLowerCase()] || concept);
  const localizeAttempts = (summary: string) => {
    const parsed = /^(\d+) attempts on (.+); answer history is stored without a learner name\.$/.exec(summary);
    return parsed ? t.attemptsAnonymous.replace('{count}', parsed[1]) : summary;
  };
  const localizeActivity = (summary: string) => {
    if (language === 'en') return summary;
    if (summary === t.activityRepeated) return summary;
    const activityTranslations: Record<string, string> = {
      'Local demo coach noticed repeated difficulty and requested educator review.': t.activityRepeated,
      'Local demo coach recorded a correct answer and encouraged the learner to continue.': t.activityCorrect,
      'Local demo coach selected a supportive hint; no diagnosis was made.': t.activityHint,
      "Local demo intervention reviewed the learner's recent answer history.": t.activityIntervention
    };
    return activityTranslations[summary] || summary;
  };
  const localizeActivityStatus = (status: string) => ({
    completed: t.activityCompleted, pending: t.statusPending, failed: t.statusFailed, cancelled: t.statusCancelled, succeeded: t.statusSucceeded
  }[status] || status);
  const decision = (review: EducatorReview, choice: 'approve' | 'edit' | 'reject') => {
    setMessage('');
    setMessageIsError(false);
    decide.mutate({ id: review.id, data: { decision: choice, ...(choice === 'edit' ? { explanation: editing[review.id] || review.proposedExplanation } : {}) } }, {
      onSuccess: () => {
        const action = choice === 'approve' ? t.reviewApprovePast : choice === 'edit' ? t.reviewEditPast : t.reviewRejectPast;
        setMessage(t.reviewUpdated.replace('{action}', action));
        client.invalidateQueries({ queryKey: getListEducatorReviewsQueryKey() });
        client.invalidateQueries({ queryKey: getGetAgentActivityQueryKey() });
      },
      onError: () => { setMessage(t.reviewUpdateError); setMessageIsError(true); }
    });
  };
  return <main className="page">
    <div className="eyebrow">{t.demo} · {t.adminAdult}</div><h1>{t.adminTitle}</h1><p style={{ color: '#53657b', maxWidth: 700, lineHeight: 1.65 }}>{t.adminText} {t.adminQueueIntro}</p>
    <div className="notice" data-testid="status-admin-demo">{t.adminDemoWarning}</div>
    {message && <div className={`notice ${messageIsError ? 'status-error' : 'status-success'}`} role="status" data-testid="status-review-decision">{message}</div>}
    {reviews.isLoading ? <div className="skeleton" style={{ height: 140, marginTop: 16 }} role="status" aria-label={t.adminLoad} /> : reviews.isError ? <div className="notice status-error">{t.reviewUnavailable} <button className="btn btn-small" onClick={() => reviews.refetch()} data-testid="button-retry-reviews">{t.retry}</button></div> : reviews.data?.length ? reviews.data.map((review) => <article className="queue-card" key={review.id} data-testid={`card-review-${review.id}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}><strong>{localizeConcept(review.concept)}</strong><span className={`tag ${review.status === 'pending' ? 'practice' : ''}`}>{localizeReviewStatus(review.status)}</span></div>
      {review.isSample && <span className="tag practice" data-testid={`status-review-sample-${review.id}`}>{t.sampleItem}</span>}
      <p><strong>{t.attemptsLabel}</strong> {localizeAttempts(review.attemptSummary)}</p><p><strong>{t.reasonLabel}</strong> {review.reason === 'Repeated difficulty on this concept; educator review is recommended.' && language === 'ta' ? t.repeatedReviewReason : review.reason}</p>
      <p><strong>{t.proposedExplanation}</strong> {review.proposedExplanation}</p>
      {review.status === 'pending' && <><label htmlFor={`edit-review-${review.id}`}><strong>{t.editExplanation}</strong></label><textarea id={`edit-review-${review.id}`} value={editing[review.id] ?? review.proposedExplanation} onChange={(event) => setEditing((old) => ({ ...old, [review.id]: event.target.value }))} maxLength={1000} rows={3} style={{ width: '100%', margin: '9px 0 14px', border: '1px solid #e8decc', borderRadius: 13, padding: 12, color: '#102b50' }} data-testid={`input-review-explanation-${review.id}`} /><div className="queue-actions"><button className="btn btn-small" onClick={() => decision(review, 'approve')} disabled={decide.isPending} data-testid={`button-approve-${review.id}`}><Check size={16} />{t.approve}</button><button className="btn btn-small btn-secondary" onClick={() => decision(review, 'edit')} disabled={decide.isPending} data-testid={`button-edit-${review.id}`}>{t.saveEdited}</button><button className="btn btn-small btn-secondary" onClick={() => decision(review, 'reject')} disabled={decide.isPending} data-testid={`button-reject-${review.id}`}><X size={16} />{t.reject}</button></div></>}
    </article>) : <div className="notice" style={{ marginTop: 18 }} data-testid="status-review-empty">{t.noQueue}</div>}
    <section className="panel" style={{ marginTop: 20 }}><h2>{t.transparentActivity}</h2>{activity.isLoading ? <div className="skeleton" /> : activity.data?.length ? activity.data.map((item) => <div key={item.id} className="concept-row" data-testid={`row-agent-activity-${item.id}`}><div><strong>{localizeActivity(item.summary)}</strong><div style={{ color: '#53657b', fontSize: 13 }}>{item.provider === 'local_demo' ? t.localDemoProvider : 'AgenticOrg'} · {localizeActivityStatus(item.status)}</div></div>{item.needsHumanReview && <span className="tag practice">{t.humanReview}</span>}</div>) : <p>{t.noActivity}</p>}</section>
  </main>;
}

function PricingPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const checkout = useCreateDemoCheckout();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const localizePaymentStatus = (value: string) => ({
    unavailable: t.statusUnavailable, pending: t.statusPending, failed: t.statusFailed,
    cancelled: t.statusCancelled, succeeded: t.statusSucceeded
  }[value] || value);
  const checkAvailability = () => checkout.mutate({ data: { plan: 'plus_monthly' } }, {
    onSuccess: (result) => setStatus(result),
    onError: () => setStatus({ providerAvailable: false, status: 'unavailable', message: t.unavailable, reference: null })
  });
  return <main className="page">
    <div className="eyebrow">{t.pricingEyebrow}</div><h1>{t.pricing}</h1><p style={{ color: '#53657b', maxWidth: 670, fontSize: 17, lineHeight: 1.65 }}>{t.pricingText} {t.plansIntro}</p>
    <div className="pricing-grid">
      <section className="plan-card" data-testid="card-plan-free">
        <div className="eyebrow">{t.freeAvailable}</div><h2 className="font-display" style={{ fontSize: 30 }}>{t.freePlan}</h2><div className="price">{t.freePrice}</div>
        <p style={{ color: '#53657b', lineHeight: 1.65 }}>{t.freeDescription}</p>
        <ul><li>{t.freeFeatureOne}</li><li>{t.freeFeatureTwo}</li><li>{t.freeFeatureThree}</li><li>{t.freeFeatureFour}</li></ul>
        <Link href="/" className="btn btn-secondary" data-testid="link-free-start">{t.startLearning}<ArrowRight size={17} /></Link>
      </section>
      <section className="plan-card" data-testid="card-plan-plus">
        <div className="eyebrow">{t.plusProposed}</div><h2 className="font-display" style={{ fontSize: 30 }}>{t.plusTitle}</h2>
        <div className="price" data-testid="text-proposed-price">₹99<span style={{ fontSize: 17 }}>/month</span></div>
        <p style={{ color: '#53657b', lineHeight: 1.65 }}>{t.plusPriceDisclosure}</p>
        <ul><li>{t.plusFeatureOne}</li><li>{t.plusFeatureTwo}</li><li>{t.plusFeatureThree}</li><li>{t.plusFeatureFour}</li></ul>
        <div className="unavailable" role="status" data-testid="status-payment-unavailable"><strong>{t.checkoutUnavailableTitle}</strong><br />{t.noPurchase}</div>
        <button className="btn btn-secondary" style={{ marginTop: 18 }} onClick={checkAvailability} disabled={checkout.isPending} data-testid="button-check-payment">{checkout.isPending ? t.checkoutChecking : t.purchase}<LockKeyhole size={17} /></button>
        {status && <div className="notice" role="status" style={{ marginTop: 13 }} data-testid="status-checkout-result">{status.providerAvailable ? status.message : t.unavailable} · {localizePaymentStatus(status.status)}. {t.noPlanAccess}</div>}
      </section>
    </div>
  </main>;
}

function LocalizedNotFound() {
  const { language } = useLanguage();
  const t = copy[language];
  return <main className="page">
    <section className="content-card" style={{ textAlign: 'center', maxWidth: 720, margin: '40px auto' }}>
      <div className="feature-icon" style={{ margin: '0 auto 18px' }}><Compass size={22} /></div>
      <h1>{t.notFoundTitle}</h1>
      <p>{t.notFoundBody}</p>
      <Link href="/" className="btn" data-testid="link-not-found-home">{t.backHome}<ArrowRight size={18} /></Link>
    </section>
  </main>;
}

function LocalizedErrorFallback({ resetError }: ErrorFallbackProps) {
  const { language } = useLanguage();
  const t = copy[language];
  return <main className="page">
    <section className="content-card" style={{ textAlign: 'center', maxWidth: 720, margin: '40px auto' }}>
      <div className="feature-icon" style={{ margin: '0 auto 18px' }}><RefreshCw size={21} /></div>
      <h1>{t.errorTitle}</h1>
      <p>{t.errorBody}</p>
      <button type="button" className="btn" onClick={resetError} data-testid="button-retry-app-error">{t.retry}<ArrowRight size={18} /></button>
    </section>
  </main>;
}

function Router() {
  const { language } = useLanguage();
  const [location] = useLocation();
  useEffect(() => {
    if (location !== '/learn' && location !== '/quiz') {
      localStorage.removeItem('toddlebee-preview-mode');
    }
    const enMeta: Record<string, { title: string; description: string }> = {
      '/': { title: 'ToddleBee — Every child can learn', description: 'A patient bilingual learning companion for Grade 4 fractions, with visual practice and encouraging progress.' },
      '/learn': { title: 'Fractions lesson · ToddleBee', description: 'Explore fractions one small step at a time in English or Tamil.' },
      '/quiz': { title: 'Fractions practice · ToddleBee', description: 'Try five gentle Grade 4 fraction questions with helpful feedback.' },
      '/progress': { title: 'My progress · ToddleBee', description: 'See learning sessions, practice, and fraction concepts over time.' },
      '/parent': { title: 'Parent and educator guidance · ToddleBee', description: 'Support a child’s fraction learning with thoughtful prompts and human guidance.' },
      '/admin': { title: 'Educator demo review · ToddleBee', description: 'Demo-only review queue for educator guidance. Not production security.' },
      '/pricing': { title: 'Plans · ToddleBee', description: 'Explore the free ToddleBee learning path and proposed demo-only Plus plan.' }
    };
    const taMeta: Record<string, { title: string; description: string }> = {
      '/': { title: 'ToddleBee — ஒவ்வொரு குழந்தையும் கற்கலாம்', description: '4ஆம் வகுப்பு பின்னங்களைக் கற்க அன்பான தமிழ் மற்றும் ஆங்கிலக் கற்றல் துணை.' },
      '/learn': { title: 'பின்னங்கள் பாடம் · ToddleBee', description: 'தமிழ் அல்லது ஆங்கிலத்தில் பின்னங்களை ஒவ்வொரு படியாகக் கற்கலாம்.' },
      '/quiz': { title: 'பின்னங்கள் பயிற்சி · ToddleBee', description: 'உதவிகரமான பின்னூட்டத்துடன் ஐந்து பின்னக் கேள்விகளை முயற்சிக்கலாம்.' },
      '/progress': { title: 'என் முன்னேற்றம் · ToddleBee', description: 'உங்கள் கற்றல் அமர்வுகளையும் பின்னப் பயிற்சியையும் பாருங்கள்.' },
      '/parent': { title: 'பெற்றோர் மற்றும் ஆசிரியர் வழிகாட்டி · ToddleBee', description: 'குழந்தையின் பின்னக் கற்றலுக்கு ஊக்கமளிக்கும் வழிகாட்டுதல்.' },
      '/admin': { title: 'ஆசிரியர் டெமோ ஆய்வு · ToddleBee', description: 'ஆசிரியர் வழிகாட்டலுக்கான டெமோ ஆய்வு பகுதி. உண்மையான பாதுகாப்பு அல்ல.' },
      '/pricing': { title: 'திட்டங்கள் · ToddleBee', description: 'இலவச ToddleBee கற்றல் பாதையையும் முன்மொழியப்பட்ட Plus திட்டத்தையும் பாருங்கள்.' }
    };
    const meta = (language === 'ta' ? taMeta : enMeta)[location] ?? enMeta['/'];
    document.title = meta.title;
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = meta.description;
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      document.head.appendChild(icon);
    }
    icon.href = `${import.meta.env.BASE_URL}favicon.svg`;
    icon.type = 'image/svg+xml';
  }, [language, location]);
  return <ErrorBoundary FallbackComponent={LocalizedErrorFallback}><Shell><Switch>
    <Route path="/" component={HomePage} />
    <Route path="/learn" component={LessonPage} />
    <Route path="/quiz" component={QuizPage} />
    <Route path="/progress" component={ProgressPage} />
    <Route path="/parent" component={ParentPage} />
    <Route path="/admin" component={AdminPage} />
    <Route path="/pricing" component={PricingPage} />
    <Route component={LocalizedNotFound} />
  </Switch></Shell></ErrorBoundary>;
}

function AppExperience() {
  const [language, setLanguageValue] = useState<Language>(() => localStorage.getItem('toddlebee-language') === 'ta' ? 'ta' : 'en');
  const recordLearningEvent = useRecordLearningEvent();
  const setLanguage = (next: Language) => {
    if (next === language) return;
    const sessionId = localStorage.getItem('toddlebee-session-id');
    const isSamplePreview = localStorage.getItem('toddlebee-preview-mode') === 'true';
    if (sessionId && !isSamplePreview) {
      recordLearningEvent.mutate({ id: sessionId, data: { type: 'language_changed', language: next } });
    }
    setLanguageValue(next);
    localStorage.setItem('toddlebee-language', next);
  };
  const context = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={context}>
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter>
  </LanguageContext.Provider>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider>
    <AppExperience />
    <Toaster />
  </TooltipProvider></QueryClientProvider>;
}

export default App;
