import { useRef, useState } from 'react';
import { unzipSync } from 'fflate';
import { Blocks, Check, ChevronRight, FileArchive, Github, Grid2X2, Image, Package, ScanSearch, Search, ShieldCheck, Sparkles, Upload, WandSparkles, FileCode2, Database } from 'lucide-react';
import { parseGodotPck, type GodotPckInfo } from './lib/pck';

type Page = 'Overview' | 'APK Analyzer' | 'Assets' | 'Block Studio' | 'Shader Lab' | 'Export';
type PackResult = { containerPath: string; info?: GodotPckInfo; error?: string };
const pages: Page[] = ['Overview', 'APK Analyzer', 'Assets', 'Block Studio', 'Shader Lab', 'Export'];
const icons = [Grid2X2, ScanSearch, Image, Blocks, WandSparkles, Package];

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

export default function App() {
  const [page, setPage] = useState<Page>('Overview');
  const [name, setName] = useState('');
  const [entries, setEntries] = useState<string[]>([]);
  const [findings, setFindings] = useState<string[]>([]);
  const [packs, setPacks] = useState<PackResult[]>([]);
  const [query, setQuery] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [toast, setToast] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  async function inspect(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.apk')) {
      notify('Please choose an Android APK');
      return;
    }
    setName(file.name);
    setPage('APK Analyzer');
    setEntries([]);
    setPacks([]);
    setFindings([]);
    setQuery('');

    try {
      const archiveNames: string[] = [];
      const archiveSizes: Record<string, number> = {};
      const maxPckBytes = 256 * 1024 * 1024;
      const archive = unzipSync(new Uint8Array(await file.arrayBuffer()), {
        filter: item => {
          archiveNames.push(item.name);
          archiveSizes[item.name] = item.originalSize;
          // Keep the APK directory listing, but only decompress PCK payloads.
          return item.name.toLowerCase().endsWith('.pck') && item.originalSize <= maxPckBytes;
        },
      });
      const names = archiveNames.sort();
      const lower = names.map(path => path.toLowerCase());
      setEntries(names);

      const detected: string[] = [];
      if (lower.some(path => path.endsWith('.pck'))) detected.push('Godot PCK resource pack found inside the APK');
      if (lower.some(path => path.endsWith('project.godot') || path.endsWith('engine.cfg'))) detected.push('Godot project configuration detected');
      if (lower.some(path => path.includes('godot') && path.endsWith('.so'))) detected.push('Godot native runtime library detected');
      if (lower.some(path => /\.(gd|gdc|gde)$/.test(path))) detected.push('GDScript source or compiled script detected');
      if (lower.some(path => /\.(tscn|scn)$/.test(path))) detected.push('Godot scene resource detected');
      if (lower.some(path => /\.(tres|res)$/.test(path))) detected.push('Godot resource file detected');

      const packResults: PackResult[] = [];
      for (const path of names.filter(item => item.toLowerCase().endsWith('.pck'))) {
        if (archiveSizes[path] > maxPckBytes) {
          packResults.push({ containerPath: path, error: 'PCK is larger than the 256 MB browser inspection limit. It was skipped to protect device memory.' });
          continue;
        }
        try {
          const pckBytes = archive[path];
          if (!pckBytes) throw new Error('PCK payload was not extracted from the APK archive.');
          packResults.push({ containerPath: path, info: parseGodotPck(pckBytes) });
        } catch (error) {
          packResults.push({
            containerPath: path,
            error: error instanceof Error ? error.message : 'PCK could not be parsed.',
          });
        }
      }

      setPacks(packResults);
      if (packResults.some(pack => pack.info)) detected.push('PCK directory parsed and resource table indexed');
      if (packResults.some(pack => pack.error?.toLowerCase().includes('encrypted directory'))) detected.push('Encrypted PCK directory detected; file listing is locked');
      setFindings(detected.length ? detected : ['No definitive Godot fingerprints found in the APK directory']);
      notify(packResults.some(pack => pack.info)
        ? 'APK inspected. Godot resource table is ready.'
        : 'APK directory inspected. Original file untouched.');
    } catch {
      setEntries([]);
      setPacks([]);
      setFindings([]);
      notify('Could not read this APK archive');
    }
  }

  const filteredArchive = entries.filter(path => path.toLowerCase().includes(query.toLowerCase()));
  const totalPckFiles = packs.reduce((total, pack) => total + (pack.info?.entries.length ?? 0), 0);
  const filteredResources = packs.flatMap(pack =>
    (pack.info?.entries ?? [])
      .filter(entry => entry.path.toLowerCase().includes(query.toLowerCase()))
      .map(entry => ({ ...entry, containerPath: pack.containerPath })),
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="mark">g✳</span><div><b>gummmods</b><small>THE MOD WORKSHOP</small></div></div>
        <div className="workspace">🎮 <b>Gummmods Playground</b></div>
        <label>WORKSPACE</label>
        <nav>{pages.map((item, index) => {
          const Icon = icons[index];
          return <button className={page === item ? 'active' : ''} onClick={() => setPage(item)} key={item}><Icon size={17} />{item}</button>;
        })}</nav>
        <div className="sidebar-bottom"><Github size={16} /><b>OPEN SOURCE PLAYGROUND</b><p>Built for curious modders. Original files stay untouched.</p><a href="https://github.com/Salt-the-Fries/Gummmods-playground" target="_blank" rel="noreferrer">View repository ↗</a></div>
      </aside>

      <main>
        <header>Gummmods Playground <ChevronRight size={14} /><b>{page}</b><span>EARLY ACCESS · 0.3.0</span></header>

        {page === 'Overview' && <section className="content">
          <small className="eyebrow">YOUR GAME. YOUR RULES.</small>
          <h1>Make games feel<br /><em>a little more yours.</em></h1>
          <p className="intro">Inspect Godot games, remix their assets, and build mods with blocks instead of headaches.</p>
          <div className="drop" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); inspect(event.dataTransfer.files[0]); }} onClick={() => input.current?.click()}>
            <input ref={input} hidden type="file" accept=".apk" onChange={event => inspect(event.target.files?.[0])} />
            <Upload size={24} /><h2>Drop an Android APK in here</h2><p>We inspect the archive locally. Nothing gets uploaded.</p>
            <button onClick={event => { event.stopPropagation(); input.current?.click(); }}>＋ Import APK</button>
            <small><ShieldCheck size={13} /> Original file stays untouched</small>
          </div>
          <div className="tiles">{['APK Analyzer', 'Asset Browser', 'Block Studio', 'Shader Lab'].map((item, index) =>
            <button onClick={() => setPage(item as Page)} key={item}><span>{['⌕', '▧', '▦', '✳'][index]}</span><b>{item}</b><p>{['Inspect package contents and Godot resource packs.', 'Browse textures, sounds, scenes, and scripts.', 'Build visual mod recipes.', 'Tune post-processing effects.'][index]}</p></button>,
          )}</div>
        </section>}

        {page === 'APK Analyzer' && <section className="content">
          <small className="eyebrow">PACKAGE INSPECTION / 00</small>
          <h1>APK <em>Analyzer.</em></h1>
          <p className="intro">Inspect the APK container, identify Godot packs, and read supported PCK resource directories.</p>
          <div className="status"><b>{name || 'No APK loaded'}</b><span>{entries.length ? `${entries.length} archive entries` : 'WAITING'}</span>
            <button onClick={() => input.current?.click()}><Upload size={14} /> Choose APK</button>
            <input ref={input} hidden type="file" accept=".apk" onChange={event => inspect(event.target.files?.[0])} />
          </div>
          {entries.length > 0 && <>
            <div className="findings"><h3>GODOT FINGERPRINTS</h3>
              {findings.map(finding => <p key={finding}><Check size={14} />{finding}</p>)}
              <small><ShieldCheck size={13} /> Filename hints are evidence, not proof of mod compatibility.</small>
            </div>

            {packs.length > 0 && <div className="pack-section">
              <div className="section-heading"><div><small className="eyebrow">RESOURCE PACK INTELLIGENCE</small><h2>Found <em>{packs.length}</em> PCK {packs.length === 1 ? 'pack' : 'packs'}</h2></div><span>{totalPckFiles.toLocaleString()} indexed files</span></div>
              {packs.map(pack => <article className="pack-card" key={pack.containerPath}>
                <div className="pack-top"><FileArchive size={17} /><b>{pack.containerPath}</b><span>{pack.info ? `GODOT ${pack.info.engineVersion}` : 'NEEDS ATTENTION'}</span></div>
                {pack.info ? <>
                  <div className="pack-stats"><div><small>FORMAT</small><b>v{pack.info.formatVersion}</b></div><div><small>FILES</small><b>{pack.info.fileCount.toLocaleString()}</b></div><div><small>DIRECTORY</small><b>{pack.info.directoryEncrypted ? 'Encrypted' : 'Readable'}</b></div></div>
                  {pack.info.warnings.length > 0 && <div className="pack-warnings">{pack.info.warnings.slice(0, 3).map(warning => <p key={warning}>⚠ {warning}</p>)}</div>}
                </> : <p className="pack-error">{pack.error}</p>}
              </article>)}
            </div>}

            <div className="search"><Search size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search resource paths and archive files..." /><span>{totalPckFiles ? `${filteredResources.length} / ${totalPckFiles} resources` : `${filteredArchive.length} entries`}</span></div>

            {totalPckFiles > 0 && <div className="resource-list">
              <div className="list-heading"><b><Database size={14} /> PCK RESOURCE TABLE</b><small>DIRECTORY METADATA ONLY</small></div>
              {filteredResources.slice(0, 300).map(entry => <div className="resource-row" key={entry.containerPath + entry.path}>
                <FileCode2 size={15} /><div className="resource-name"><b>{entry.path}</b><small>{entry.containerPath} · {entry.kind}</small></div>
                <span>{formatBytes(entry.size)}</span>
                {entry.encrypted && <i>LOCKED</i>}
              </div>)}
              {filteredResources.length > 300 && <p className="list-footer">Showing 300 of {filteredResources.length.toLocaleString()} matches. Search to narrow the list.</p>}
              {filteredResources.length === 0 && <p className="list-footer">No PCK resources match that search.</p>}
            </div>}

            <button className="archive-toggle" onClick={() => setShowArchive(value => !value)}>{showArchive ? '− Hide' : '+ Show'} raw APK archive entries <span>{filteredArchive.length}</span></button>
            {showArchive && <div className="file-list">{filteredArchive.slice(0, 150).map(path => <div key={path}><FileArchive size={15} /><b>{path}</b><small>{path.split('.').pop()?.toUpperCase()}</small></div>)}</div>}
            <p className="disclaimer"><Sparkles size={14} /> This pass reads PCK directory metadata only. It does not decrypt, execute, extract, or modify game files.</p>
          </>}
        </section>}

        {page === 'Assets' && <section className="content"><small className="eyebrow">FILE EXPLORER / 01</small><h1>Asset <em>Browser.</em></h1><p className="intro">The PCK resource table is now readable in APK Analyzer. Asset previews and safe extraction are next.</p></section>}
        {page === 'Block Studio' && <section className="content"><small className="eyebrow">VISUAL LOGIC / 02</small><h1>Block <em>Studio.</em></h1><div className="block">⚡ WHEN GAME STARTS</div><div className="block orange">▧ CHANGE TEXTURE</div><div className="block green">✳ ADD POST-PROCESSING</div><p className="disclaimer">Visual recipe prototype. Runtime execution is not connected yet.</p></section>}
        {page === 'Shader Lab' && <section className="content"><small className="eyebrow">LOOK DEV / 03</small><h1>Shader <em>Lab.</em></h1><div className="preview">POST-PROCESSING PREVIEW</div></section>}
        {page === 'Export' && <section className="content"><small className="eyebrow">PACKAGING / 04</small><h1>Export <em>Bench.</em></h1><div className="export"><Package size={40} /><h2>Your mod bundle starts here.</h2><p>Portable .gmod packaging will be enabled after compatibility validation.</p></div></section>}
      </main>
      {toast && <div className="toast"><Check size={14} />{toast}</div>}
    </div>
  );
}
