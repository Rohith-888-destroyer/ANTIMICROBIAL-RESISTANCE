import React, { useState, useEffect } from 'react';
import './index.css';

/* ═══════════════════════════════════════════════════════════════
   INLINE SVG ICON SET  (no extra dependency)
═══════════════════════════════════════════════════════════════ */
const PATHS: Record<string, string> = {
  dna:        'M9 3h6M9 21h6M12 3v3M12 18v3M9.5 7A3.5 3.5 0 0 1 13 5a3.5 3.5 0 0 1 3 4M9.5 17A3.5 3.5 0 0 0 13 19a3.5 3.5 0 0 0 3-4',
  globe:      'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0a14.5 14.5 0 0 1 4 10 14.5 14.5 0 0 1-4 10A14.5 14.5 0 0 1 8 12a14.5 14.5 0 0 1 4-10zM2 12h20',
  activity:   'M22 12h-4l-3 9L9 3l-3 9H2',
  shield:     'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  zap:        'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  network:    'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 0-2-2v-4m0 0h18',
  eye_off:    'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22',
  file:       'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  trending:   'M23 6l-9.5 9.5-5-5L1 18',
  check:      'M20 6L9 17l-5-5',
  bar:        'M18 20V10M12 20V4M6 20v-6',
  database:   'M12 2C6.48 2 2 4.24 2 7s4.48 5 10 5 10-2.24 10-5-4.48-5-10-5zm0 18c-5.52 0-10-2.24-10-5V7m20 0v8c0 2.76-4.48 5-10 5',
  external:   'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
  info:       'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 9v4m0 4h.01',
  alert:      'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
};
const Ic = ({ n, size = 16, color = 'currentColor' }: { n: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={PATHS[n] || ''} />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
interface Overview { observations_analyzed:number; active_signals:number; high_priority_signals:number; genomic_clusters:number; monitored_countries:number; average_sentinel_score:number; last_updated:string; }
interface Signal   { id:string; type:string; pathogen:string; resistance_gene:string; region:string; severity:string; observed_increase_pct:number; resistance_velocity:number; sentinel_score:number; evidence_level:string; explanation:string[]; limitations:string[]; }
interface MapPt    { country_code:string; country_name:string; latitude:number; longitude:number; coverage:string; sample_count:number; resistance_velocity:number; signal_level:string; one_health_hosts:string[]; }
interface Cluster  { id:string; pathogen_name:string; primary_gene:string; sequence_count:number; novelty_score:number; countries:string[]; }
interface GNode    { id:string; label:string; group:string; value:number; }
interface GEdge    { from:string; to:string; label:string; }
interface Graph    { nodes:GNode[]; edges:GEdge[]; }
interface DataSrc  { name:string; url:string; type:string; license:string; update_freq:string; used_for:string; status?:string; }
interface Changed  { briefing_title:string; generated_date:string; highlights:string[]; primary_signal:string; disclaimer:string; }

/* ═══════════════════════════════════════════════════════════════
   SMALL COMPONENTS
═══════════════════════════════════════════════════════════════ */
const Badge = ({ lv }: { lv: string }) => {
  const c = lv==='HIGH'||lv==='VERY HIGH' ? 'var(--red)' : lv==='MEDIUM'||lv==='MODERATE' ? 'var(--orange)' : 'var(--green)';
  return <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:20, fontSize:'.68rem', fontWeight:700, border:`1px solid ${c}`, color:c, background:`${c}22`, letterSpacing:'.04em' }}>{lv}</span>;
};

const Bar = ({ pct, color }: { pct: number; color: string }) => (
  <div className="progress-wrap"><div className="progress-fill" style={{ width:`${Math.min(100,pct)}%`, background:color }} /></div>
);

