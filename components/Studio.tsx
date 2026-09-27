'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Clapperboard, Film, FolderOpen, Settings, Plus, Sparkles, Clock3,
  ChevronRight, Mic2, Music2, Download, LayoutDashboard, CircleHelp,
  Coins, CreditCard, Lock, Check, Crown, Zap, Wallet, X, Play,
  WandSparkles, Layers3, Volume2, Captions, Gauge, Video, Star
} from 'lucide-react';
import { CREDIT_PLANS, FREE_TRIAL_GENERATIONS, generationCost } from '@/lib/billing';

type Project = {
  id: string; title: string; description: string; duration: number; style: string;
  status: 'Draft' | 'Rendering' | 'Complete'; created: string; progress: number;
};
type Usage = { freeUsed: number; credits: number; totalGenerations: number };
const STORAGE_KEY = 'storyx-billing-v1';
const DEMO_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const initialProjects: Project[] = [
  { id:'1',title:'The Mystery of the Missing Heir',description:'A cinematic mystery with secrets, clues and an unexpected twist.',duration:18,style:'Cinematic Mystery',status:'Complete',created:'Today',progress:100 },
  { id:'2',title:'The Last Train Home',description:'A dramatic short film about a stranger carrying a dangerous secret.',duration:12,style:'Cinematic Drama',status:'Rendering',created:'Yesterday',progress:64 },
];
const defaultUsage: Usage={freeUsed:0,credits:0,totalGenerations:0};

