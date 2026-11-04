import { useRef, useState } from 'react';
import { unzipSync } from 'fflate';
import { Blocks, Check, ChevronRight, FileArchive, Github, Grid2X2, Image, Package, ScanSearch, Search, ShieldCheck, Sparkles, Upload, WandSparkles } from 'lucide-react';
type Page = 'Overview' | 'APK Analyzer' | 'Assets' | 'Block Studio' | 'Shader Lab' | 'Export';
const pages: Page[] = ['Overview','APK Analyzer','Assets','Block Studio','Shader Lab','Export'];
const icons = [Grid2X2,ScanSearch,Image,Blocks,WandSparkles,Package];
export default function App() {
 const [page,setPage] = useState<Page>('Overview');
 const [name,setName] = useState('');
 const [entries,setEntries] = useState<string[]>([]);
 const [findings,setFindings] = useState<string[]>([]);
 const [query,setQuery] = useState('');
 const [toast,setToast] = useState('');
 const input = useRef<HTMLInputElement>(null);
 const notify = (s:string) => { setToast(s); window.setTimeout(()=>setToast(''),2500); };
 async function inspect(file?:File) {
  if(!file)return;
  if(!file.name.toLowerCase().endsWith('.apk')) { notify('Please choose an Android APK'); return; }
  setName(file.name); setPage('APK Analyzer');
  try {
   const archive = unzipSync(new Uint8Array(await file.arrayBuffer()));
   const names = Object.keys(archive).sort(); setEntries(names);
   const lower = names.map(x=>x.toLowerCase()); const f:string[]=[];
   if(lower.some(x=>x.endsWith('.pck')))f.push('Godot PCK resource pack detected');
   if(lower.some(x=>x.endsWith('project.godot')||x.endsWith('engine.cfg')))f.push('Godot project configuration detected');
   if(lower.some(x=>x.includes('godot')&&x.endsWith('.so')))f.push('Godot native runtime library detected');
   if(lower.some(x=>/\.(gd|gdc)$/.test(x)))f.push('GDScript source or compiled script detected');
   if(lower.some(x=>/\.(tscn|scn)$/.test(x)))f.push('Godot scene resource detected');
   if(lower.some(x=>/\.(tres|res)$/.test(x)))f.push('Godot resource file detected');
   setFindings(f.length?f:['No definitive Godot fingerprints found in the APK directory']);
   notify('APK directory inspected. Original file untouched.');
  } catch { setEntries([]);setFindings([]);notify('Could not read this APK archive'); }
 }
 const filtered=entries.filter(x=>x.toLowerCase().includes(query.toLowerCase()));
 return <div className="shell"><aside className="sidebar"><div className="brand"><span className="mark">g✳</span><div><b>gummmods</b><small>THE MOD WORKSHOP</small></div></div><div className="workspace">🎮 <b>Gummmods Playground</b></div><label>WORKSPACE</label><nav>{pages.map((p,i)=>{const Icon=icons[i];return <button className={page===p?'active':''} onClick={()=>setPage(p)} key={p}><Icon size={17}/>{p}</button>})}</nav><div className="sidebar-bottom"><Github size={16}/><b>OPEN SOURCE PLAYGROUND</b><p>Built for curious modders. Original files stay untouched.</p><a href="https://github.com/Salt-the-Fries/Gummmods-playground" target="_blank">View repository ↗</a></div></aside><main><header>Gummmods Playground <ChevronRight size={14}/><b>{page}</b><span>EARLY ACCESS · 0.2.0</span></header>
 {page==='Overview'&&<section className="content"><small className="eyebrow">YOUR GAME. YOUR RULES.</small><h1>Make games feel<br/><em>a little more yours.</em></h1><p className="intro">Inspect Godot games, remix their assets, and build mods with blocks instead of headaches.</p><div className="drop" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();inspect(e.dataTransfer.files[0])}} onClick={()=>input.current?.click()}><input ref={input} hidden type="file" accept=".apk" onChange={e=>inspect(e.target.files?.[0])}/><Upload size={24}/><h2>Drop an Android APK in here</h2><p>We inspect the archive locally. Nothing gets uploaded.</p><button onClick={e=>{e.stopPropagation();input.current?.click()}}>＋ Import APK</button><small><ShieldCheck size={13}/> Original file stays untouched</small></div><div className="tiles">{['APK Analyzer','Asset Browser','Block Studio','Shader Lab'].map((x,i)=><button onClick={()=>setPage(x as Page)} key={x}><span>{['⌕','▧','▦','✳'][i]}</span><b>{x}</b><p>{['Inspect package contents and Godot fingerprints.','Browse textures, sounds, scenes, and scripts.','Build visual mod recipes.','Tune post-processing effects.'][i]}</p></button>)}</div></section>}
 {page==='APK Analyzer'&&<section className="content"><small className="eyebrow">PACKAGE INSPECTION / 00</small><h1>APK <em>Analyzer.</em></h1><p className="intro">First pass: inspect the APK container without changing the original.</p><div className="status"><b>{name||'No APK loaded'}</b><span>{entries.length?entries.length+' archive entries':'WAITING'}</span><button onClick={()=>input.current?.click()}><Upload size={14}/> Choose APK</button><input ref={input} hidden type="file" accept=".apk" onChange={e=>inspect(e.target.files?.[0])}/></div>{entries.length>0&&<><div className="findings"><h3>GODOT FINGERPRINTS</h3>{findings.map(f=><p key={f}><Check size={14}/>{f}</p>)}<small><ShieldCheck size={13}/> Filename hints are evidence, not proof of mod compatibility.</small></div><div className="search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search archive paths..."/><span>{filtered.length} entries</span></div><div className="file-list">{filtered.slice(0,150).map(x=><div key={x}><FileArchive size={15}/><b>{x}</b><small>{x.split('.').pop()?.toUpperCase()}</small></div>)}</div><p className="disclaimer"><Sparkles size={14}/> First 150 entries shown. Embedded PCK parsing and resource extraction are not implemented yet.</p></>}</section>}
 {page==='Assets'&&<section className="content"><small className="eyebrow">FILE EXPLORER / 01</small><h1>Asset <em>Browser.</em></h1><p className="intro">Real resource extraction is the next analyzer milestone.</p></section>}
 {page==='Block Studio'&&<section className="content"><small className="eyebrow">VISUAL LOGIC / 02</small><h1>Block <em>Studio.</em></h1><div className="block">⚡ WHEN GAME STARTS</div><div className="block orange">▧ CHANGE TEXTURE</div><div className="block green">✳ ADD POST-PROCESSING</div><p className="disclaimer">Visual recipe prototype. Runtime execution is not connected yet.</p></section>}
 {page==='Shader Lab'&&<section className="content"><small className="eyebrow">LOOK DEV / 03</small><h1>Shader <em>Lab.</em></h1><div className="preview">POST-PROCESSING PREVIEW</div></section>}
 {page==='Export'&&<section className="content"><small className="eyebrow">PACKAGING / 04</small><h1>Export <em>Bench.</em></h1><div className="export"><Package size={40}/><h2>Your mod bundle starts here.</h2><p>Portable .gmod packaging will be enabled after compatibility validation.</p></div></section>}
 </main>{toast&&<div className="toast"><Check size={14}/>{toast}</div>}</div>;
}
