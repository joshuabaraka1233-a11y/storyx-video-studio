'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Clapperboard, Film, FolderOpen, Settings, Plus, Sparkles, Clock3,
  ChevronRight, Mic2, Music2, Download, LayoutDashboard, CircleHelp,
  Coins, CreditCard, Lock, Check, Crown, Zap, Wallet, X
} from 'lucide-react';
import { CREDIT_PLANS, FREE_TRIAL_GENERATIONS, generationCost } from '@/lib/billing';

type Project = {
  id: string;
  title: string;
  description: string;
  duration: number;
  style: string;
  status: 'Draft' | 'Rendering' | 'Complete';
  created: string;
  progress: number;
};

type Usage = { freeUsed: number; credits: number; totalGenerations: number };
const STORAGE_KEY = 'storyx-billing-v1';
const initialProjects: Project[] = [
  { id: '1', title: 'The Mystery of the Missing Heir', description: 'A cinematic mystery with secrets, clues and an unexpected twist.', duration: 18, style: 'Cinematic Mystery', status: 'Complete', created: 'Today', progress: 100 },
  { id: '2', title: 'The Last Train Home', description: 'A dramatic short film about a stranger carrying a dangerous secret.', duration: 12, style: 'Cinematic Drama', status: 'Rendering', created: 'Yesterday', progress: 64 },
];

const defaultUsage: Usage = { freeUsed: 0, credits: 0, totalGenerations: 0 };

export default function Studio() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [active, setActive] = useState<'home' | 'create' | 'projects' | 'billing'>('home');
  const [idea, setIdea] = useState('');
  const [duration, setDuration] = useState(30);
  const [style, setStyle] = useState('Cinematic Mystery');
  const [busy, setBusy] = useState(false);
  const [usage, setUsage] = useState<Usage>(defaultUsage);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUsage({ ...defaultUsage, ...JSON.parse(saved) });
    } catch {}
  }, []);

  function saveUsage(next: Usage) {
    setUsage(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const cost = generationCost(duration);
  const freeRemaining = Math.max(0, FREE_TRIAL_GENERATIONS - usage.freeUsed);
  const canGenerate = freeRemaining > 0 || usage.credits >= cost;

  async function create() {
    if (!idea.trim() || busy) return;
    if (!canGenerate) {
      setShowPaywall(true);
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: idea.slice(0, 42), description: idea, duration, style }),
      });
      if (!res.ok) throw new Error('Could not create project');
      const j = await res.json();
      setProjects((p) => [j.project, ...p]);

      if (freeRemaining > 0) {
        saveUsage({ ...usage, freeUsed: usage.freeUsed + 1, totalGenerations: usage.totalGenerations + 1 });
        setNotice(`Free generation ${usage.freeUsed + 1} of ${FREE_TRIAL_GENERATIONS} used.`);
      } else {
        saveUsage({ ...usage, credits: usage.credits - cost, totalGenerations: usage.totalGenerations + 1 });
        setNotice(`${cost} credit${cost === 1 ? '' : 's'} reserved for this ${duration}-minute production plan.`);
      }
      setActive('projects');
    } catch {
      setNotice('Something went wrong creating the project. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function buyCredits(planId: string) {
    const plan = CREDIT_PLANS.find((item) => item.id === planId);
    if (!plan) return;
    const res = await fetch('/api/billing/checkout', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ planId }),
    });
    const data = await res.json();
    if (data.mode === 'demo') {
      // Local development purchase simulation so the whole credit flow can be tested.
      saveUsage({ ...usage, credits: usage.credits + plan.credits });
      setNotice(`Demo purchase added ${plan.credits} credits. Connect M-Pesa/card checkout before launch.`);
      setActive('home');
    } else {
      setNotice(data.message || 'Checkout created.');
    }
  }

  return <div className="min-h-screen gridbg">
    <div className="flex min-h-screen">
      <aside className="w-64 border-r border-[#252836] bg-[#0b0c11] p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"><Clapperboard size={21}/></div>
          <div><div className="font-black tracking-tight">StoryX</div><div className="text-[11px] text-[#8d93a5]">VIDEO STUDIO</div></div>
        </div>
        <nav className="space-y-1">
          <Nav icon={<LayoutDashboard size={18}/>} label="Dashboard" active={active === 'home'} onClick={() => setActive('home')}/>
          <Nav icon={<Plus size={18}/>} label="Create Video" active={active === 'create'} onClick={() => setActive('create')}/>
          <Nav icon={<FolderOpen size={18}/>} label="My Projects" active={active === 'projects'} onClick={() => setActive('projects')}/>
          <Nav icon={<CreditCard size={18}/>} label="Credits & Billing" active={active === 'billing'} onClick={() => setActive('billing')}/>
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
            <div className="flex items-center gap-2 text-violet-300 text-xs font-bold"><Coins size={15}/> YOUR BALANCE</div>
            <div className="text-2xl font-black mt-2">{usage.credits}</div>
            <div className="text-[11px] text-[#8d93a5]">credits available</div>
            <button onClick={() => setActive('billing')} className="w-full mt-3 rounded-xl bg-white text-black py-2 text-xs font-bold">Buy credits</button>
          </div>
          <Nav icon={<Settings size={18}/>} label="Settings"/>
          <Nav icon={<CircleHelp size={18}/>} label="Help & API"/>
        </div>
      </aside>
      <main className="flex-1 p-8 max-w-[1500px] mx-auto w-full">
        {notice && <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100"><span>{notice}</span><button onClick={() => setNotice(null)}><X size={16}/></button></div>}
        {active === 'home' && <Home setActive={setActive} projects={projects} usage={usage} freeRemaining={freeRemaining}/>} 
        {active === 'projects' && <Projects projects={projects} setActive={setActive}/>} 
        {active === 'create' && <Create idea={idea} setIdea={setIdea} duration={duration} setDuration={setDuration} style={style} setStyle={setStyle} create={create} busy={busy} cost={cost} freeRemaining={freeRemaining} credits={usage.credits} openBilling={() => setActive('billing')}/>} 
        {active === 'billing' && <Billing usage={usage} buyCredits={buyCredits}/>} 
      </main>
    </div>
    {showPaywall && <Paywall close={() => setShowPaywall(false)} openBilling={() => { setShowPaywall(false); setActive('billing'); }} duration={duration} cost={cost} credits={usage.credits}/>} 
  </div>;
}