export default function Studio(){
  const [projects,setProjects]=useState<Project[]>(initialProjects);
  const [active,setActive]=useState<'home'|'create'|'projects'|'billing'>('home');
  const [idea,setIdea]=useState('');
  const [duration,setDuration]=useState(30);
  const [style,setStyle]=useState('Cinematic Mystery');
  const [busy,setBusy]=useState(false);
  const [usage,setUsage]=useState<Usage>(defaultUsage);
  const [notice,setNotice]=useState<string|null>(null);
  const [showPaywall,setShowPaywall]=useState(false);

  useEffect(()=>{try{const saved=localStorage.getItem(STORAGE_KEY);if(saved)setUsage({...defaultUsage,...JSON.parse(saved)});}catch{}},[]);
  function saveUsage(next:Usage){setUsage(next);localStorage.setItem(STORAGE_KEY,JSON.stringify(next));}
  const cost=generationCost(duration);
  const freeRemaining=Math.max(0,FREE_TRIAL_GENERATIONS-usage.freeUsed);
  const canGenerate=freeRemaining>0||usage.credits>=cost;

  async function create(){
    if(!idea.trim()||busy)return;
    if(!canGenerate){setShowPaywall(true);return;}
    setBusy(true);setNotice(null);
    try{
      const res=await fetch('/api/projects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:idea.slice(0,42),description:idea,duration,style})});
      if(!res.ok)throw new Error();
      const j=await res.json();setProjects(p=>[j.project,...p]);
      if(freeRemaining>0){saveUsage({...usage,freeUsed:usage.freeUsed+1,totalGenerations:usage.totalGenerations+1});setNotice(`Free generation ${usage.freeUsed+1} of ${FREE_TRIAL_GENERATIONS} used.`);}
      else{saveUsage({...usage,credits:usage.credits-cost,totalGenerations:usage.totalGenerations+1});setNotice(`${cost} credits reserved for this ${duration}-minute production plan.`);}
      setActive('projects');
    }catch{setNotice('Something went wrong creating the project. Please try again.');}
    finally{setBusy(false);}
  }

  async function buyCredits(planId:string){
    const plan=CREDIT_PLANS.find(item=>item.id===planId);if(!plan)return;
    const res=await fetch('/api/billing/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({planId})});
    const data=await res.json();
    if(data.mode==='demo'){saveUsage({...usage,credits:usage.credits+plan.credits});setNotice(`Demo purchase added ${plan.credits} credits. Connect M-Pesa/card checkout before launch.`);setActive('home');}
    else setNotice(data.message||'Checkout created.');
  }

  return <div className="min-h-screen gridbg">
    <div className="relative z-10 flex min-h-screen">
      <aside className="w-64 border-r border-[#252836] bg-[#090a10]/95 backdrop-blur-xl p-5 flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center storyx-pulse"><Clapperboard size={21}/></div>
          <div><div className="font-black tracking-tight text-lg">StoryX</div><div className="text-[10px] tracking-[.28em] text-[#8d93a5]">VIDEO STUDIO</div></div>
        </div>
        <nav className="space-y-1">
          <Nav icon={<LayoutDashboard size={18}/>} label="Dashboard" active={active==='home'} onClick={()=>setActive('home')}/>
          <Nav icon={<Plus size={18}/>} label="Create Video" active={active==='create'} onClick={()=>setActive('create')}/>
          <Nav icon={<FolderOpen size={18}/>} label="My Projects" active={active==='projects'} onClick={()=>setActive('projects')}/>
          <Nav icon={<CreditCard size={18}/>} label="Credits & Billing" active={active==='billing'} onClick={()=>setActive('billing')}/>
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 storyx-float">
            <div className="flex items-center gap-2 text-violet-300 text-xs font-bold"><Coins size={15}/> YOUR BALANCE</div>
            <div className="text-2xl font-black mt-2">{usage.credits}</div><div className="text-[11px] text-[#8d93a5]">credits available</div>
            <button onClick={()=>setActive('billing')} className="w-full mt-3 rounded-xl bg-white text-black py-2 text-xs font-bold">Buy credits</button>
          </div>
          <Nav icon={<Settings size={18}/>} label="Settings"/><Nav icon={<CircleHelp size={18}/>} label="Help & API"/>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 max-w-[1540px] mx-auto w-full">
        {notice&&<div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 backdrop-blur">{notice}<button onClick={()=>setNotice(null)}><X size={16}/></button></div>}
        {active==='home'&&<Home setActive={setActive} projects={projects} usage={usage} freeRemaining={freeRemaining}/>}
        {active==='projects'&&<Projects projects={projects} setActive={setActive}/>}
        {active==='create'&&<Create idea={idea} setIdea={setIdea} duration={duration} setDuration={setDuration} style={style} setStyle={setStyle} create={create} busy={busy} cost={cost} freeRemaining={freeRemaining} credits={usage.credits} openBilling={()=>setActive('billing')}/>}
        {active==='billing'&&<Billing usage={usage} buyCredits={buyCredits}/>}
      </main>
    </div>
    {showPaywall&&<Paywall close={()=>setShowPaywall(false)} openBilling={()=>{setShowPaywall(false);setActive('billing')}} duration={duration} cost={cost} credits={usage.credits}/>}
  </div>;
}

function Nav({icon,label,active,onClick}:{icon:React.ReactNode;label:string;active?:boolean;onClick?:()=>void}){return <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${active?'bg-[#1b1730] text-white shadow-lg shadow-violet-900/10':'text-[#8d93a5] hover:bg-[#151722] hover:text-white'}`}>{icon}{label}</button>}
function Header({title,sub}:{title:string;sub:string}){return <div className="mb-7"><div className="text-[11px] tracking-[.25em] text-violet-300 mb-2">STORYX / STUDIO</div><h1 className="text-3xl md:text-4xl font-black tracking-tight gradient-text">{title}</h1><p className="text-[#8d93a5] mt-2">{sub}</p></div>}

function Home({setActive,projects,usage,freeRemaining}:{setActive:(x:'home'|'create'|'projects'|'billing')=>void;projects:Project[];usage:Usage;freeRemaining:number}){
  return <><Header title="Create stories that feel like movies." sub="One idea in. Script, scenes, voices, visuals and entertainment out."/>
    <section className="grid xl:grid-cols-[1.25fr_.75fr] gap-5 mb-7">
      <div className="glass rounded-[30px] p-7 md:p-9 overflow-hidden relative storyx-scan">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl"/>
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 text-violet-300 font-semibold mb-4"><Sparkles size={17}/> AI VIDEO ENGINE <span className="text-[10px] rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-emerald-300">LIVE PREVIEW</span></div>
          <h2 className="text-3xl md:text-5xl font-black max-w-3xl leading-[1.02]">From a sentence to a <span className="gradient-text">cinematic universe.</span></h2>
          <p className="text-[#9ca2b5] mt-5 max-w-2xl leading-7">Build films, mystery episodes, documentaries, animated stories and music visuals up to 60 minutes. StoryX plans the production scene-by-scene so long-form creation can scale.</p>
          <div className="flex flex-wrap gap-3 mt-7">
            <button onClick={()=>setActive('create')} className="bg-white text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-white/10"><WandSparkles size={17}/> Start creating <ChevronRight size={17}/></button>
            <button onClick={()=>setActive('projects')} className="border border-white/10 bg-white/5 px-5 py-3 rounded-xl font-semibold flex items-center gap-2"><Play size={16}/> Explore projects</button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mt-8">
            <MiniStat icon={<Layers3/>} value="60 min" label="Long-form" />
            <MiniStat icon={<Video/>} value="Scene AI" label="Production" />
            <MiniStat icon={<Gauge/>} value="4K-ready" label="Pipeline" />
          </div>
        </div>
      </div>
      <Reel/>
    </section>

    <div className="grid md:grid-cols-3 gap-4 mb-8">
      <UsageCard icon={<Zap/>} label="Free trials left" value={`${freeRemaining} / ${FREE_TRIAL_GENERATIONS}`} sub="Every new account starts with 2"/>
      <UsageCard icon={<Coins/>} label="Credit balance" value={String(usage.credits)} sub="1 credit currently equals ~1 minute"/>
      <UsageCard icon={<Crown/>} label="Premium" value="Buy credits" sub="Unlock more generations" action={()=>setActive('billing')}/>
    </div>

    <div className="flex items-center justify-between mb-4"><div><h3 className="text-xl font-bold">Production pipeline</h3><p className="text-xs text-[#777d8f] mt-1">Everything needed to turn an idea into entertainment.</p></div></div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      <Feature icon={<Film/>} t="Scene Engine" d="Story beats, shots and continuity"/><Feature icon={<Mic2/>} t="Character Voice" d="Narration and dialogue layers"/><Feature icon={<Music2/>} t="Sound Design" d="Music, ambience and effects"/><Feature icon={<Captions/>} t="Finishing" d="Subtitles, timeline and export"/>
    </div>
    <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold">Recent productions</h3><button onClick={()=>setActive('projects')} className="text-sm text-violet-300">View all →</button></div>
    <div className="grid md:grid-cols-2 gap-4">{projects.slice(0,2).map(p=><ProjectCard key={p.id} p={p}/>)}</div>
  </>;
}

function Reel(){
  return <div className="glass rounded-[30px] overflow-hidden relative min-h-[430px] storyx-film bg-[#080910]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(139,92,246,.25),transparent_35%),linear-gradient(145deg,#151126,#07080d)]"/>
    <video className="absolute inset-0 w-full h-full object-cover opacity-35" src={DEMO_VIDEO} autoPlay muted loop playsInline/>
    <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-transparent to-transparent"/>
    <div className="relative z-10 p-6 h-full min-h-[430px] flex flex-col justify-between">
      <div className="flex justify-between items-center"><span className="rounded-full bg-black/50 backdrop-blur px-3 py-1 text-[10px] tracking-[.22em]">STORYX REEL</span><span className="flex items-center gap-2 text-xs text-emerald-300"><span className="storyx-dot h-2 w-2 rounded-full bg-emerald-300"/>ENGINE READY</span></div>
      <div><div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 backdrop-blur px-3 py-1.5 text-xs mb-3"><Star size={13} className="text-amber-300"/> Cinematic preview</div><h3 className="text-3xl font-black">Make the screen feel alive.</h3><p className="text-sm text-white/65 mt-2 max-w-md">Animated interfaces now preview the visual rhythm your AI production pipeline is designed to create.</p></div>
    </div>
  </div>;
}

function MiniStat({icon,value,label}:{icon:React.ReactNode;value:string;label:string}){return <div className="rounded-2xl border border-white/8 bg-black/20 p-3 flex items-center gap-3"><div className="text-violet-300">{icon}</div><div><div className="font-black">{value}</div><div className="text-[11px] text-[#777d8f]">{label}</div></div></div>}
function UsageCard({icon,label,value,sub,action}:{icon:React.ReactNode;label:string;value:string;sub:string;action?:()=>void}){return <div className="glass rounded-2xl p-5 hover:border-violet-500/30"><div className="text-violet-300">{icon}</div><div className="text-xs text-[#8d93a5] mt-3">{label}</div><div className="text-2xl font-black mt-1">{value}</div><div className="text-xs text-[#8d93a5] mt-1">{sub}</div>{action&&<button onClick={action} className="mt-3 text-xs text-violet-300 font-bold">View plans →</button>}</div>}
function Feature({icon,t,d}:{icon:React.ReactNode;t:string;d:string}){return <div className="rounded-2xl bg-[#0b0c11]/90 border border-[#252836] p-4 hover:border-violet-500/30 transition-all hover:-translate-y-1"><div className="text-violet-300 mb-3">{icon}</div><div className="font-semibold">{t}</div><div className="text-xs text-[#8d93a5] mt-1">{d}</div></div>}
function ProjectCard({p}:{p:Project}){return <div className="glass rounded-2xl p-5 group hover:border-violet-500/30 transition-all"><div className="h-40 rounded-xl bg-gradient-to-br from-[#322052] via-[#141722] to-[#090a0f] flex items-center justify-center mb-4 relative overflow-hidden storyx-film"><div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_30%_30%,#a78bfa,transparent_20%),radial-gradient(circle_at_70%_60%,#ec4899,transparent_22%)] blur-2xl"/><Film className="text-white/70 relative group-hover:scale-110 transition-transform" size={40}/><div className="absolute bottom-3 left-3 text-[10px] rounded-full bg-black/45 backdrop-blur px-2 py-1">{p.style}</div></div><div className="flex justify-between gap-3"><div><h4 className="font-bold">{p.title}</h4><p className="text-sm text-[#8d93a5] mt-1 line-clamp-1">{p.description}</p></div><span className={`text-xs px-2.5 py-1 rounded-full h-fit ${p.status==='Complete'?'bg-emerald-500/10 text-emerald-300':p.status==='Draft'?'bg-violet-500/10 text-violet-300':'bg-amber-500/10 text-amber-300'}`}>{p.status}</span></div><div className="flex items-center gap-4 text-xs text-[#8d93a5] mt-4"><span className="flex items-center gap-1"><Clock3 size={13}/>{p.duration} min</span><span className="flex items-center gap-1"><Volume2 size={13}/>{p.style}</span></div>{p.status==='Rendering'&&<div className="mt-4"><div className="h-1.5 bg-[#252836] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{width:`${p.progress}%`}}/></div><div className="text-xs text-[#8d93a5] mt-2">Rendering {p.progress}%</div></div>}</div>}
function Projects({projects,setActive}:{projects:Project[];setActive:(x:'home'|'create'|'projects'|'billing')=>void}){return <><Header title="My Projects" sub="Your long-form video workspace."/><div className="flex justify-end mb-5"><button onClick={()=>setActive('create')} className="bg-white text-black px-4 py-2.5 rounded-xl font-bold flex items-center gap-2"><Plus size={17}/> New video</button></div><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{projects.map(p=><ProjectCard key={p.id} p={p}/>)}</div></>}

function Create({idea,setIdea,duration,setDuration,style,setStyle,create,busy,cost,freeRemaining,credits,openBilling}:{idea:string;setIdea:(x:string)=>void;duration:number;setDuration:(x:number)=>void;style:string;setStyle:(x:string)=>void;create:()=>void;busy:boolean;cost:number;freeRemaining:number;credits:number;openBilling:()=>void}){
  const trial=freeRemaining>0;const paidEnough=credits>=cost;
  return <><Header title="Create a new video" sub="Describe the story. StoryX turns it into a production plan."/><div className="max-w-5xl glass rounded-3xl p-6 md:p-8">
    <label className="text-sm font-semibold">What do you want to make?</label>
    <textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder="Example: A 30-minute cinematic mystery about a journalist who discovers that her missing father left clues inside old family videos..." className="w-full mt-3 min-h-40 rounded-2xl bg-[#0b0c11] border border-[#252836] p-5 outline-none focus:border-violet-500 resize-none"/>
    <div className="grid md:grid-cols-2 gap-6 mt-7"><div><label className="text-sm font-semibold">Video style</label><select value={style} onChange={e=>setStyle(e.target.value)} className="w-full mt-3 bg-[#0b0c11] border border-[#252836] rounded-xl p-3"><option>Cinematic Mystery</option><option>Animated Story</option><option>Documentary</option><option>Gospel / Music Story</option><option>Kids Animation</option><option>Cinematic Drama</option></select></div><div><div className="flex justify-between"><label className="text-sm font-semibold">Length</label><span className="text-violet-300 font-bold">{duration} minutes</span></div><input className="range w-full mt-5" type="range" min="1" max="60" value={duration} onChange={e=>setDuration(Number(e.target.value))}/><div className="flex justify-between text-xs text-[#8d93a5] mt-2"><span>1 min</span><span>30 min</span><span>60 min</span></div></div></div>
    <div className="mt-8 grid sm:grid-cols-3 gap-3">{['Story & Script','Visual Scenes','Voice + Sound'].map((x,i)=><div key={x} className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="text-violet-300 text-xs font-bold">0{i+1}</div><div className="font-semibold mt-2">{x}</div><div className="text-[11px] text-[#777d8f] mt-1">{i===0?'Narrative and dialogue planning':i===1?'Shot prompts and continuity':'Narration, music and effects'}</div></div>)}</div>
    <div className="mt-6 p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20 text-sm text-[#b9b1d0]">Long videos are generated scene-by-scene rather than in one giant generation, allowing the production engine to maintain pacing and continuity.</div>
    <div className="mt-5 rounded-2xl border border-[#252836] bg-[#0b0c11] p-4 flex flex-wrap items-center justify-between gap-3"><div><div className="text-sm font-bold">Generation cost</div><div className="text-xs text-[#8d93a5] mt-1">This {duration}-minute plan uses <strong className="text-white">{cost} credits</strong> after free trials.</div></div><div className="flex items-center gap-3 text-sm"><span className="text-[#8d93a5]">Balance: <strong className="text-white">{credits}</strong></span><button onClick={openBilling} className="text-violet-300 font-bold">Buy credits</button></div></div>
    <button disabled={busy||!idea.trim()} onClick={create} className="mt-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 disabled:opacity-40 px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-violet-900/20">{busy?'Creating…':trial?`Use free trial (${freeRemaining} left)`:paidEnough?`Generate for ${cost} credits`:'Buy credits to continue'} <Sparkles size={18}/></button>
  </div></>
}

function Billing({usage,buyCredits}:{usage:Usage;buyCredits:(id:string)=>void}){return <><Header title="Credits & Billing" sub="Use two free generations, then purchase credits for additional productions."/><div className="grid lg:grid-cols-3 gap-4 mb-8"><div className="glass rounded-2xl p-6"><div className="flex items-center gap-2 text-violet-300"><Wallet size={19}/> Balance</div><div className="text-4xl font-black mt-3">{usage.credits}</div><div className="text-sm text-[#8d93a5]">credits available</div></div><div className="glass rounded-2xl p-6"><div className="flex items-center gap-2 text-emerald-300"><Zap size={19}/> Free generations</div><div className="text-4xl font-black mt-3">{Math.max(0,FREE_TRIAL_GENERATIONS-usage.freeUsed)}</div><div className="text-sm text-[#8d93a5]">of {FREE_TRIAL_GENERATIONS} remaining</div></div><div className="glass rounded-2xl p-6"><div className="flex items-center gap-2 text-fuchsia-300"><Film size={19}/> Total generations</div><div className="text-4xl font-black mt-3">{usage.totalGenerations}</div><div className="text-sm text-[#8d93a5]">started on this device</div></div></div><div className="grid md:grid-cols-3 gap-5">{CREDIT_PLANS.map(plan=><div key={plan.id} className={`glass rounded-3xl p-6 relative ${plan.popular?'border-violet-500/60 storyx-pulse':''}`}>{plan.popular&&<div className="absolute -top-3 left-5 bg-violet-600 rounded-full px-3 py-1 text-[11px] font-black">MOST POPULAR</div>}<div className="text-lg font-bold">{plan.name}</div><div className="text-4xl font-black mt-3">KSh {plan.priceKes.toLocaleString()}</div><div className="text-violet-300 font-bold mt-2">{plan.credits.toLocaleString()} credits</div><p className="text-sm text-[#8d93a5] mt-3 min-h-10">{plan.description}</p><div className="mt-5 space-y-2 text-sm text-[#c7cad4]"><div className="flex gap-2"><Check size={16} className="text-emerald-300"/> Generate more videos</div><div className="flex gap-2"><Check size={16} className="text-emerald-300"/> Use credits across long-form projects</div></div><button onClick={()=>buyCredits(plan.id)} className="w-full mt-7 rounded-xl bg-white text-black py-3 font-bold flex items-center justify-center gap-2"><CreditCard size={17}/> Buy {plan.credits} credits</button></div>)}</div><div className="mt-7 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100"><strong>Development checkout:</strong> purchases currently simulate a successful credit top-up locally so you can test the complete flow. Before launch, connect the checkout endpoint to your real payment provider and a server-side account/database.</div></>}

function Paywall({close,openBilling,duration,cost,credits}:{close:()=>void;openBilling:()=>void;duration:number;cost:number;credits:number}){return <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"><div className="w-full max-w-lg glass rounded-3xl p-7 relative storyx-pulse"><button onClick={close} className="absolute right-5 top-5 text-[#8d93a5]"><X/></button><div className="h-12 w-12 rounded-2xl bg-violet-500/10 text-violet-300 flex items-center justify-center"><Lock/></div><h2 className="text-2xl font-black mt-5">Your free generations are used</h2><p className="text-[#8d93a5] mt-2">You have {credits} credits, but this {duration}-minute production needs {cost}. Buy credits to continue generating.</p><button onClick={openBilling} className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 font-bold">View credit packages</button><p className="text-[11px] text-[#777d8f] text-center mt-3">Production providers and server-side rendering will be connected next.</p></div></div>}