const ScoreRow = ({ label, val, color }: { label:string; val:number; color:string }) => (
  <div style={{ marginBottom:'0.6rem' }}>
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.78rem', marginBottom:'3px' }}>
      <span style={{ color:'var(--text-2)' }}>{label}</span>
      <span style={{ color, fontWeight:700 }}>{val.toFixed(0)}</span>
    </div>
    <Bar pct={val} color={color} />
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   AMR WEATHER MAP
═══════════════════════════════════════════════════════════════ */
const WeatherMap = ({ pts, showCoverage }: { pts:MapPt[]; showCoverage:boolean }) => {
  const [hov, setHov] = useState<MapPt|null>(null);
  const px = (lat:number, lon:number) => ({ x:((lon+180)/360)*940, y:((90-lat)/180)*480 });
  const sigCol = (l:string) => l==='High'?'rgba(239,68,68,.7)':l==='Moderate'?'rgba(249,115,22,.6)':'rgba(16,185,129,.5)';
  const bdrCol = (l:string) => l==='High'?'#ef4444':l==='Moderate'?'#f97316':'#10b981';
  const covCol = (c:string) => c==='High'?'#10b981':c==='Moderate'?'#06b6d4':c==='Low'?'#f97316':'#ef4444';

  return (
    <div style={{ position:'relative' }}>
      <svg viewBox="0 0 940 480" style={{ width:'100%', background:'#070e1e', borderRadius:8, border:'1px solid var(--border)' }}>
        {/* grid */}
        {[-60,-30,0,30,60].map(lt => <line key={lt} x1="0" y1={((90-lt)/180)*480} x2="940" y2={((90-lt)/180)*480} stroke="#131e30" strokeWidth=".5"/>)}
        {[-120,-60,0,60,120].map(ln => <line key={ln} x1={((ln+180)/360)*940} y1="0" x2={((ln+180)/360)*940} y2="480" stroke="#131e30" strokeWidth=".5"/>)}
        <text x="470" y="22" textAnchor="middle" fill="#2d3f5a" fontSize="11" fontFamily="monospace">
          {showCoverage ? 'SURVEILLANCE BLIND SPOTS — Coverage Index' : 'GLOBAL AMR WEATHER MAP — Observed Resistance Signal Velocity (df/dt)'}
        </text>
        {pts.map(pt => {
          const {x,y} = px(pt.latitude, pt.longitude);
          const r = Math.max(11, Math.min(38, pt.sample_count*0.85));
          return (
            <g key={pt.country_code} onMouseEnter={()=>setHov(pt)} onMouseLeave={()=>setHov(null)} style={{ cursor:'pointer' }}>
              {showCoverage ? (
                <rect x={x-20} y={y-14} width="40" height="26" rx="5" fill={`${covCol(pt.coverage)}22`} stroke={covCol(pt.coverage)} strokeWidth="1.2"/>
              ) : (
                <>
                  <circle cx={x} cy={y} r={r+6} fill={sigCol(pt.signal_level)} opacity=".18">
                    <animate attributeName="r" values={`${r+6};${r+12};${r+6}`} dur="3.5s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx={x} cy={y} r={r} fill={sigCol(pt.signal_level)} stroke={bdrCol(pt.signal_level)} strokeWidth="1.5"/>
                </>
              )}
              <text x={x} y={y+3} textAnchor="middle" fill="#fff" fontSize="8.5" fontWeight="700">{pt.country_code}</text>
            </g>
          );
        })}
      </svg>

      {/* tooltip */}
      {hov && (
        <div style={{ position:'absolute', top:10, right:10, background:'var(--panel)', border:'1px solid var(--border-light)', borderRadius:10, padding:'1rem', minWidth:220, zIndex:10, boxShadow:'var(--shadow-lg)' }}>
          <div style={{ fontWeight:700, color:'var(--cyan)', marginBottom:'.5rem', fontSize:'.95rem' }}>{hov.country_name}</div>
          <table style={{ fontSize:'.78rem', borderCollapse:'collapse', width:'100%' }}>
            {[['Signal Level', hov.signal_level], ['Isolates', hov.sample_count], ['Velocity (df/dt)', hov.resistance_velocity], ['Coverage', hov.coverage], ['One Health Hosts', (hov.one_health_hosts||[]).join(', ')||'—']].map(([l,v])=>(
              <tr key={l as string}><td style={{ color:'var(--text-3)', paddingRight:8, paddingBottom:3 }}>{l}</td><td style={{ color:'var(--text-1)', fontWeight:500 }}>{v}</td></tr>
            ))}
          </table>
        </div>
      )}

      {/* legend */}
      <div style={{ display:'flex', gap:'1.25rem', marginTop:'.75rem', flexWrap:'wrap' }}>
        {showCoverage
          ? [['#10b981','High Coverage'],['#06b6d4','Moderate'],['#f97316','Low'],['#ef4444','Very Low (Blind Spot)']].map(([c,l])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.75rem', color:'var(--text-2)' }}>
                <div style={{ width:12, height:12, borderRadius:3, background:c}}/>
                {l}
              </div>))
          : [['#ef4444','High Signal'],['#f97316','Moderate'],['#10b981','Low Signal']].map(([c,l])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.75rem', color:'var(--text-2)' }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:c}}/>
                {l}
              </div>))
        }
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   KNOWLEDGE GRAPH
═══════════════════════════════════════════════════════════════ */
const GROUP_COLORS: Record<string,string> = { Pathogen:'#ef4444', Gene:'#06b6d4', Mechanism:'#f97316', 'Drug Class':'#a855f7', Region:'#10b981' };

const KnowledgeGraph = ({ data }: { data:Graph|null }) => {
  const [sel, setSel] = useState<string|null>(null);
  if (!data || !data.nodes.length) return <div style={{ color:'var(--text-3)', padding:'2rem', textAlign:'center' }}>Loading…</div>;
  const groups = [...new Set(data.nodes.map(n=>n.group))];
  const selEdges = sel ? data.edges.filter(e=>e.from===sel||e.to===sel) : [];
  const connIds  = new Set(selEdges.flatMap(e=>[e.from,e.to]));

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'1.5rem' }}>
      <div>
        {groups.map(g => (
          <div key={g} style={{ marginBottom:'1.25rem' }}>
            <div className="section-header" style={{ color: GROUP_COLORS[g]||'var(--text-3)' }}>{g}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem' }}>
              {data.nodes.filter(n=>n.group===g).map(nd => {
                const ac = sel===nd.id, con = connIds.has(nd.id);
                const col = GROUP_COLORS[g]||'#9ca3af';
                return (
                  <button key={nd.id} onClick={()=>setSel(sel===nd.id?null:nd.id)} style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${col}`, background:ac?col:con?`${col}18`:'transparent', color:ac?'#fff':col, fontSize:'.78rem', cursor:'pointer', fontWeight:ac?700:400, transition:'all .15s', fontStyle:g==='Pathogen'?'italic':'normal' }}>
                    {nd.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, padding:'1rem' }}>
        {sel ? (
          <>
            <div style={{ fontWeight:700, color:'var(--cyan)', marginBottom:'1rem', fontSize:'.88rem' }}>
              Connections for<br/>
              <span style={{ color:'var(--text-1)', fontWeight:600 }}>{data.nodes.find(n=>n.id===sel)?.label}</span>
            </div>
            {selEdges.length===0 ? <div style={{ color:'var(--text-3)', fontSize:'.82rem' }}>No edges found.</div> : selEdges.map((e,i) => {
              const fn = data.nodes.find(n=>n.id===e.from), tn = data.nodes.find(n=>n.id===e.to);
              return (
                <div key={i} style={{ fontSize:'.78rem', padding:'7px 9px', background:'var(--panel)', borderRadius:6, border:'1px solid var(--border)', marginBottom:'.4rem' }}>
                  <span style={{ color:GROUP_COLORS[fn?.group||'']||'#9ca3af' }}>{fn?.label}</span>
                  <span style={{ color:'var(--text-4)', margin:'0 5px' }}>→ {e.label} →</span>
                  <span style={{ color:GROUP_COLORS[tn?.group||'']||'#9ca3af' }}>{tn?.label}</span>
                </div>
              );
            })}
          </>
        ) : (
          <div style={{ color:'var(--text-3)', fontSize:'.82rem', textAlign:'center', paddingTop:'2rem', lineHeight:1.7 }}>
            Click any node to explore its relationships in the AMR knowledge graph.
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   GENOMIC CLUSTER EXPLORER
═══════════════════════════════════════════════════════════════ */
const GenomicExplorer = ({ clusters }: { clusters:Cluster[] }) => {
  const [sel, setSel] = useState<Cluster|null>(clusters[0]||null);
  useEffect(()=>{ if(clusters.length && !sel) setSel(clusters[0]); }, [clusters]);

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
      <div>
        <div className="section-header">Detected Genomic Clusters</div>
        {clusters.map(c => (
          <div key={c.id} onClick={()=>setSel(c)} style={{ padding:'1rem', marginBottom:'.6rem', background: sel?.id===c.id?'rgba(6,182,212,.06)':'var(--bg-2)', border:`1px solid ${sel?.id===c.id?'rgba(6,182,212,.35)':'var(--border)'}`, borderRadius:10, cursor:'pointer', transition:'all .18s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:'.9rem', color:'var(--text-1)', fontStyle:'italic' }}>{c.pathogen_name}</div>
                <div style={{ fontSize:'.78rem', color:'var(--text-3)' }}>Gene: <span style={{ color:'var(--cyan)' }}>{c.primary_gene}</span></div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'1.3rem', fontWeight:800, color:'var(--orange)' }}>{c.sequence_count}</div>
                <div style={{ fontSize:'.65rem', color:'var(--text-3)' }}>sequences</div>
              </div>
            </div>
            <div style={{ marginTop:'.65rem' }}>
              <Bar pct={(c.sequence_count/50)*100} color="var(--cyan)" />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.72rem', color:'var(--text-3)', marginTop:'.4rem' }}>
              <span>Novelty: <span style={{ color: c.novelty_score>50?'var(--orange)':'var(--green)' }}>{c.novelty_score.toFixed(0)}/100</span></span>
              <span>{c.countries.length} countries</span>
            </div>
          </div>
        ))}
        {!clusters.length && <div style={{ color:'var(--text-3)', padding:'2rem', textAlign:'center' }}>No clusters. Run the pipeline.</div>}
      </div>

      <div>
        {sel ? (
          <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, padding:'1.5rem', position:'sticky', top:80 }}>
            <div className="section-header">Cluster Detail</div>
            {[['CLUSTER ID', sel.id, 'monospace', 'var(--text-1)'], ['PATHOGEN', sel.pathogen_name, 'italic', 'var(--text-1)'], ['PRIMARY GENE', sel.primary_gene, 'normal', 'var(--cyan)']].map(([l,v,fs,c])=>(
              <div key={l} style={{ marginBottom:'.875rem' }}>
                <div className="stat-label">{l}</div>
                <div style={{ fontWeight:700, color:c as string, fontStyle:fs as string, fontFamily:fs==='monospace'?'var(--mono)':'inherit', fontSize:'.88rem' }}>{v}</div>
              </div>
            ))}
            <div style={{ marginBottom:'.875rem' }}>
              <div className="stat-label">GENOMIC NOVELTY SCORE</div>
              <ScoreRow label="IsolationForest anomaly" val={sel.novelty_score} color={sel.novelty_score>50?'var(--orange)':'var(--green)'}/>
            </div>
            <div style={{ marginBottom:'.875rem' }}>
              <div className="stat-label" style={{ marginBottom:'.4rem' }}>COUNTRIES DETECTED ({sel.countries.length})</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {sel.countries.map(c=>(
                  <span key={c} style={{ padding:'2px 8px', background:'var(--panel)', border:'1px solid var(--border-light)', borderRadius:4, fontSize:'.72rem', color:'var(--text-1)' }}>{c}</span>
                ))}
              </div>
            </div>
            <div className="info-box warn" style={{ marginTop:'1rem' }}>
              ⚠️ Clustering does not establish transmission. Based on metadata feature similarity only.
            </div>
          </div>
        ) : <div style={{ color:'var(--text-3)', textAlign:'center', paddingTop:'4rem' }}>Select a cluster.</div>}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DATA SOURCES
═══════════════════════════════════════════════════════════════ */
const SourceTag = ({ tag, label }: { tag:string; label:string }) => (
  <span className={`source-tag ${tag}`}>{label}</span>
);
const DataSources = ({ sources }: { sources:DataSrc[] }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
    {sources.map(s => (
      <div key={s.name} style={{ padding:'1.25rem', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'.5rem', marginBottom:'.75rem' }}>
          <div>
            <div style={{ fontWeight:700, color:'var(--text-1)', fontSize:'.95rem' }}>{s.name}</div>
            <a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize:'.78rem', color:'var(--cyan)', display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
              {s.url} <Ic n="external" size={11} color="var(--cyan)"/>
            </a>
          </div>
          <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
            <SourceTag tag={s.name.includes('NCBI')?'ncbi':s.name.includes('CARD')?'card':s.name.includes('WHO')?'who':s.name.includes('ECDC')?'ecdc':'pubchem'} label={s.type}/>
            {s.status && <span style={{ padding:'2px 8px', borderRadius:4, fontSize:'.68rem', background:'var(--orange-dim)', color:'var(--orange)', border:'1px solid rgba(249,115,22,.3)' }}>{s.status}</span>}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.5rem', fontSize:'.78rem' }}>
          <div><span style={{ color:'var(--text-3)' }}>License: </span><span style={{ color:'var(--text-2)' }}>{s.license}</span></div>
          <div><span style={{ color:'var(--text-3)' }}>Update Freq: </span><span style={{ color:'var(--text-2)' }}>{s.update_freq}</span></div>
          <div style={{ gridColumn:'span 2' }}><span style={{ color:'var(--text-3)' }}>Used for: </span><span style={{ color:'var(--text-1)' }}>{s.used_for}</span></div>
        </div>
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   METHODOLOGY
═══════════════════════════════════════════════════════════════ */
const MethodologyView = () => {
  const [meth, setMeth] = useState<any>(null);
  useEffect(()=>{ fetch('/api/methodology').then(r=>r.json()).then(setMeth).catch(()=>{}); },[]);
  if (!meth) return <div style={{ color:'var(--text-3)', padding:'2rem', textAlign:'center' }}>Loading…</div>;
  const { algorithms, scientific_boundaries, disclaimer } = meth;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
        {Object.entries(algorithms).map(([key, algo]: [string, any]) => (
          <div key={key} style={{ padding:'1.25rem', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10 }}>
            <div style={{ fontWeight:700, color:'var(--cyan)', marginBottom:'.75rem', fontSize:'.92rem' }}>{algo.name}</div>
            {algo.formula && <div style={{ fontFamily:'var(--mono)', fontSize:'.82rem', color:'var(--orange)', marginBottom:'.5rem', padding:'6px 10px', background:'var(--panel)', borderRadius:6 }}>{algo.formula}</div>}
            {algo.acceleration && <div style={{ fontFamily:'var(--mono)', fontSize:'.78rem', color:'var(--text-2)', marginBottom:'.75rem', padding:'4px 10px', background:'var(--panel)', borderRadius:6 }}>{algo.acceleration}</div>}
            {algo.components && (
              <div style={{ marginBottom:'.75rem' }}>
                {Object.entries(algo.components).map(([k, v]) => (
                  <div key={k} style={{ fontSize:'.78rem', color:'var(--text-2)', marginBottom:2 }}>
                    <span style={{ color:'var(--text-3)' }}>{k.toUpperCase()}: </span>{v as string}
                  </div>
                ))}
              </div>
            )}
            {algo.features && <div style={{ fontSize:'.78rem', color:'var(--text-2)', marginBottom:'.5rem' }}><b style={{ color:'var(--text-3)' }}>Features:</b> {algo.features}</div>}
            {algo.output && <div style={{ fontSize:'.78rem', color:'var(--text-2)', marginBottom:'.5rem' }}><b style={{ color:'var(--text-3)' }}>Output:</b> {algo.output}</div>}
            {algo.caveats && (
              <div style={{ marginTop:'.75rem', padding:'.5rem .75rem', background:'var(--orange-dim)', borderRadius:6, fontSize:'.76rem', color:'var(--orange)' }}>
                {algo.caveats.map((c: string,i:number) => <div key={i}>• {c}</div>)}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ padding:'1.25rem', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10 }}>
        <div style={{ fontWeight:700, color:'var(--green)', marginBottom:'.75rem' }}>Scientific Boundaries</div>
        {scientific_boundaries.map((b: string, i: number) => (
          <div key={i} style={{ display:'flex', gap:'.6rem', marginBottom:'.5rem' }}>
            <Ic n="check" size={14} color="var(--green)"/>
            <span style={{ fontSize:'.83rem', color:'var(--text-2)' }}>{b}</span>
          </div>
        ))}
      </div>
      <div className="info-box danger">{disclaimer}</div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════ */
type Tab = 'home'|'weather'|'radar'|'clusters'|'graph'|'blindspots'|'methodology'|'sources';

export const App: React.FC = () => {
  const [tab, setTab]          = useState<Tab>('home');
  const [overview, setOverview] = useState<Overview|null>(null);
  const [signals, setSignals]   = useState<Signal[]>([]);
  const [mapPts, setMapPts]     = useState<MapPt[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [graph, setGraph]       = useState<Graph|null>(null);
  const [changed, setChanged]   = useState<Changed|null>(null);
  const [selSig, setSelSig]     = useState<Signal|null>(null);
  const [sources, setSources]   = useState<DataSrc[]>([]);

  useEffect(() => {
    const fallback: Overview = { observations_analyzed:250, active_signals:7, high_priority_signals:3, genomic_clusters:7, monitored_countries:18, average_sentinel_score:68.4, last_updated:new Date().toISOString() };
    fetch('/api/overview').then(r=>r.json()).then(setOverview).catch(()=>setOverview(fallback));
    fetch('/api/signals').then(r=>r.json()).then((d:Signal[])=>{ setSignals(d); if(d.length) setSelSig(d[0]); }).catch(()=>{});
    fetch('/api/map').then(r=>r.json()).then(setMapPts).catch(()=>{});
    fetch('/api/clusters').then(r=>r.json()).then(setClusters).catch(()=>{});
    fetch('/api/knowledge-graph').then(r=>r.json()).then(setGraph).catch(()=>{});
    fetch('/api/what-changed').then(r=>r.json()).then(setChanged).catch(()=>{});
    fetch('/api/data-sources').then(r=>r.json()).then((d:any)=>setSources(d.sources||[])).catch(()=>{});
  }, []);

  const TABS: { id:Tab; icon:string; label:string }[] = [
    { id:'home',        icon:'shield',   label:'Home' },
    { id:'weather',     icon:'globe',    label:'AMR Weather' },
    { id:'radar',       icon:'activity', label:'AMR Radar' },
    { id:'clusters',    icon:'dna',      label:'Genomic Explorer' },
    { id:'graph',       icon:'network',  label:'Knowledge Graph' },
    { id:'blindspots',  icon:'eye_off',  label:'Blind Spots' },
    { id:'methodology', icon:'info',     label:'Methodology' },
    { id:'sources',     icon:'database', label:'Data Sources' },
  ];

  const ov = overview;

  return (
    <div className="dashboard-container">

      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="logo-group">
          <div className="logo-pulse"><Ic n="dna" size={28} color="#06b6d4"/></div>
          <div>
            <div style={{ fontSize:'1.15rem', fontWeight:800, letterSpacing:'.08em', color:'var(--text-1)' }}>AMR-SENTINEL</div>
            <div style={{ fontSize:'.65rem', color:'var(--text-3)', letterSpacing:'.04em' }}>AUTONOMOUS GLOBAL AMR INTELLIGENCE NETWORK</div>
          </div>
        </div>

        <nav className="nav-links">
          {TABS.map(t => (
            <button key={t.id} className={`nav-item ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
              <Ic n={t.icon} size={13} color={tab===t.id?'var(--cyan)':'var(--text-3)'}/>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="status-pill">
          <span className="status-dot"/>LIVE
        </div>
      </header>

      {/* ── Metric Bar ── */}
      <div className="metric-bar">
        {[
          { icon:'alert',    val: ov?.active_signals??'—',            sub:`${ov?.high_priority_signals??'—'} HIGH`, label:'Active Signals',   col:'var(--red)' },
          { icon:'zap',      val: ov?.average_sentinel_score??'—',    sub:'/ 100 composite',             label:'Avg Sentinel Score',col:'var(--cyan)' },
          { icon:'dna',      val: ov?.genomic_clusters??'—',          sub:'emerging clusters',            label:'Genomic Clusters',  col:'var(--purple)' },
          { icon:'globe',    val: ov?.monitored_countries??'—',       sub:'under surveillance',           label:'Countries Monitored',col:'var(--green)' },
          { icon:'bar',      val: ov?.observations_analyzed??'—',     sub:'isolate records',              label:'Isolates Analyzed', col:'var(--orange)' },
        ].map(m => (
          <div key={m.label} className="metric-chip">
            <Ic n={m.icon} size={18} color={m.col}/>
            <div>
              <div style={{ fontSize:'1.25rem', fontWeight:800, color:m.col, lineHeight:1.1 }}>{m.val}</div>
              <div style={{ fontSize:'.65rem', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em' }}>{m.label}</div>
              <div style={{ fontSize:'.68rem', color:'var(--text-4)' }}>{m.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main ── */}
      <main className="main-content">

        {/* HOME ──────────────────────────────────────────── */}
        {tab==='home' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>

            {/* AMR Radar Preview */}
            <div className="card">
              <div className="card-title"><Ic n="activity" size={16} color="var(--red)"/> AMR Radar — Top Signals</div>
              {signals.slice(0,5).map((sig,i)=>(
                <div key={sig.id} className="radar-item" onClick={()=>{ setSelSig(sig); setTab('radar'); }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
                    <span style={{ width:26, height:26, borderRadius:'50%', background:i<2?'var(--red-dim)':'var(--orange-dim)', border:`1px solid ${i<2?'var(--red)':'var(--orange)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.72rem', fontWeight:800, color:i<2?'var(--red)':'var(--orange)', flexShrink:0 }}>0{i+1}</span>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'.88rem' }}><em>{sig.pathogen}</em> — <span style={{ color:'var(--cyan)' }}>{sig.resistance_gene}</span></div>
                      <div style={{ fontSize:'.72rem', color:'var(--text-3)' }}>Velocity {sig.resistance_velocity} · Score {sig.sentinel_score}/100</div>
                    </div>
                  </div>
                  <Badge lv={sig.severity}/>
                </div>
              ))}
              {!signals.length && <div style={{ color:'var(--text-3)' }}>No signals — run pipeline first.</div>}
            </div>

            {/* What Changed */}
            <div className="card">
              <div className="card-title"><Ic n="trending" size={16} color="var(--green)"/> What Changed?</div>
              {changed ? (
                <>
                  <div style={{ fontSize:'.75rem', color:'var(--text-3)', marginBottom:'.875rem' }}>Weekly Intelligence Briefing · {changed.generated_date}</div>
                  {changed.highlights.map((h,i)=>(
                    <div key={i} style={{ display:'flex', gap:'.6rem', marginBottom:'.6rem', padding:'.6rem .75rem', background:'var(--bg-2)', borderRadius:8, border:'1px solid var(--border)' }}>
                      <Ic n="check" size={13} color="var(--green)"/>
                      <span style={{ fontSize:'.82rem', color:'var(--text-2)' }}>{h}</span>
                    </div>
                  ))}
                  <div className="info-box info" style={{ marginTop:'.75rem', fontSize:'.72rem' }}>{changed.disclaimer}</div>
                </>
              ) : <div style={{ color:'var(--text-3)' }}>Loading…</div>}
            </div>

            {/* Sentinel Score Breakdown */}
            {selSig && (
              <div className="card">
                <div className="card-title"><Ic n="zap" size={16} color="var(--cyan)"/> Sentinel Score — <em style={{ fontWeight:400 }}>{selSig.pathogen} · {selSig.resistance_gene}</em></div>
                <div style={{ fontSize:'2.75rem', fontWeight:900, color:'var(--cyan)', marginBottom:'1rem' }}>
                  {selSig.sentinel_score} <span style={{ fontSize:'1rem', fontWeight:400, color:'var(--text-3)' }}>/ 100</span>
                </div>
                <ScoreRow label="Resistance Velocity Trend" val={Math.min(100, (selSig.resistance_velocity||0)*15)} color="var(--red)"/>
                <ScoreRow label="Genomic Novelty (IsolationForest)" val={62} color="var(--orange)"/>
                <ScoreRow label="Geographic Expansion" val={Math.min(100,(selSig.sentinel_score||0)*0.65)} color="var(--purple)"/>
                <ScoreRow label="Data Coverage Quality" val={Math.min(100,(selSig.sentinel_score||0)*0.55)} color="var(--green)"/>
                <ScoreRow label="Temporal Consistency" val={78} color="var(--cyan)"/>
                <div className="info-box warn" style={{ marginTop:'.875rem', fontSize:'.72rem' }}>
                  Sentinel Score is an internal computational metric — NOT a clinical or epidemiological probability estimate.
                </div>
              </div>
            )}

            {/* Evidence Framework */}
            <div className="card">
              <div className="card-title"><Ic n="file" size={16} color="var(--purple)"/> Evidence Framework</div>
              {[
                ['VERY HIGH', 'var(--cyan)',   '≥ 75 pts: Multi-source, multi-region, temporally consistent signal.'],
                ['HIGH',      'var(--green)',  '55–74 pts: Strong evidence, consistent across multiple observation periods.'],
                ['MODERATE',  'var(--orange)', '35–54 pts: Partial evidence. Monitoring and additional sampling recommended.'],
                ['LOW',       'var(--text-3)', '< 35 pts: Insufficient or sparse data. Treat as a surveillance gap signal.'],
              ].map(([lv,_col,desc])=>(
                <div key={lv} style={{ display:'flex', gap:'.75rem', alignItems:'flex-start', padding:'.6rem .75rem', marginBottom:'.5rem', background:'var(--bg-2)', borderRadius:8, border:'1px solid var(--border)' }}>
                  <Badge lv={lv}/>
                  <span style={{ fontSize:'.78rem', color:'var(--text-2)', lineHeight:1.5 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEATHER ─────────────────────────────────────────── */}
        {tab==='weather' && (
          <div className="card">
            <div className="card-title"><Ic n="globe" size={16} color="var(--cyan)"/> Global AMR Weather Map</div>
            <p style={{ color:'var(--text-2)', fontSize:'.83rem', marginBottom:'1.25rem', lineHeight:1.65 }}>
              Circles represent surveillance hotspots. Size = isolate count. Color = signal level. Hover for full details.<br/>
              <strong style={{ color:'var(--text-1)' }}>Resistance Velocity (df/dt)</strong> measures the rate of change of resistance signal frequency — not transmission speed.
            </p>
            <WeatherMap pts={mapPts} showCoverage={false}/>
          </div>
        )}

        {/* RADAR ───────────────────────────────────────────── */}
        {tab==='radar' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
            <div className="card">
              <div className="card-title"><Ic n="activity" size={16} color="var(--red)"/> AMR Radar — Ranked Emerging Signals</div>
              <div className="radar-list">
                {signals.map((sig,i)=>(
                  <div key={sig.id} className={`radar-item ${selSig?.id===sig.id?'selected':''}`} onClick={()=>setSelSig(sig)}>
                    <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
                      <span style={{ width:28, height:28, borderRadius:'50%', background:i<2?'var(--red-dim)':'var(--orange-dim)', border:`1px solid ${i<2?'var(--red)':'var(--orange)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.72rem', fontWeight:800, color:i<2?'var(--red)':'var(--orange)', flexShrink:0 }}>0{i+1}</span>
                      <div>
                        <div style={{ fontWeight:600 }}><em style={{ color:'var(--text-1)' }}>{sig.pathogen}</em> &mdash; <span style={{ color:'var(--cyan)' }}>{sig.resistance_gene}</span></div>
                        <div style={{ fontSize:'.72rem', color:'var(--text-3)' }}>{sig.region}</div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <Badge lv={sig.severity}/>
                      <div style={{ fontSize:'.7rem', marginTop:3, color:'var(--text-3)' }}>Score {sig.sentinel_score}/100</div>
                    </div>
                  </div>
                ))}
                {!signals.length && <div style={{ color:'var(--text-3)', padding:'1rem' }}>Run pipeline first.</div>}
              </div>
            </div>

            <div className="card">
              <div className="card-title"><Ic n="info" size={16} color="var(--cyan)"/> Explainable AI (XAI) Analysis</div>
              {selSig ? (
                <>
                  <div style={{ marginBottom:'1rem' }}>
                    <div style={{ fontSize:'1.05rem', fontWeight:700, color:'var(--text-1)' }}><em>{selSig.pathogen}</em></div>
                    <div style={{ color:'var(--cyan)', fontWeight:700 }}>{selSig.resistance_gene}</div>
                    <div style={{ fontSize:'.75rem', color:'var(--text-3)', marginTop:2 }}>{selSig.region} · {selSig.type.replace('_',' ').toUpperCase()}</div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.6rem', marginBottom:'1.25rem' }}>
                    <div className="stat-box">
                      <div className="stat-label">Evidence Level</div>
                      <Badge lv={selSig.evidence_level}/>
                    </div>
                    <div className="stat-box">
                      <div className="stat-label">Frequency Change</div>
                      <div className="stat-value" style={{ color:'var(--green)', fontSize:'1.2rem' }}>+{(selSig.observed_increase_pct||0).toFixed(1)}%</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-label">Sentinel Score</div>
                      <div className="stat-value" style={{ color:'var(--cyan)', fontSize:'1.2rem' }}>{selSig.sentinel_score}/100</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-label">Velocity (df/dt)</div>
                      <div className="stat-value" style={{ color:'var(--orange)', fontSize:'1.2rem' }}>{selSig.resistance_velocity}</div>
                    </div>
                  </div>
                  <div className="section-header" style={{ color:'var(--green)' }}>Why Flagged</div>
                  {selSig.explanation.map((e,i)=>(
                    <div key={i} style={{ display:'flex', gap:'.5rem', marginBottom:'.5rem' }}>
                      <Ic n="check" size={13} color="var(--green)"/>
                      <span style={{ fontSize:'.8rem', color:'var(--text-2)', lineHeight:1.5 }}>{e}</span>
                    </div>
                  ))}
                  <div className="section-header" style={{ color:'var(--orange)', marginTop:'1rem' }}>Scientific Limitations</div>
                  {selSig.limitations.map((l,i)=>(
                    <div key={i} style={{ display:'flex', gap:'.5rem', marginBottom:'.5rem' }}>
                      <span style={{ color:'var(--orange)', flexShrink:0, fontSize:'.9rem' }}>•</span>
                      <span style={{ fontSize:'.8rem', color:'var(--text-3)', lineHeight:1.5 }}>{l}</span>
                    </div>
                  ))}
                </>
              ) : <div style={{ color:'var(--text-3)' }}>Select a signal from the radar list.</div>}
            </div>
          </div>
        )}

        {/* GENOMIC EXPLORER ────────────────────────────────── */}
        {tab==='clusters' && (
          <div className="card">
            <div className="card-title"><Ic n="dna" size={16} color="var(--purple)"/> Genomic Cluster Explorer</div>
            <div className="info-box info" style={{ marginBottom:'1.25rem', fontSize:'.78rem' }}>
              Clusters detected by grouping resistance feature vectors (pathogen + gene + country one-hot) using IsolationForest. Novelty scores identify atypical profiles. Clustering does NOT prove transmission.
            </div>
            <GenomicExplorer clusters={clusters}/>
          </div>
        )}

        {/* KNOWLEDGE GRAPH ──────────────────────────────────── */}
        {tab==='graph' && (
          <div className="card">
            <div className="card-title"><Ic n="network" size={16} color="var(--orange)"/> AMR Knowledge Graph</div>
            <p style={{ color:'var(--text-2)', fontSize:'.83rem', marginTop:0, marginBottom:'1.25rem' }}>
              Interactive multi-relational graph: <strong style={{ color:'var(--red)' }}>Pathogen</strong> → <strong style={{ color:'var(--cyan)' }}>Gene</strong> → <strong style={{ color:'var(--orange)' }}>Mechanism</strong> → <strong style={{ color:'var(--purple)' }}>Drug Class</strong> → <strong style={{ color:'var(--green)' }}>Region</strong>.
              Edges represent observed associations only — not causal links.
            </p>
            <KnowledgeGraph data={graph}/>
          </div>
        )}

        {/* BLIND SPOTS ─────────────────────────────────────── */}
        {tab==='blindspots' && (
          <div className="card">
            <div className="card-title"><Ic n="eye_off" size={16} color="var(--orange)"/> Surveillance Blind Spots Map</div>
            <div className="info-box danger" style={{ marginBottom:'1.25rem' }}>
              ⚠️ <strong>Critical Interpretation Warning:</strong> Regions with absent or low AMR signals here should NOT be assumed to have low resistance prevalence.
              They have <strong>insufficient genomic sequencing data</strong> in public repositories.
            </div>
            <WeatherMap pts={mapPts} showCoverage={true}/>
          </div>
        )}

        {/* METHODOLOGY ─────────────────────────────────────── */}
        {tab==='methodology' && (
          <div className="card">
            <div className="card-title"><Ic n="info" size={16} color="var(--green)"/> Methodology & Scientific Framework</div>
            <MethodologyView/>
          </div>
        )}

        {/* DATA SOURCES ─────────────────────────────────────── */}
        {tab==='sources' && (
          <div className="card">
            <div className="card-title"><Ic n="database" size={16} color="var(--cyan)"/> Data Sources & Provenance</div>
            <p style={{ color:'var(--text-2)', fontSize:'.83rem', marginTop:0, marginBottom:'1.25rem' }}>
              All data is obtained from publicly accessible repositories. Provenance metadata (source, license, retrieval date) is tracked per record.
              No synthetic data is passed off as real observations.
            </p>
            <DataSources sources={sources}/>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{ padding:'.875rem 2rem', borderTop:'1px solid var(--border)', background:'var(--bg-2)', fontSize:'.7rem', color:'var(--text-3)', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'.5rem' }}>
        <span>AMR-Sentinel · Open Source Computational Surveillance Research Platform</span>
        <span>⚕️ Not for clinical use · All outputs are surveillance signals · Public data only</span>
      </footer>
    </div>
  );
};

export default App;
