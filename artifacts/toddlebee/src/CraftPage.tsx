import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Check, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';

type Language = 'en' | 'ta';
type CraftProgress = { current: number; completed: number[]; actions: boolean[] };
const STORAGE_KEY = 'toddlebee-clay-ganesha-progress';

const phases = [
  {
    title: ['Get your space ready', 'இடத்தைத் தயார்செய்'],
    guide: ['Wash your hands and cover the table. With a grown-up, choose non-toxic air-dry or natural clay.', 'கைகளைக் கழுவி, மேசையை மூடு. பெரியவருடன் நச்சில்லாத காற்றில் உலரும் அல்லது இயற்கைக் களிமண்ணைத் தேர்ந்தெடு.'],
    action: ['Tap each ready step', 'தயாரான ஒவ்வொரு படியையும் தொடு'],
    pieces: 0,
  },
  {
    title: ['Make a seat and body', 'அமர்விடமும் உடலும் செய்'],
    guide: ['Shape a little seat, then roll one round piece for Ganesha’s body.', 'சிறிய அமர்விடத்தை உருவாக்கி, விநாயகரின் உடலுக்கு ஒரு உருண்டையை உருட்டு.'],
    action: ['Roll the clay ball', 'களிமண் உருண்டையை உருட்டு'],
    pieces: 1,
  },
  {
    title: ['Add the head and ears', 'தலையும் காதுகளும் சேர்'],
    guide: ['Add a smaller round head. Gently press two broad ears onto its sides.', 'சிறிய உருண்டையான தலையைச் சேர். இருபுறமும் அகலமான காதுகளை மெதுவாக அழுத்திப் பொருத்து.'],
    action: ['Press on two ears', 'இரண்டு காதுகளை அழுத்திப் பொருத்து'],
    pieces: 2,
  },
  {
    title: ['Curve the trunk', 'தும்பிக்கையை வளை'],
    guide: ['Roll a short clay rope and gently curve it down from the middle of the face.', 'சிறிய களிமண் கயிற்றை உருட்டி, முகத்தின் நடுவிலிருந்து கீழே மெதுவாக வளை.'],
    action: ['Trace the gentle curve', 'மென்மையான வளைவை வரையு'],
    pieces: 3,
  },
  {
    title: ['Arms and a modak', 'கைகளும் மோதகமும்'],
    guide: ['Add two arms. Rest a tiny modak in one hand; press it gently so it stays.', 'இரண்டு கைகளைச் சேர். ஒரு கையில் சிறிய மோதகத்தை வைத்து மெதுவாக அழுத்து.'],
    action: ['Place a modak in a hand', 'ஒரு கையில் மோதகத்தை வை'],
    pieces: 4,
  },
  {
    title: ['Crown and patterns', 'கிரீடமும் அலங்காரமும்'],
    guide: ['Add a small crown. Press in a simple pattern with a fingertip—no sharp tools.', 'சிறிய கிரீடத்தைச் சேர். விரல் நுனியால் எளிய வடிவத்தைப் பதியவும்; கூர்மையான கருவிகள் வேண்டாம்.'],
    action: ['Press a gentle pattern', 'மென்மையான வடிவத்தைப் பதியு'],
    pieces: 5,
  },
  {
    title: ['Let your sculpture dry', 'உருவத்தை உலரவிடு'],
    guide: ['Let it dry exactly as the clay instructions say. Ask a grown-up before painting.', 'களிமண் வழிமுறையின்படி உலரவிடு. வண்ணம் பூசுவதற்கு முன் பெரியவரிடம் கேள்.'],
    action: ['Choose a drying place', 'உலர வைக்கும் இடத்தைத் தேர்ந்தெடு'],
    pieces: 6,
  },
];

const defaultProgress = (): CraftProgress => ({ current: 0, completed: [], actions: Array(7).fill(false) });
function readProgress(): CraftProgress {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Partial<CraftProgress> | null;
    if (!value || !Array.isArray(value.actions) || !Array.isArray(value.completed)) return defaultProgress();
    const completed = value.completed.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < 7);
    return { current: Math.min(6, Math.max(0, Number(value.current) || 0)), completed, actions: Array.from({ length: 7 }, (_, i) => value.actions?.[i] === true) };
  } catch { return defaultProgress(); }
}