function Nav({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${active ? 'bg-[#1b1730] text-white' : 'text-[#8d93a5] hover:bg-[#151722] hover:text-white'}`}>{icon}{label}</button>;
}
function Header({ title, sub }: { title: string; sub: string }) { return <div className="mb-8"><div className="text-sm text-[#8d93a5] mb-2">STORYX / STUDIO</div><h1 className="text-4xl font-black tracking-tight gradient-text">{title}</h1><p className="text-[#8d93a5] mt-2">{sub}</p></div>; }

function Home({ setActive, projects, usage, freeRemaining }: { setActive: (x: 'home' | 'create' | 'projects' | 'billing') => void; projects: Project[]; usage: Usage; freeRemaining: number }) {
  return <><Header title="Create stories that feel like movies." sub="Generate scripts, scenes, voices and long-form videos from one idea."/>
    <div className="glass rounded-3xl p-8 mb-8"><div className="flex items-start justify-between gap-6"><div><div className="flex items-center gap-2 text-violet-300 font-semibold mb-3"><Sparkles size={17}/> AI VIDEO ENGINE</div><h2 className="text-3xl font-bold max-w-2xl">Turn one sentence into a complete film — up to 60 minutes.</h2><p className="text-[#8d93a5] mt-3 max-w-2xl">StoryX breaks long videos into manageable scenes, generates each part, then assembles the final timeline with narration, dialogue, music, sound effects and subtitles.</p></div><button onClick={() => setActive('create')} className="shrink-0 bg-white text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2">Create video <ChevronRight size={17}/></button></div><div className="grid md:grid-cols-4 gap-3 mt-8"><Feature icon={<Film/>} t="Scene Engine" d="Plan and generate scenes"/><Feature icon={<Mic2/>} t="Voice" d="Narration & characters"/><Feature icon={<Music2/>} t="Sound" d="Music & effects"/><Feature icon={<Download/>} t="Render" d="Export a complete MP4"/></div></div>
    <div className="grid md:grid-cols-3 gap-4 mb-8"><UsageCard icon={<Zap/>} label="Free trials left" value={`${freeRemaining} / ${FREE_TRIAL_GENERATIONS}`} sub="Every new account starts with 2"/><UsageCard icon={<Coins/>} label="Credit balance" value={String(usage.credits)} sub="1 credit currently equals ~1 minute"/><UsageCard icon={<Crown/>} label="Premium" value="Buy credits" sub="Unlock more generations" action={() => setActive('billing')}/></div>
    <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold">Recent projects</h3><button onClick={() => setActive('projects')} className="text-sm text-violet-300">View all</button></div><div className="grid md:grid-cols-2 gap-4">{projects.slice(0, 2).map(p => <ProjectCard key={p.id} p={p}/>)}</div>
  </>;
}
function UsageCard({ icon, label, value, sub, action }: { icon: React.ReactNode; label: string; value: string; sub: string; action?: () => void }) { return <div className="glass rounded-2xl p-5"><div className="text-violet-300">{icon}</div><div className="text-xs text-[#8d93a5] mt-3">{label}</div><div className="text-2xl font-black mt-1">{value}</div><div className="text-xs text-[#8d93a5] mt-1">{sub}</div>{action && <button onClick={action} className="mt-3 text-xs text-violet-300 font-bold">View plans →</button>}</div>; }
function Feature({ icon, t, d }: { icon: React.ReactNode; t: string; d: string }) { return <div className="rounded-2xl bg-[#0b0c11] border border-[#252836] p-4"><div className="text-violet-300 mb-3">{icon}</div><div className="font-semibold">{t}</div><div className="text-xs text-[#8d93a5] mt-1">{d}</div></div>; }
function ProjectCard({ p }: { p: Project }) { return <div className="glass rounded-2xl p-5"><div className="h-36 rounded-xl bg-gradient-to-br from-[#27213b] via-[#141722] to-[#0b0c11] flex items-center justify-center mb-4"><Film className="text-[#70688a]" size={38}/></div><div className="flex justify-between gap-3"><div><h4 className="font-bold">{p.title}</h4><p className="text-sm text-[#8d93a5] mt-1 line-clamp-1">{p.description}</p></div><span className={`text-xs px-2.5 py-1 rounded-full h-fit ${p.status === 'Complete' ? 'bg-emerald-500/10 text-emerald-300' : p.status === 'Draft' ? 'bg-violet-500/10 text-violet-300' : 'bg-amber-500/10 text-amber-300'}`}>{p.status}</span></div><div className="flex items-center gap-4 text-xs text-[#8d93a5] mt-4"><span className="flex items-center gap-1"><Clock3 size={13}/>{p.duration} min</span><span>{p.style}</span></div>{p.status === 'Rendering' && <div className="mt-4"><div className="h-1.5 bg-[#252836] rounded-full overflow-hidden"><div className="h-full bg-violet-500" style={{ width: `${p.progress}%` }}/></div><div className="text-xs text-[#8d93a5] mt-2">Rendering {p.progress}%</div></div>}</div>; }
function Projects({ projects, setActive }: { projects: Project[]; setActive: (x: 'home' | 'create' | 'projects' | 'billing') => void }) { return <><Header title="My Projects" sub="Your long-form video workspace."/><div className="flex justify-end mb-5"><button onClick={() => setActive('create')} className="bg-white text-black px-4 py-2.5 rounded-xl font-bold flex items-center gap-2"><Plus size={17}/> New video</button></div><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{projects.map(p => <ProjectCard key={p.id} p={p}/>)}</div></>; }

function Create({ idea, setIdea, duration, setDuration, style, setStyle, create, busy, cost, freeRemaining, credits, openBilling }: { idea: string; setIdea: (x: string) => void; duration: number; setDuration: (x: number) => void; style: string; setStyle: (x: string) => void; create: () => void; busy: boolean; cost: number; freeRemaining: number; credits: number; openBilling: () => void }) {
  const trial = freeRemaining > 0;
  const paidEnough = credits >= cost;
  return <><Header title="Create a new video" sub="Describe the story. StoryX will turn it into a production plan."/><div className="max-w-4xl glass rounded-3xl p-8"><label className="text-sm font-semibold">What do you want to make?</label><textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="Example: A 30-minute cinematic mystery about a journalist who discovers that her missing father left clues inside old family videos..." className="w-full mt-3 min-h-40 rounded-2xl bg-[#0b0c11] border border-[#252836] p-5 outline-none focus:border-violet-500 resize-none"/><div className="grid md:grid-cols-2 gap-6 mt-7"><div><label className="text-sm font-semibold">Video style</label><select value={style} onChange={e => setStyle(e.target.value)} className="w-full mt-3 bg-[#0b0c11] border border-[#252836] rounded-xl p-3"><option>Cinematic Mystery</option><option>Animated Story</option><option>Documentary</option><option>Gospel / Music Story</option><option>Kids Animation</option><option>Cinematic Drama</option></select></div><div><div className="flex justify-between"><label className="text-sm font-semibold">Length</label><span className="text-violet-300 font-bold">{duration} minutes</span></div><input className="range w-full mt-5" type="range" min="1" max="60" value={duration} onChange={e => setDuration(Number(e.target.value))}/><div className="flex justify-between text-xs text-[#8d93a5] mt-2"><span>1 min</span><span>30 min</span><span>60 min</span></div></div></div><div className="mt-8 p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20 text-sm text-[#b9b1d0]">The production pipeline will create the script → scene breakdown → visual prompts → voice → sound → timeline → final render. Long videos are generated scene-by-scene rather than in one giant generation.</div>
    <div className="mt-5 rounded-2xl border border-[#252836] bg-[#0b0c11] p-4 flex flex-wrap items-center justify-between gap-3"><div><div className="text-sm font-bold">Generation cost</div><div className="text-xs text-[#8d93a5] mt-1">This {duration}-minute plan uses <strong className="text-white">{cost} credits</strong> after your free trials.</div></div><div className="flex items-center gap-3 text-sm"><span className="text-[#8d93a5]">Balance: <strong className="text-white">{credits}</strong></span><button onClick={openBilling} className="text-violet-300 font-bold">Buy credits</button></div></div>
    <button disabled={busy || !idea.trim()} onClick={create} className="mt-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 disabled:opacity-40 px-6 py-3.5 rounded-xl font-bold flex items-center gap-2">{busy ? 'Creating…' : trial ? `Use free trial (${freeRemaining} left)` : paidEnough ? `Generate for ${cost} credits` : 'Buy credits to continue'} <Sparkles size={18}/></button>
  </div></>;
}

function Billing({ usage, buyCredits }: { usage: Usage; buyCredits: (id: string) => void }) { return <><Header title="Credits & Billing" sub="Use two free generations, then purchase credits for additional productions."/><div className="grid lg:grid-cols-3 gap-4 mb-8"><div className="glass rounded-2xl p-6"><div className="flex items-center gap-2 text-violet-300"><Wallet size={19}/> Balance</div><div className="text-4xl font-black mt-3">{usage.credits}</div><div className="text-sm text-[#8d93a5]">credits available</div></div><div className="glass rounded-2xl p-6"><div className="flex items-center gap-2 text-emerald-300"><Zap size={19}/> Free generations</div><div className="text-4xl font-black mt-3">{Math.max(0, FREE_TRIAL_GENERATIONS - usage.freeUsed)}</div><div className="text-sm text-[#8d93a5]">of {FREE_TRIAL_GENERATIONS} remaining</div></div><div className="glass rounded-2xl p-6"><div className="flex items-center gap-2 text-fuchsia-300"><Film size={19}/> Total generations</div><div className="text-4xl font-black mt-3">{usage.totalGenerations}</div><div className="text-sm text-[#8d93a5]">started on this device</div></div></div><div className="grid md:grid-cols-3 gap-5">{CREDIT_PLANS.map(plan => <div key={plan.id} className={`glass rounded-3xl p-6 relative ${plan.popular ? 'border-violet-500/60' : ''}`}>{plan.popular && <div className="absolute -top-3 left-5 bg-violet-600 rounded-full px-3 py-1 text-[11px] font-black">MOST POPULAR</div>}<div className="text-lg font-bold">{plan.name}</div><div className="text-4xl font-black mt-3">KSh {plan.priceKes.toLocaleString()}</div><div className="text-violet-300 font-bold mt-2">{plan.credits.toLocaleString()} credits</div><p className="text-sm text-[#8d93a5] mt-3 min-h-10">{plan.description}</p><div className="mt-5 space-y-2 text-sm text-[#c7cad4]"><div className="flex gap-2"><Check size={16} className="text-emerald-300"/> Generate more videos</div><div className="flex gap-2"><Check size={16} className="text-emerald-300"/> Use credits across long-form projects</div></div><button onClick={() => buyCredits(plan.id)} className="w-full mt-7 rounded-xl bg-white text-black py-3 font-bold flex items-center justify-center gap-2"><CreditCard size={17}/> Buy {plan.credits} credits</button></div>)}</div><div className="mt-7 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100"><strong>Development checkout:</strong> purchases currently simulate a successful credit top-up locally so you can test the complete flow. Before launch, connect the checkout endpoint to your real payment provider and a server-side account/database.</div></>;
}

function Paywall({ close, openBilling, duration, cost, credits }: { close: () => void; openBilling: () => void; duration: number; cost: number; credits: number }) { return <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"><div className="w-full max-w-lg glass rounded-3xl p-7 relative"><button onClick={close} className="absolute right-5 top-5 text-[#8d93a5]"><X/></button><div className="h-12 w-12 rounded-2xl bg-violet-500/10 text-violet-300 flex items-center justify-center"><Lock/></div><h2 className="text-2xl font-black mt-5">Your free generations are used</h2><p className="text-[#8d93a5] mt-2">You have {credits} credits, but this {duration}-minute production needs {cost}. Buy credits to continue generating.</p><button onClick={openBilling} className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 font-bold">View credit packages</button><p className="text-[11px] text-[#777d8f] text-center mt-3">Credits are consumed when a production plan is started. Final AI provider/render costs will be added when the production engine is connected.</p></div></div>; }
