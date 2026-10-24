import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Check, Flower2, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';

type Language = 'en' | 'ta';
type LotusProgress = { phaseIndex: number; actions: boolean[]; confirmations: boolean[] };
const STORAGE_KEY = 'toddlebee-clay-lotus-progress';
const phaseCount = 5;
const freshProgress = (): LotusProgress => ({ phaseIndex: 0, actions: Array(phaseCount).fill(false), confirmations: Array(phaseCount).fill(false) });
function readProgress(): LotusProgress {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Partial<LotusProgress> | null;
    if (!saved || !Array.isArray(saved.actions) || !Array.isArray(saved.confirmations)) return freshProgress();
    const confirmations = Array.from({ length: phaseCount }, (_, index) => saved.confirmations?.[index] === true);
    const actions = Array.from({ length: phaseCount }, (_, index) => saved.actions?.[index] === true);
    const furthest = confirmations.findIndex((done) => !done);
    return { phaseIndex: Math.max(0, Math.min(phaseCount - 1, Number.isInteger(saved.phaseIndex) ? saved.phaseIndex as number : 0, furthest < 0 ? phaseCount - 1 : furthest)), actions, confirmations };
  } catch {
    return freshProgress();
  }
}

const phaseCopy = [
  { title: ['Prepare safe materials', 'பாதுகாப்பான பொருட்களைத் தயார் செய்'], guide: ['With a grown-up, choose non-toxic clay and cover your work surface. Wash hands before you begin.', 'பெரியவருடன் நச்சில்லாத களிமண்ணைத் தேர்ந்தெடுத்து, வேலை இடத்தை மூடு. தொடங்கும் முன் கைகளைக் கழுவு.'], action: ['Tap each safe-start check', 'பாதுகாப்புத் தயாரிப்புகளைத் தொடு'] },
  { title: ['Form the center', 'மையத்தை உருவாக்கு'], guide: ['Roll one small, smooth ball. Press it gently into a low, rounded center for your lotus.', 'ஒரு சிறிய மென்மையான உருண்டையை உருட்டு. தாமரையின் மையமாக மெதுவாக அழுத்தி வட்டமாக்கு.'], action: ['Trace a circle in the air', 'காற்றில் ஒரு வட்டம் வரை'] },
  { title: ['Make and arrange petals', 'இதழ்களைச் செய்து அடுக்கு'], guide: ['Flatten a few small clay balls into soft petals. Place them around the center, overlapping gently.', 'சிறிய களிமண் உருண்டைகளை மென்மையான இதழ்களாகத் தட்டு. மையத்தைச் சுற்றி மெதுவாக அடுக்கு.'], action: ['Count five petals', 'ஐந்து இதழ்களை எண்ணு'] },
  { title: ['Add a stem and leaves', 'தண்டும் இலைகளும் சேர்'], guide: ['Roll a short stem and press on two broad leaves. Keep every edge soft and rounded.', 'சிறிய தண்டை உருட்டி, இரண்டு அகலமான இலைகளைப் பொருத்து. எல்லா விளிம்புகளையும் மென்மையாக வை.'], action: ['Point to the stem and leaves', 'தண்டையும் இலைகளையும் காட்டு'] },
  { title: ['Dry and finish gently', 'உலர்த்தி மெதுவாக முடி'], guide: ['Let the lotus dry as the clay instructions say. Ask a grown-up before adding any paint.', 'களிமண் வழிமுறையின்படி தாமரையை உலரவிடு. வண்ணம் பூசுவதற்கு முன் பெரியவரிடம் கேள்.'], action: ['Choose a safe drying spot', 'பாதுகாப்பான உலர்த்தும் இடத்தைத் தேர்ந்தெடு'] },
];

