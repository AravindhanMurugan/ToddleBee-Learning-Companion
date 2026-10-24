export type Language = "en" | "ta";

type SectionCopy = {
  id: string;
  title: Record<Language, string>;
  explanation: Record<Language, string>;
  alternative: Record<Language, string>;
  visual: string;
  order: number;
};

export const lessonSections: SectionCopy[] = [
  {
    id: "fraction-whole",
    title: { en: "What is a fraction?", ta: "பின்னம் என்றால் என்ன?" },
    explanation: {
      en: "A fraction tells us how many equal parts we have out of all the equal parts in one whole.",
      ta: "ஒரு முழுப் பொருளைச் சமமான பகுதிகளாகப் பிரித்தால், அதில் எத்தனை பகுதிகள் எடுக்கப்பட்டுள்ளன என்பதைப் பின்னம் காட்டுகிறது.",
    },
    alternative: {
      en: "Imagine one whole roti. If it is cut into equal pieces, each piece is a part of that whole.",
      ta: "ஒரு முழு ரொட்டியை நினைத்துப் பாருங்கள். அதைச் சமமான துண்டுகளாக வெட்டினால், ஒவ்வொரு துண்டும் அந்த முழுப் பொருளின் ஒரு பகுதியாகும்.",
    },
    visual: "fraction-parts",
    order: 1,
  },
  {
    id: "pizza-fourths",
    title: { en: "Pizza in four equal slices", ta: "நான்கு சமமான துண்டுகளாக வெட்டிய பீட்சா" },
    explanation: {
      en: "This pizza has 4 equal slices. One slice out of 4 is one fourth, written 1/4.",
      ta: "இந்தப் பீட்சா 4 சமமான துண்டுகளாகப் பிரிக்கப்பட்டுள்ளது. 4 துண்டுகளில் 1 துண்டு என்பது கால் பங்கு; அதை 1/4 என்று எழுதுகிறோம்.",
    },
    alternative: {
      en: "Count the slices: there are 4 altogether. If you take just 1, you have 1 of the 4 equal pieces: 1/4.",
      ta: "துண்டுகளை எண்ணுங்கள்: மொத்தம் 4 உள்ளன. அதில் 1 துண்டை எடுத்தால், 4 சமமான பகுதிகளில் 1 பகுதி — அதாவது 1/4.",
    },
    visual: "pizza-fourths",
    order: 2,
  },
  {
    id: "numerator-denominator",
    title: { en: "Meet the numerator and denominator", ta: "மேலெண் மற்றும் கீழெண்ணை அறிந்துகொள்வோம்" },
    explanation: {
      en: "In 3/5, the top number 3 is the numerator: the parts we have. The bottom number 5 is the denominator: all the equal parts.",
      ta: "3/5-இல் மேலே உள்ள 3 மேலெண்; நம்மிடம் உள்ள பகுதிகளின் எண்ணிக்கை. கீழே உள்ள 5 கீழெண்; மொத்தச் சமமான பகுதிகளின் எண்ணிக்கை.",
    },
    alternative: {
      en: "The top number tells what we picked. The bottom number tells how many equal pieces the whole was split into.",
      ta: "மேலெண் நாம் எடுத்த பகுதிகளைக் காட்டுகிறது. கீழெண் முழுப் பொருள் எத்தனை சமமான பகுதிகளாகப் பிரிக்கப்பட்டது என்பதைக் காட்டுகிறது.",
    },
    visual: "chocolate-bar",
    order: 3,
  },
  {
    id: "equivalent-fractions",
    title: { en: "Different numbers, same amount", ta: "எண்கள் வேறு, அளவு ஒன்று" },
    explanation: {
      en: "One half is the same amount as two fourths. So 1/2 and 2/4 are equivalent fractions.",
      ta: "ஒரு அரை என்பது நான்கு சமப் பகுதிகளில் இரண்டு பகுதிகளுக்குச் சமம். எனவே 1/2 மற்றும் 2/4 சமமான பின்னங்கள்.",
    },
    alternative: {
      en: "Shade half a shape. Now split each half in two: the shaded part becomes 2 of 4 equal pieces, but it has not grown or shrunk.",
      ta: "ஒரு வடிவத்தின் பாதியை நிறமிடுங்கள். ஒவ்வொரு பாதியையும் இரண்டாகப் பிரித்தாலும், நிறமிட்ட பகுதி 4 சமமான பகுதிகளில் 2 பகுதிகளாகவே இருக்கும்; அதன் அளவு மாறாது.",
    },
    visual: "equivalent-halves",
    order: 4,
  },
  {
    id: "everyday-challenge",
    title: { en: "A fruit-sharing challenge", ta: "பழத்தைப் பகிரும் சவால்" },
    explanation: {
      en: "An orange is divided into 4 equal pieces. If you eat 2 pieces, you ate 2/4 of the orange. That is also 1/2.",
      ta: "ஒரு ஆரஞ்சுப் பழம் 4 சமமான துண்டுகளாகப் பிரிக்கப்பட்டுள்ளது. அதில் 2 துண்டுகளைச் சாப்பிட்டால், 2/4 பகுதியைச் சாப்பிட்டீர்கள். அதுவே 1/2 ஆகும்.",
    },
    alternative: {
      en: "Point to the two pieces that were eaten. Two out of the four pieces are gone, so the fraction is 2/4.",
      ta: "சாப்பிட்ட இரண்டு துண்டுகளை எண்ணுங்கள். நான்கு துண்டுகளில் இரண்டு சென்றுவிட்டன; ஆகவே பின்னம் 2/4.",
    },
    visual: "orange-slices",
    order: 5,
  },
];