export function CraftPage({ language }: { language: Language }) {
  const ta = language === 'ta';
  const [progress, setProgress] = useState<CraftProgress>(readProgress);
  const [readySteps, setReadySteps] = useState<boolean[]>([false, false, false]);
  const [celebrate, setCelebrate] = useState(false);
  const labels = useMemo(() => ({
    eyebrow: ta ? 'மெதுவாகச் செய்யும் களிமண் கைவினை' : 'A slow clay craft',
    title: ta ? 'விநாயகர் உருவம் செய்வோம்' : 'Make a clay Ganesha',
    intro: ta ? 'ஒவ்வொரு படியாகச் செய். உன் முன்னேற்றம் இந்தச் சாதனத்தில் மட்டுமே சேமிக்கப்படும்.' : 'Take one gentle step at a time. Your progress stays on this device.',
    phase: ta ? 'படி' : 'Phase', of: ta ? 'இல்' : 'of',
    mini: ta ? 'சிறிய செயல்' : 'Mini action',
    confirm: ta ? 'இந்தக் களிமண் படியை முடித்துவிட்டேன்' : 'I finished this real-clay phase',
    confirmed: ta ? 'உண்மையான களிமண் படி முடிந்தது' : 'Real-clay phase finished',
    locked: ta ? 'முந்தைய படியை முடித்த பிறகு திறக்கும்' : 'Unlocks after you finish the previous phase',
    progress: ta ? 'உன் முன்னேற்றம்' : 'Your progress',
    disclaimer: ta ? 'இந்தச் செயலி உண்மையான களிமண் வேலையைச் சரிபார்க்க முடியாது. இங்கே உறுதிப்படுத்துவது உன் சொந்த நினைவூட்டல் மட்டுமே.' : 'This app cannot verify physical clay work. Your confirmation here is only your own reminder.',
    safety: ta ? 'பாதுகாப்பு: களிமண்ணைச் சாப்பிடாதே. கூர்மையான கருவிகள் வேண்டாம். பொருட்கள் அல்லது வண்ணத்துக்கு பெரியவரிடம் கேள். புனித உருவத்தைச் செய்யும்போதும் கையாளும்போதும் குடும்ப வழிகாட்டுதலைப் பின்பற்று.' : 'Safety: Do not eat clay. Use no sharp tools. Ask an adult for materials or paint. Follow your family’s guidance when making or handling a sacred figure.',
    restart: ta ? 'மீண்டும் தொடங்கு' : 'Restart activity',
    restartConfirm: ta ? 'உன் முன்னேற்றத்தை நீக்கி மீண்டும் தொடங்கவா?' : 'Clear this activity’s saved progress and start again?',
    home: ta ? 'முகப்பு' : 'Home',
    celebration: ta ? 'உன் ஏழு படிகளும் முடிந்தன. அருமையான கவனமும் பொறுமையும்!' : 'All seven phases are complete. What care and patience you brought!',
    readyHeading: ta ? 'தயாரிப்பு பட்டியல்' : 'Ready check',
    completed: ta ? 'முடிந்தது' : 'complete',
  }), [ta]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }, [progress]);

  const phase = progress.current;
  const isComplete = progress.completed.length === 7;
  const finishPhase = () => {
    if (!progress.actions[phase]) return;
    const completed = [...new Set([...progress.completed, phase])].sort((a, b) => a - b);
    const next = Math.min(6, phase + 1);
    setProgress((old) => ({ ...old, completed, current: next }));
    if (completed.length === 7) setCelebrate(true);
  };
  const restart = () => {
    if (window.confirm(labels.restartConfirm)) {
      setProgress(defaultProgress());
      setReadySteps([false, false, false]);
      setCelebrate(false);
    }
  };
  const markAction = () => setProgress((old) => {
    const actions = [...old.actions];
    actions[phase] = !actions[phase];
    return { ...old, actions };
  });
  const actionDone = progress.actions[phase];

  return <main className="page craft-page">
    <div className="craft-topline">
      <Link href="/" className="craft-back" data-testid="link-craft-home"><ArrowLeft size={17} /> {labels.home}</Link>
      <button className="craft-reset" type="button" onClick={restart} data-testid="button-craft-restart"><RotateCcw size={16} /> {labels.restart}</button>
    </div>
    <header className="craft-heading">
      <div><div className="eyebrow">{labels.eyebrow}</div><h1>{labels.title}</h1><p>{labels.intro}</p></div>
      <div className="craft-progress-chip" data-testid="status-craft-progress"><span>{progress.completed.length} / 7</span><small>{labels.completed}</small></div>
    </header>
    <div className="craft-progress-track" role="progressbar" aria-label={labels.progress} aria-valuemin={0} aria-valuemax={7} aria-valuenow={progress.completed.length} data-testid="status-craft-progressbar"><span style={{ width: `${(progress.completed.length / 7) * 100}%` }} /></div>

    <div className="craft-layout">
      <section className={`craft-art-panel ${celebrate ? 'craft-celebrate' : ''}`} aria-label={ta ? 'படிப்படியாக உருவாகும் களிமண் விநாயகர்' : 'Clay Ganesha taking shape'}>
        <div className="craft-art-caption"><Sparkles size={17} /> {ta ? 'உன் உருவம் மெதுவாக வளர்கிறது' : 'Your sculpture, taking shape'}</div>
        <svg className="ganesha-svg" viewBox="0 0 360 360" role="img" aria-labelledby="ganesha-title ganesha-desc" data-testid="illustration-craft-ganesha">
          <title id="ganesha-title">{ta ? 'களிமண் விநாயகர்' : 'Clay Ganesha'}</title>
          <desc id="ganesha-desc">{ta ? 'முன்னேற்றத்துடன் சேரும் மென்மையான களிமண் வடிவங்கள்' : 'Soft clay shapes appear as the activity progresses'}</desc>
          <ellipse className="clay-shadow" cx="180" cy="322" rx="108" ry="16" />
          <g className="ganesha-part seat" data-visible={progress.completed.includes(1) || phase >= 1 ? 'yes' : 'no'}>
            <path d="M93 286 Q180 265 267 286 L257 309 Q180 326 103 309Z" />
            <path className="clay-highlight" d="M111 288 Q180 273 248 288" />
          </g>
          <g className="ganesha-part body" data-visible={progress.completed.includes(1) || phase >= 1 ? 'yes' : 'no'}>
            <ellipse cx="180" cy="232" rx="72" ry="78" />
            <ellipse className="clay-highlight" cx="157" cy="202" rx="20" ry="9" transform="rotate(-28 157 202)" />
            <path className="belly-line" d="M152 249 Q180 267 208 249" />
          </g>
          <g className="ganesha-part ears" data-visible={progress.completed.includes(2) || phase >= 2 ? 'yes' : 'no'}>
            <ellipse cx="114" cy="143" rx="25" ry="43" transform="rotate(-30 114 143)" />
            <ellipse cx="246" cy="143" rx="25" ry="43" transform="rotate(30 246 143)" />
            <path className="ear-inset" d="M111 128q-12 19 1 36M249 128q12 19-1 36" />
          </g>
          <g className="ganesha-part head" data-visible={progress.completed.includes(2) || phase >= 2 ? 'yes' : 'no'}>
            <ellipse cx="180" cy="146" rx="54" ry="56" />
            <ellipse className="clay-highlight" cx="160" cy="126" rx="15" ry="7" transform="rotate(-25 160 126)" />
            <circle className="eye" cx="160" cy="149" r="3.5" /><circle className="eye" cx="200" cy="149" r="3.5" />
            <path className="tilak" d="M180 151v13" />
          </g>
          <g className="ganesha-part trunk" data-visible={progress.completed.includes(3) || phase >= 3 ? 'yes' : 'no'}>
            <path d="M180 164 C179 185 199 187 197 207 C196 225 177 228 166 216" fill="none" strokeWidth="20" strokeLinecap="round" />
            <path className="trunk-highlight" d="M179 170 C178 187 193 190 190 205" fill="none" strokeWidth="4" strokeLinecap="round" />
          </g>
          <g className="ganesha-part arms" data-visible={progress.completed.includes(4) || phase >= 4 ? 'yes' : 'no'}>
            <path d="M123 227 Q99 236 108 259 Q119 271 147 257" fill="none" strokeWidth="15" strokeLinecap="round" />
            <path d="M237 227 Q261 236 252 259 Q240 271 215 257" fill="none" strokeWidth="15" strokeLinecap="round" />
            <path d="M124 231q12 6 17 18M236 231q-12 6-17 18" fill="none" stroke="#b66f49" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g className="ganesha-part modak" data-visible={progress.completed.includes(4) || phase >= 4 ? 'yes' : 'no'}>
            <path d="M218 246 Q224 228 236 240 Q247 228 252 246 Q249 261 235 263 Q221 260 218 246Z" />
            <path className="modak-crease" d="M230 239q7 8 5 20m0-20q-4 7-10 10m10-10q5 7 11 10" />
          </g>
          <g className="ganesha-part crown" data-visible={progress.completed.includes(5) || phase >= 5 ? 'yes' : 'no'}>
            <path d="M145 99 L151 64 L170 82 L180 52 L191 82 L211 64 L216 100Z" />
            <path className="crown-band" d="M147 94q34 10 67 0" />
            <circle className="crown-dot" cx="180" cy="75" r="4" />
          </g>
          <g className="ganesha-part pattern" data-visible={progress.completed.includes(5) || phase >= 5 ? 'yes' : 'no'}>
            <circle cx="180" cy="227" r="24" fill="none" strokeWidth="2" strokeDasharray="2 7" />
            <path d="M180 211v7m-8 9 5 2m9-2-5 2m-1 8v-6" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          {celebrate && <g className="craft-confetti" aria-hidden="true"><circle cx="75" cy="105" r="4"/><circle cx="280" cy="108" r="5"/><circle cx="89" cy="225" r="3"/><circle cx="272" cy="220" r="4"/></g>}
        </svg>
        <div className="craft-art-note" data-testid="status-craft-model">{ta ? 'நீ முடித்த படிகளுக்கேற்ப வடிவம் சேர்க்கப்படும்' : 'The model grows with your finished phases'}</div>
      </section>

      <section className="craft-step-panel" aria-labelledby="craft-step-title">
        {isComplete ? <div className="craft-finish" role="status" data-testid="status-craft-complete">
          <div className="craft-finish-icon"><Check size={30} /></div><h2>{labels.celebration}</h2>
          <p>{labels.disclaimer}</p>
          <button type="button" className="btn btn-secondary" onClick={restart} data-testid="button-craft-restart-finish"><RotateCcw size={16} /> {labels.restart}</button>
        </div> : <>
          <div className="craft-step-meta"><span>{labels.phase} {phase + 1} {labels.of} 7</span><span>{progress.completed.length} / 7</span></div>
          <div className="craft-step-track"><span style={{ width: `${((phase + 1) / 7) * 100}%` }} /></div>
          <h2 id="craft-step-title" data-testid="text-craft-phase-title">{phases[phase].title[ta ? 1 : 0]}</h2>
          <p className="craft-guidance" data-testid="text-craft-phase-guidance">{phases[phase].guide[ta ? 1 : 0]}</p>
          {phase === 0 ? <div className="craft-ready-check">
            <strong>{labels.readyHeading}</strong>
            {[
              ['Wash your hands', 'கைகளைக் கழுவு'],
              ['Cover the table', 'மேசையை மூடு'],
              ['Choose safe clay with a grown-up', 'பெரியவருடன் பாதுகாப்பான களிமண்ணைத் தேர்ந்தெடு'],
            ].map((item, index) => <label key={item[0]} className="craft-check-row">
              <input type="checkbox" checked={readySteps[index]} onChange={(e) => setReadySteps((old) => old.map((value, i) => i === index ? e.target.checked : value))} data-testid={`checkbox-craft-ready-${index}`} />
              <span>{item[ta ? 1 : 0]}</span>
            </label>)}
          </div> : null}
          <div className={`craft-action-box ${actionDone ? 'is-done' : ''}`}>
            <div><span className="craft-action-label">{labels.mini}</span><p>{phases[phase].action[ta ? 1 : 0]}</p></div>
            <button type="button" className="craft-action-button" onClick={phase === 0 ? () => {
              const next = !actionDone;
              setProgress((old) => { const actions = [...old.actions]; actions[phase] = next; return { ...old, actions }; });
            } : markAction} disabled={phase === 0 && !readySteps.every(Boolean)} aria-pressed={actionDone} data-testid="button-craft-mini-action">
              <span className={actionDone ? 'craft-mini-check done' : 'craft-mini-check'}>{actionDone ? <Check size={20} /> : <Sparkles size={20} />}</span>
              <span>{actionDone ? (ta ? 'நன்றாகச் செய்தாய்!' : 'Nicely done!') : (ta ? 'செயலைச் செய்து பார்' : 'Try the mini action')}</span>
            </button>
            {phase === 0 && !readySteps.every(Boolean) && <small>{ta ? 'மூன்று தயாரிப்பு பெட்டிகளையும் குறி' : 'Check all three ready steps first'}</small>}
          </div>
          <div className="craft-confirm-box">
            <ShieldCheck size={20} aria-hidden="true" />
            <div><strong>{labels.disclaimer}</strong><p>{ta ? 'உண்மையான களிமண் வேலையை முடித்த பிறகே கீழே உறுதிப்படுத்து.' : 'Only confirm below after you have finished the real clay work.'}</p></div>
          </div>
          <button type="button" className="btn craft-confirm-button" onClick={finishPhase} disabled={!actionDone} data-testid="button-craft-confirm-phase">
            {labels.confirm} <ArrowRight size={18} />
          </button>
          {progress.completed.includes(phase) && <p className="craft-confirmed" role="status" data-testid="status-craft-phase-confirmed"><Check size={16} /> {labels.confirmed}</p>}
        </>}
      </section>
    </div>
    <aside className="craft-safety" data-testid="text-craft-safety"><ShieldCheck size={21} /><p>{labels.safety}</p></aside>
    <div className="craft-phase-rail" aria-label={labels.progress}>{phases.map((item, index) => {
      const done = progress.completed.includes(index);
      const active = !isComplete && phase === index;
      const locked = !done && !active;
      return <div className={`craft-phase-dot ${done ? 'done' : ''} ${active ? 'active' : ''} ${locked ? 'locked' : ''}`} key={index} aria-label={`${labels.phase} ${index + 1}${done ? `, ${labels.confirmed}` : locked ? `, ${labels.locked}` : ''}`} data-testid={`status-craft-phase-${index + 1}`}><span>{done ? <Check size={14} /> : index + 1}</span></div>;
    })}</div>
  </main>;
}