export function LotusCraftPage({ language }: { language: Language }) {
  const ta = language === 'ta';
  const [progress, setProgress] = useState<LotusProgress>(readProgress);
  const [ready, setReady] = useState([false, false, false]);
  const [celebrate, setCelebrate] = useState(false);
  const labels = useMemo(() => ({
    home: ta ? 'முகப்பு' : 'Home', ganesha: ta ? 'விநாயகர் கைவினை' : 'Ganesha craft',
    title: ta ? 'களிமண் தாமரை செய்வோம்' : 'Make a clay lotus',
    intro: ta ? 'ஒவ்வொரு மென்மையான படியாகச் செய். முன்னேற்றம் இந்தச் சாதனத்தில் மட்டுமே சேமிக்கப்படும்.' : 'Build your lotus one gentle phase at a time. Progress stays on this device only.',
    phase: ta ? 'படி' : 'Phase', of: ta ? 'இல்' : 'of', progress: ta ? 'முன்னேற்றம்' : 'Your progress',
    complete: ta ? 'முடிந்தது' : 'complete', mini: ta ? 'சிறிய செயல்' : 'Mini action',
    actionBtn: ta ? 'சிறிய செயலை முடி' : 'Complete the mini action',
    confirm: ta ? 'உண்மையான களிமண் படியை முடித்தேன்' : 'I finished this real-clay step',
    confirmed: ta ? 'உண்மையான களிமண் படி உறுதிசெய்யப்பட்டது' : 'Physical clay step confirmed',
    disclaimer: ta ? 'இந்தச் செயலி உண்மையான களிமண் வேலையைச் சரிபார்க்க முடியாது. இந்த உறுதிப்படுத்தல் உன் சொந்த நினைவூட்டல் மட்டுமே.' : 'This app cannot verify physical clay work. Your confirmation is only your own reminder.',
    safety: ta ? 'பாதுகாப்பு: பெரியவர் மேற்பார்வை அவசியம். கூர்மையான கருவிகள் வேண்டாம். களிமண்ணைச் சாப்பிடாதே. பாதுகாப்பான, நச்சில்லாத பொருட்களைப் பயன்படுத்து.' : 'Safety: Adult supervision is required. No sharp tools. Do not eat clay. Use safe, non-toxic materials.',
    reset: ta ? 'மீண்டும் தொடங்கு' : 'Reset activity',
    resetConfirm: ta ? 'இந்தச் செயலியின் உள்ளூர் முன்னேற்றத்தை நீக்கவா?' : 'Clear this activity’s local progress and start again?',
    doneTitle: ta ? 'தாமரை மலர்ந்துவிட்டது!' : 'Your lotus has bloomed!',
    doneBody: ta ? 'நிதானமாகவும் கவனமாகவும் செய்தாய். உன் உண்மையான களிமண் வேலையை இந்தச் செயலி சரிபார்க்க முடியாது.' : 'You worked with patience and care. The app cannot verify the physical clay work.',
    ready: ta ? 'தயாரிப்பு சரிபார்ப்பு' : 'Safe-start check',
    unverified: ta ? 'உண்மையான வேலையை முடித்த பிறகே உறுதிப்படுத்து.' : 'Only confirm after completing the real clay step.',
  }), [ta]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }, [progress]);
  const phase = progress.phaseIndex;
  const isComplete = progress.confirmations.every(Boolean);
  const actionDone = progress.actions[phase];
  const toggleAction = () => setProgress((old) => {
    const actions = [...old.actions]; actions[phase] = !actions[phase]; return { ...old, actions };
  });
  const confirmPhase = () => {
    if (!progress.actions[phase]) return;
    const confirmations = [...progress.confirmations]; confirmations[phase] = true;
    setProgress((old) => ({ ...old, confirmations, phaseIndex: Math.min(phaseCount - 1, phase + 1) }));
    if (confirmations.every(Boolean)) setCelebrate(true);
  };
  const restart = () => {
    if (window.confirm(labels.resetConfirm)) {
      setProgress(freshProgress()); setReady([false, false, false]); setCelebrate(false);
    }
  };
  const stage = (n: number) => progress.confirmations[n] || phase > n;
  return <main className="page craft-page lotus-page">
    <div className="craft-topline">
      <Link href="/" className="craft-back" data-testid="link-lotus-home"><ArrowLeft size={17} />{labels.home}</Link>
      <div className="craft-crosslinks"><Link href="/craft" data-testid="link-lotus-ganesha">{labels.ganesha}</Link><button className="craft-reset" type="button" onClick={restart} data-testid="button-lotus-reset"><RotateCcw size={16} />{labels.reset}</button></div>
    </div>
    <header className="craft-heading">
      <div><div className="eyebrow">{ta ? 'மெதுவாகச் செய்யும் உள்ளூர் கைவினை' : 'A gentle, local-only clay craft'}</div><h1>{labels.title}</h1><p>{labels.intro}</p></div>
      <div className="craft-progress-chip"><span>{progress.confirmations.filter(Boolean).length} / {phaseCount}</span><small>{labels.complete}</small></div>
    </header>
    <div className="craft-progress-track" role="progressbar" aria-label={labels.progress} aria-valuemin={0} aria-valuemax={phaseCount} aria-valuenow={progress.confirmations.filter(Boolean).length} data-testid="status-lotus-progressbar"><span style={{ width: `${progress.confirmations.filter(Boolean).length / phaseCount * 100}%` }} /></div>
    <div className="craft-layout">
      <section className={`craft-art-panel lotus-art-panel ${celebrate ? 'craft-celebrate' : ''}`} aria-label={ta ? 'மெதுவாக உருவாகும் களிமண் தாமரை' : 'Clay lotus taking shape'}>
        <div className="craft-art-caption"><Sparkles size={17} />{ta ? 'உன் தாமரை மெதுவாக மலர்கிறது' : 'Your lotus, petal by petal'}</div>
        <svg className="lotus-svg" viewBox="0 0 360 360" role="img" aria-label={ta ? 'படிப்படியாக உருவாகும் தாமரை' : 'A lotus model that grows with your progress'} data-testid="illustration-craft-lotus">
          <ellipse className="lotus-shadow" cx="180" cy="316" rx="105" ry="15" />
          <g className="lotus-piece lotus-stem" data-visible={stage(3) || stage(4) ? 'yes' : 'no'}><path d="M180 276 Q175 236 180 191" /><path d="M177 245 Q137 238 126 212 Q157 210 178 231Z" /><path d="M182 232 Q213 215 235 222 Q220 247 183 250Z" /></g>
          <g className="lotus-piece lotus-petals lotus-back" data-visible={stage(2) || stage(3) || stage(4) ? 'yes' : 'no'}>
            <path d="M180 205 C145 190 132 158 151 125 C171 143 183 169 180 205Z" />
            <path d="M180 205 C215 190 228 158 209 125 C189 143 177 169 180 205Z" />
            <path d="M180 205 C151 179 153 143 180 111 C207 143 209 179 180 205Z" />
            <path d="M180 205 C126 206 105 181 112 151 C145 157 166 174 180 205Z" />
            <path d="M180 205 C234 206 255 181 248 151 C215 157 194 174 180 205Z" />
          </g>
          <g className="lotus-piece lotus-center" data-visible={stage(1) || stage(2) || stage(3) || stage(4) ? 'yes' : 'no'}><ellipse cx="180" cy="205" rx="35" ry="25" /><ellipse className="lotus-highlight" cx="168" cy="196" rx="10" ry="4" /></g>
          <g className="lotus-piece lotus-finish" data-visible={stage(4) ? 'yes' : 'no'}><path d="M156 207q24 15 48 0" fill="none" /><circle cx="180" cy="204" r="4" /></g>
        </svg>
        <div className="craft-art-note" data-testid="status-lotus-model">{ta ? 'முடித்த படிகளுடன் மாதிரி வளர்கிறது' : 'The model builds as you confirm each phase'}</div>
      </section>
      <section className="craft-step-panel" aria-labelledby="lotus-phase-title">
        {isComplete ? <div className="craft-finish" role="status" data-testid="status-lotus-complete"><div className="craft-finish-icon"><Check size={30} /></div><h2>{labels.doneTitle}</h2><p>{labels.doneBody}</p><p>{labels.disclaimer}</p><button className="btn btn-secondary" onClick={restart} type="button" data-testid="button-lotus-restart-finish"><RotateCcw size={16} />{labels.reset}</button></div> : <>
          <div className="craft-step-meta"><span>{labels.phase} {phase + 1} {labels.of} {phaseCount}</span><span>{progress.confirmations.filter(Boolean).length} / {phaseCount}</span></div>
          <div className="craft-step-track"><span style={{ width: `${(phase + 1) / phaseCount * 100}%` }} /></div>
          <h2 id="lotus-phase-title" data-testid="text-lotus-phase-title">{phaseCopy[phase].title[ta ? 1 : 0]}</h2>
          <p className="craft-guidance" data-testid="text-lotus-phase-guidance">{phaseCopy[phase].guide[ta ? 1 : 0]}</p>
          {phase === 0 && <div className="craft-ready-check"><strong>{labels.ready}</strong>{[
            ['An adult is here', 'பெரியவர் அருகில் இருக்கிறார்'],
            ['Hands washed and table covered', 'கைகளைக் கழுவி மேசையை மூடியுள்ளேன்'],
            ['Non-toxic clay chosen', 'நச்சில்லாத களிமண்ணைத் தேர்ந்தெடுத்தேன்'],
          ].map(([en, tamil], index) => <label className="craft-check-row" key={en}><input type="checkbox" checked={ready[index]} onChange={(event) => setReady((old) => old.map((item, i) => i === index ? event.target.checked : item))} data-testid={`checkbox-lotus-ready-${index}`} /><span>{ta ? tamil : en}</span></label>)}</div>}
          <div className={`craft-action-box ${actionDone ? 'is-done' : ''}`}><div><span className="craft-action-label">{labels.mini}</span><p>{phaseCopy[phase].action[ta ? 1 : 0]}</p></div>
            <button className="craft-action-button" type="button" onClick={toggleAction} disabled={phase === 0 && !ready.every(Boolean)} aria-pressed={actionDone} data-testid="button-lotus-mini-action"><span className={`craft-mini-check ${actionDone ? 'done' : ''}`}>{actionDone ? <Check size={20} /> : <Flower2 size={20} />}</span><span>{actionDone ? (ta ? 'முடிந்தது!' : 'Nicely done!') : labels.actionBtn}</span></button>
            {phase === 0 && !ready.every(Boolean) && <small>{ta ? 'மூன்று பாதுகாப்பு பெட்டிகளையும் குறிக்கவும்' : 'Check all three safe-start steps first'}</small>}
          </div>
          <div className="craft-confirm-box"><ShieldCheck size={20} /><div><strong>{labels.disclaimer}</strong><p>{labels.unverified}</p></div></div>
          <button className="btn craft-confirm-button" type="button" disabled={!actionDone} onClick={confirmPhase} data-testid="button-lotus-confirm-phase">{labels.confirm}<ArrowRight size={18} /></button>
          {progress.confirmations[phase] && <p className="craft-confirmed" role="status" data-testid="status-lotus-phase-confirmed"><Check size={16} />{labels.confirmed}</p>}
        </>}
      </section>
    </div>
    <aside className="craft-safety" data-testid="text-lotus-safety"><ShieldCheck size={21} /><p>{labels.safety}</p></aside>
    <div className="craft-phase-rail" aria-label={labels.progress}>{phaseCopy.map((item, index) => <div className={`craft-phase-dot ${progress.confirmations[index] ? 'done' : phase === index ? 'active' : 'locked'}`} key={item.title[0]} aria-label={`${labels.phase} ${index + 1}`} data-testid={`status-lotus-phase-${index + 1}`}><span>{progress.confirmations[index] ? <Check size={14} /> : index + 1}</span></div>)}</div>
    <div className="lotus-bottom-links"><Link href="/craft" data-testid="link-lotus-to-ganesha">{ta ? 'விநாயகர் கைவினைக்குச் செல்' : 'Try the Ganesha clay activity'}<ArrowRight size={16} /></Link><Link href="/" data-testid="link-lotus-to-home">{labels.home}<ArrowRight size={16} /></Link></div>
  </main>;
}