type QuizQuestion = {
  id: string;
  concept: string;
  order: number;
  prompt: Record<Language, string>;
  options: { id: string; text: Record<Language, string> }[];
  correctAnswerId: string;
  hint: Record<Language, string>;
  correctFeedback: Record<Language, string>;
  incorrectFeedback: Record<Language, string>;
};

export const quizQuestions: QuizQuestion[] = [
  {
    id: "identify-fraction",
    concept: "fraction parts",
    order: 1,
    prompt: {
      en: "A pizza is split into 4 equal slices. What fraction is 1 slice?",
      ta: "ஒரு பீட்சா 4 சமமான துண்டுகளாகப் பிரிக்கப்பட்டுள்ளது. 1 துண்டு என்ன பின்னம்?",
    },
    options: [
      { id: "one-fourth", text: { en: "1/4", ta: "1/4" } },
      { id: "one-half", text: { en: "1/2", ta: "1/2" } },
      { id: "four-fourths", text: { en: "4/4", ta: "4/4" } },
      { id: "one-third", text: { en: "1/3", ta: "1/3" } },
    ],
    correctAnswerId: "one-fourth",
    hint: {
      en: "Count all the equal slices, then count the one slice you chose.",
      ta: "மொத்தச் சமமான துண்டுகளையும் எண்ணுங்கள்; பிறகு நீங்கள் எடுத்த ஒரு துண்டை எண்ணுங்கள்.",
    },
    correctFeedback: { en: "That’s right! One of four equal parts is 1/4.", ta: "சரி! நான்கு சமமான பகுதிகளில் ஒன்று 1/4." },
    incorrectFeedback: { en: "Good try. Let’s count the equal parts together.", ta: "நல்ல முயற்சி. சமமான பகுதிகளை ஒன்றாக எண்ணிப் பார்ப்போம்." },
  },
  {
    id: "find-numerator",
    concept: "numerator",
    order: 2,
    prompt: {
      en: "In the fraction 3/5, which number is the numerator?",
      ta: "3/5 என்ற பின்னத்தில் மேலெண் எது?",
    },
    options: [
      { id: "three", text: { en: "3", ta: "3" } },
      { id: "five", text: { en: "5", ta: "5" } },
      { id: "eight", text: { en: "8", ta: "8" } },
      { id: "one", text: { en: "1", ta: "1" } },
    ],
    correctAnswerId: "three",
    hint: { en: "The numerator is the number on top.", ta: "மேலெண் பின்னத்தின் மேலே எழுதப்படும் எண்." },
    correctFeedback: { en: "Yes! The numerator is the top number: 3.", ta: "ஆம்! மேலெண் மேலே உள்ள எண்: 3." },
    incorrectFeedback: { en: "Let’s look at the top number in the fraction.", ta: "பின்னத்தில் மேலே உள்ள எண்ணைப் பார்ப்போம்." },
  },
  {
    id: "find-denominator",
    concept: "denominator",
    order: 3,
    prompt: {
      en: "In 2/6, how many equal parts make up the whole?",
      ta: "2/6-இல் முழுப் பொருள் எத்தனை சமமான பகுதிகளாகப் பிரிக்கப்பட்டுள்ளது?",
    },
    options: [
      { id: "six-parts", text: { en: "6 parts", ta: "6 பகுதிகள்" } },
      { id: "two-parts", text: { en: "2 parts", ta: "2 பகுதிகள்" } },
      { id: "eight-parts", text: { en: "8 parts", ta: "8 பகுதிகள்" } },
      { id: "one-part", text: { en: "1 part", ta: "1 பகுதி" } },
    ],
    correctAnswerId: "six-parts",
    hint: { en: "The denominator is the bottom number. It tells all the equal parts.", ta: "கீழெண் கீழே உள்ள எண். அது மொத்தச் சமமான பகுதிகளைக் காட்டுகிறது." },
    correctFeedback: { en: "You got it! The denominator 6 tells us there are 6 equal parts.", ta: "சரியாகக் கண்டீர்கள்! கீழெண் 6 என்பதால் 6 சமமான பகுதிகள் உள்ளன." },
    incorrectFeedback: { en: "Let’s use the bottom number to count all the parts.", ta: "மொத்தப் பகுதிகளை அறிய கீழே உள்ள எண்ணைப் பயன்படுத்துவோம்." },
  },
  {
    id: "equivalent-fraction",
    concept: "equivalent fractions",
    order: 4,
    prompt: {
      en: "Which fraction is equal to 1/2?",
      ta: "1/2-க்குச் சமமான பின்னம் எது?",
    },
    options: [
      { id: "two-fourths", text: { en: "2/4", ta: "2/4" } },
      { id: "one-fourth", text: { en: "1/4", ta: "1/4" } },
      { id: "three-fourths", text: { en: "3/4", ta: "3/4" } },
      { id: "one-third", text: { en: "1/3", ta: "1/3" } },
    ],
    correctAnswerId: "two-fourths",
    hint: { en: "Imagine splitting each half into two equal pieces.", ta: "ஒவ்வொரு பாதியையும் இரண்டு சமமான துண்டுகளாகப் பிரித்துப் பாருங்கள்." },
    correctFeedback: { en: "Exactly! 1/2 and 2/4 show the same amount.", ta: "அப்படியே! 1/2 மற்றும் 2/4 ஒரே அளவைக் காட்டுகின்றன." },
    incorrectFeedback: { en: "Try picturing one shape split into two, then four equal parts.", ta: "ஒரு வடிவத்தை முதலில் 2 பகுதிகளாகவும் பிறகு 4 சமமான பகுதிகளாகவும் நினைத்துப் பாருங்கள்." },
  },
  {
    id: "fruit-sharing",
    concept: "fractions in daily life",
    order: 5,
    prompt: {
      en: "You eat 2 pieces of an orange cut into 4 equal pieces. What fraction did you eat?",
      ta: "4 சமமான துண்டுகளாக வெட்டிய ஆரஞ்சில் 2 துண்டுகளைச் சாப்பிட்டீர்கள். நீங்கள் சாப்பிட்ட பின்னம் எது?",
    },
    options: [
      { id: "two-fourths", text: { en: "2/4", ta: "2/4" } },
      { id: "one-fourth", text: { en: "1/4", ta: "1/4" } },
      { id: "four-halves", text: { en: "4/2", ta: "4/2" } },
      { id: "one-third", text: { en: "1/3", ta: "1/3" } },
    ],
    correctAnswerId: "two-fourths",
    hint: { en: "How many pieces did you eat? How many equal pieces were there altogether?", ta: "எத்தனை துண்டுகளைச் சாப்பிட்டீர்கள்? மொத்தம் எத்தனை சமமான துண்டுகள் இருந்தன?" },
    correctFeedback: { en: "That’s it! 2 of the 4 equal pieces is 2/4.", ta: "சரிதான்! 4 சமமான துண்டுகளில் 2 துண்டுகள் என்பது 2/4." },
    incorrectFeedback: { en: "Let’s count the pieces eaten and the pieces altogether.", ta: "சாப்பிட்ட துண்டுகளையும் மொத்தத் துண்டுகளையும் எண்ணிப் பார்ப்போம்." },
  },
];

export function getLesson(language: Language) {
  return {
    id: "fractions-grade-4",
    title: language === "ta" ? "பின்னங்களை அறிந்துகொள்வோம்" : "Discover Fractions",
    grade: 4,
    subject: language === "ta" ? "கணிதம்" : "Mathematics",
    sections: lessonSections.map((section) => ({
      id: section.id,
      title: section.title[language],
      explanation: section.explanation[language],
      alternative: section.alternative[language],
      visual: section.visual,
      order: section.order,
    })),
  };
}

export function getQuizQuestions(language: Language) {
  return quizQuestions.map((question) => ({
    id: question.id,
    concept: question.concept,
    prompt: question.prompt[language],
    options: question.options.map((option) => ({
      id: option.id,
      text: option.text[language],
    })),
    order: question.order,
  }));
}

export function getQuestion(questionId: string) {
  return quizQuestions.find((question) => question.id === questionId);
}

export function getAlternative(sectionId: string, language: Language) {
  const section = lessonSections.find((item) => item.id === sectionId);
  return section?.alternative[language];
}
