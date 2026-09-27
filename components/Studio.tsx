'use client';

import { useEffect, useState } from 'react';
import { Clapperboard, Plus, FolderOpen, CreditCard, Coins, Sparkles } from 'lucide-react';
import { CREDIT_PLANS, FREE_TRIAL_GENERATIONS, generationCost } from '@/lib/billing';

type Usage = { freeUsed: number; credits: number; totalGenerations: number };
type Project = { id:string; title:string; description:string; duration:number; style:string; status:string; created:string; progress:number };

const KEY = 'storyx-billing-v1';

export default function Studio() {
  const [tab,setTab] = useState('home');
  const [idea,setIdea] = useState('');
  const [duration,setDuration] = useState(10);
  const [style,setStyle] = useState('Cinematic Mystery');
  const [usage,setUsage] = useState<Usage>({freeUsed:0,credits:0,totalGenerations:0});
  const [projects,setProjects] = useState<Project[]>([]);
  const [notice,setNotice] = useState('');

  useEffect(()=>{ const saved=localStorage.getItem(KEY); if(saved) setUsage(JSON.parse(saved)); },[]);
  const save=(u:Usage)=>{setUsage(u);localStorage.setItem(KEY,JSON.stringify(u));};
  const free=Math.max(0,FREE_TRIAL_GENERATIONS-usage.freeUsed);
  const cost=generationCost(duration);

  async function generate(){
    if(!idea.trim()) return;
    if(free===0 && usage.credits<cost){setTab('billing');setNotice('Your 2 free generations are finished. Buy credits to continue.');return;}
    const response=await fetch('/api/projects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:idea.slice(0,60),description:idea,duration,style})});
    const data=await response.json();
    if(!response.ok){setNotice(data.error||'Could not create project');return;}
    setProjects(p=>[data.project,...p]);
    save(free>0?{...usage,freeUsed:usage.freeUsed+1,totalGenerations:usage.totalGenerations+1}:{...usage,credits:usage.credits-cost,totalGenerations:usage.totalGenerations+1});
    setNotice(free>0?'Free generation used.':'Credits reserved for this production.');
    setTab('projects');
  }

  async function buy(id:string){
    const plan=CREDIT_PLANS.find(p=>p.id===id);
    if(!plan) return;
    const response=await fetch('/api/billing/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({planId:id})});
    const data=await response.json();
    if(data.mode==='demo'){save({...usage,credits:usage.credits+plan.credits});setNotice(plan.credits+' credits added in development mode.');}
  }

  return <div className="min-h-screen gridbg flex">
    <aside className="w-64 bg-[#0b0c11] border-r border-[#252836] p-5 flex flex-col">
      <div className="flex items-center gap-3 mb-10"><div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center"><Clapperboard/></div><div><b>StoryX</b><div className="text-xs text-[#8d93a5]">VIDEO STUDIO</div></div></div>
      <Nav active={tab==='home'} onClick={()=>setTab('home')} icon={<Clapperboard/>}>Dashboard</Nav>
      <Nav active={tab==='create'} onClick={()=>setTab('create')} icon={<Plus/>}>Create Video</Nav>
      <Nav active={tab==='projects'} onClick={()=>setTab('projects')} icon={<FolderOpen/>}>My Projects</Nav>
      <Nav active={tab==='billing'} onClick={()=>setTab('billing')} icon={<CreditCard/>}>Credits & Billing</Nav>
      <div className="mt-auto glass rounded-2xl p-4"><div className="text-xs text-violet-300">CREDIT BALANCE</div><div className="text-3xl font-black mt-2">{usage.credits}</div><button onClick={()=>setTab('billing')} className="w-full mt-3 bg-white text-black rounded-xl py-2 font-bold">Buy credits</button></div>
    </aside>
    <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
      {notice && <div className="mb-5 rounded-xl bg-violet-500/10 border border-violet-500/30 p-3">{notice}</div>}
      {tab==='home' && <><Header title="Create stories that feel like movies." sub="AI video production up to 60 minutes."/><div className="glass rounded-3xl p-8"><div className="text-violet-300 font-bold"><Sparkles className="inline"/> AI VIDEO ENGINE</div><h2 className="text-3xl font-black mt-3">Turn one idea into a long-form video.</h2><p className="text-[#8d93a5] mt-3">StoryX will plan scripts, scenes, visuals, voices, music and the final timeline.</p><button onClick={()=>setTab('create')} className="mt-6 bg-white text-black px-5 py-3 rounded-xl font-bold">Create video</button></div><div className="grid md:grid-cols-3 gap-4 mt-6"><Stat title="Free trials left" value={free+'/'+FREE_TRIAL_GENERATIONS}/><Stat title="Credits" value={String(usage.credits)}/><Stat title="Maximum length" value="60 min"/></div></>}
      {tab==='create' && <><Header title="Create Video" sub="Describe your story and choose the production length."/><div className="glass rounded-3xl p-7"><textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder="Describe the story you want to create..." className="w-full min-h-40 rounded-2xl bg-[#0b0c11] border border-[#252836] p-4"/><div className="grid md:grid-cols-2 gap-5 mt-5"><div><label>Style</label><select value={style} onChange={e=>setStyle(e.target.value)} className="w-full mt-2 bg-[#0b0c11] border border-[#252836] p-3 rounded-xl"><option>Cinematic Mystery</option><option>Cinematic Drama</option><option>Documentary</option><option>YouTube Story</option><option>Kids Animation</option><option>Gospel / Ministry</option></select></div><div><label>Duration: {duration} minutes</label><input className="w-full mt-5" type="range" min="1" max="60" value={duration} onChange={e=>setDuration(Number(e.target.value))}/></div></div><div className="mt-5 p-4 rounded-xl bg-violet-500/10">Cost after free trials: <b>{cost} credits</b>. Balance: <b>{usage.credits}</b>.</div><button onClick={generate} className="mt-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 rounded-xl font-bold"><Sparkles className="inline"/> Generate production</button></div></>}
      {tab==='projects' && <><Header title="My Projects" sub="Your StoryX production plans."/><div className="grid md:grid-cols-2 gap-4">{projects.length?projects.map(p=><div className="glass rounded-2xl p-5" key={p.id}><h3 className="font-bold text-xl">{p.title}</h3><p className="text-sm text-[#8d93a5] mt-2">{p.description}</p><div className="mt-4 text-xs">{p.duration} min · {p.style} · {p.status}</div></div>):<p className="text-[#8d93a5]">No projects yet.</p>}</div></>}
      {tab==='billing' && <><Header title="Credits & Billing" sub="Two free generations, then purchase credits."/><div className="grid md:grid-cols-3 gap-5">{CREDIT_PLANS.map(p=><div className="glass rounded-3xl p-6" key={p.id}><h3 className="text-xl font-bold">{p.name}</h3><div className="text-4xl font-black mt-3">KSh {p.priceKes.toLocaleString()}</div><div className="text-violet-300 font-bold mt-2">{p.credits} credits</div><p className="text-sm text-[#8d93a5] mt-3">{p.description}</p><button onClick={()=>buy(p.id)} className="w-full mt-6 bg-white text-black rounded-xl py-3 font-bold"><CreditCard className="inline"/> Buy credits</button></div>)}</div><p className="mt-5 text-xs text-amber-200">Development checkout only. Real payments will be connected before launch.</p></>}
    </main>
  </div>
}

function Nav({children,active,onClick,icon}:{children:React.ReactNode;active:boolean;onClick:()=>void;icon:React.ReactNode}){return <button onClick={onClick} className={'w-full flex gap-3 items-center p-3 rounded-xl text-sm '+(active?'bg-[#1b1730]':'text-[#8d93a5]')}>{icon}{children}</button>}
function Header({title,sub}:{title:string;sub:string}){return <div className="mb-8"><div className="text-xs text-[#8d93a5]">STORYX / STUDIO</div><h1 className="text-4xl font-black gradient-text mt-2">{title}</h1><p className="text-[#8d93a5] mt-2">{sub}</p></div>}
function Stat({title,value}:{title:string;value:string}){return <div className="glass rounded-2xl p-5"><div className="text-xs text-[#8d93a5]">{title}</div><div className="text-2xl font-black mt-2">{value}</div></div>}
