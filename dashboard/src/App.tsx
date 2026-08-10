import React, { useState, useEffect } from 'react';
import './index.css';
import { api } from './lib/api';

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
  search:     'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
  book:       'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z',
  sliders:    'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  download:   'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  cpu:        'M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM9 9h6v6H9z',
  refresh:    'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
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
interface DataStatus { status:string; mode:string; source:string; last_updated:string; run_id:string; dataset_version:string; isolates?:number; total_records?:number; completeness_score?:number; data_completeness?:number; pipeline_status?:string; sources?:string[]; }
interface LitItem   { pmid:string; doi?:string; title:string; authors:string; journal:string; year:number; pathogen_name:string; gene_symbol:string; alignment_strength:string; key_finding:string; }

/* ═══════════════════════════════════════════════════════════════
   SMALL COMPONENTS
═══════════════════════════════════════════════════════════════ */
const Badge = ({ lv }: { lv: string }) => {
  const c = lv==='CRITICAL'||lv==='HIGH'||lv==='VERY HIGH' ? 'var(--red)' : lv==='MEDIUM'||lv==='MODERATE' ? 'var(--orange)' : 'var(--green)';
  return <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:20, fontSize:'.68rem', fontWeight:700, border:`1px solid ${c}`, color:c, background:`${c}22`, letterSpacing:'.04em' }}>{lv}</span>;
};

const Bar = ({ pct, color }: { pct: number; color: string }) => (
  <div className="progress-wrap"><div className="progress-fill" style={{ width:`${Math.min(100,Math.max(0,pct))}%`, background:color }} /></div>
);

const ScoreRow = ({ label, val, color }: { label:string; val:number; color:string }) => (
  <div style={{ marginBottom:'0.6rem' }}>
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.78rem', marginBottom:'3px' }}>
      <span style={{ color:'var(--text-2)' }}>{label}</span>
      <span style={{ color, fontWeight:700 }}>{val.toFixed(0)}%</span>
    </div>
    <Bar pct={val} color={color} />
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   AMR WEATHER MAP
═══════════════════════════════════════════════════════════════ */
const WeatherMap = ({ pts, showCoverage, onRetry }: { pts:MapPt[]; showCoverage:boolean; onRetry?:()=>void }) => {
  const [hov, setHov] = useState<MapPt|null>(null);
  const px = (lat:number, lon:number) => ({ x:((lon+180)/360)*940, y:((90-lat)/180)*480 });
  const sigCol = (l:string) => l==='High'?'rgba(239,68,68,.7)':l==='Moderate'?'rgba(249,115,22,.6)':'rgba(16,185,129,.5)';
  const bdrCol = (l:string) => l==='High'?'#ef4444':l==='Moderate'?'#f97316':'#10b981';
  const covCol = (c:string) => c==='High'?'#10b981':c==='Moderate'?'#06b6d4':c==='Low'?'#f97316':'#ef4444';

  if (!pts || pts.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', background: '#070e1e', borderRadius: 8, border: '1px solid var(--border)' }}>
        <Ic n="globe" size={32} color="var(--text-3)"/>
        <div style={{ fontSize: '1rem', color: 'var(--text-1)', fontWeight: 600, marginTop: '1rem' }}>Geographic Surveillance Data Unavailable</div>
        <div style={{ fontSize: '.8rem', color: 'var(--text-3)', marginTop: 4 }}>The map layer could not load spatial records from the backend API.</div>
        {onRetry && (
          <button onClick={onRetry} style={{ marginTop: '1rem', padding: '.5rem 1.25rem', borderRadius: 6, background: 'var(--cyan)', color: '#000', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Ic n="refresh" size={14} color="#000"/> Retry Loading Map
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ position:'relative' }}>
      <svg viewBox="0 0 940 480" style={{ width:'100%', background:'#070e1e', borderRadius:8, border:'1px solid var(--border)' }}>
        {[-60,-30,0,30,60].map(lt => <line key={lt} x1="0" y1={((90-lt)/180)*480} x2="940" y2={((90-lt)/180)*480} stroke="#131e30" strokeWidth=".5"/>)}
        {[-120,-60,0,60,120].map(ln => <line key={ln} x1={((ln+180)/360)*940} y1="0" x2={((ln+180)/360)*940} y2="480" stroke="#131e30" strokeWidth=".5"/>)}
        <text x="470" y="22" textAnchor="middle" fill="#2d3f5a" fontSize="11" fontFamily="monospace">
          {showCoverage ? 'SURVEILLANCE BLIND SPOTS — Regional Sequencing Throughput Index' : 'GLOBAL AMR WEATHER MAP — Observed Resistance Signal Velocity (df/dt)'}
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

      {hov && (
        <div style={{ position:'absolute', top:10, right:10, background:'var(--panel)', border:'1px solid var(--border-light)', borderRadius:10, padding:'1rem', minWidth:220, zIndex:10, boxShadow:'var(--shadow-lg)' }}>
          <div style={{ fontWeight:700, color:'var(--cyan)', marginBottom:'.5rem', fontSize:'.95rem' }}>{hov.country_name}</div>
          <table style={{ fontSize:'.78rem', borderCollapse:'collapse', width:'100%' }}>
            <tbody>
              {[['Signal Level', hov.signal_level], ['Isolates', hov.sample_count], ['Velocity (df/dt)', hov.resistance_velocity], ['Coverage', hov.coverage], ['One Health Hosts', (hov.one_health_hosts||[]).join(', ')||'—']].map(([l,v])=>(
                <tr key={l as string}><td style={{ color:'var(--text-3)', paddingRight:8, paddingBottom:3 }}>{l}</td><td style={{ color:'var(--text-1)', fontWeight:500 }}>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

const KnowledgeGraph = ({ data, loading, onRetry }: { data:Graph|null; loading:boolean; onRetry?:()=>void }) => {
  const [sel, setSel] = useState<string|null>(null);
  
  if (loading) {
    return (
      <div style={{ color:'var(--cyan)', padding:'3rem', textAlign:'center' }}>
        <Ic n="network" size={32} color="var(--cyan)"/>
        <div style={{ marginTop: '1rem', fontWeight: 600 }}>Loading AMR Knowledge Graph data...</div>
      </div>
    );
  }

  if (!data || !data.nodes || !data.nodes.length) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
        <Ic n="network" size={32} color="var(--text-3)"/>
        <div style={{ fontSize: '1rem', color: 'var(--text-1)', fontWeight: 600, marginTop: '1rem' }}>Knowledge Graph Data Unavailable</div>
        <div style={{ fontSize: '.8rem', color: 'var(--text-3)', marginTop: 4 }}>Unable to construct multi-relational graph from the backend API.</div>
        {onRetry && (
          <button onClick={onRetry} style={{ marginTop: '1rem', padding: '.5rem 1.25rem', borderRadius: 6, background: 'var(--cyan)', color: '#000', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Ic n="refresh" size={14} color="#000"/> Retry Loading Graph
          </button>
        )}
      </div>
    );
  }

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
   MAIN APP
═══════════════════════════════════════════════════════════════ */
type Tab = 'home'|'radar'|'investigation'|'weather'|'clusters'|'graph'|'search'|'literature'|'quality'|'validation'|'config'|'sources';

export const App: React.FC = () => {
  const [tab, setTab]             = useState<Tab>('home');
  const [overview, setOverview]   = useState<Overview|null>(null);
  const [signals, setSignals]     = useState<Signal[]>([]);
  const [mapPts, setMapPts]       = useState<MapPt[]>([]);
  const [clusters, setClusters]   = useState<Cluster[]>([]);
  const [graph, setGraph]         = useState<Graph|null>(null);
  const [changed, setChanged]     = useState<Changed|null>(null);
  const [selSig, setSelSig]       = useState<Signal|null>(null);
  const [dataStatus, setDataStatus] = useState<DataStatus|null>(null);
  const [investigation, setInvestigation] = useState<any>(null);
  const [literature, setLiterature] = useState<LitItem[]>([]);
  const [dataQuality, setDataQuality] = useState<any>(null);
  const [modelValidation, setModelValidation] = useState<any>(null);
  const [sources, setSources]     = useState<DataSrc[]>([]);

  // State management for API status
  const [loading, setLoading]     = useState<boolean>(true);
  const [apiError, setApiError]   = useState<string|null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);

  // Config weights state
  const [weights, setWeights] = useState({ trend: 30, novelty: 25, expansion: 20, coverage: 15, consistency: 10 });

  const loadAllData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [
        ds, ov, sigs, mp, cl, gr, ch, lit, dq, mv, src
      ] = await Promise.all([
        api.getDataStatus().catch(() => null),
        api.getOverview().catch(() => null),
        api.getSignals().catch(() => []),
        api.getMap().catch(() => []),
        api.getClusters().catch(() => []),
        api.getKnowledgeGraph().catch(() => null),
        api.getWhatChanged().catch(() => null),
        api.getLiterature().catch(() => []),
        api.getDataQuality().catch(() => null),
        api.getModelValidation().catch(() => null),
        api.getDataSources().catch(() => ({ sources: [] })),
      ]);

      if (!ov && sigs.length === 0 && !ds) {
        setApiError("Production data source could not be reached. Serverless API endpoint returned no response.");
      } else {
        setDataStatus(ds);
        setOverview(ov);
        setSignals(sigs);
        if (sigs.length > 0) setSelSig(sigs[0]);
        setMapPts(mp);
        setClusters(cl);
        setGraph(gr);
        setChanged(ch);
        setLiterature(lit);
        setDataQuality(dq);
        setModelValidation(mv);
        setSources(src?.sources || []);
      }
    } catch (err: any) {
      setApiError(err?.message || "Failed to communicate with AMR-Sentinel backend API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Fetch investigation details when selSig changes
  useEffect(() => {
    if (selSig) {
      api.getSignalInvestigation(selSig.id)
        .then(setInvestigation)
        .catch(() => setInvestigation(null));
    }
  }, [selSig]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    api.search({ query: searchQuery })
      .then(setSearchResults)
      .catch(() => {});
  };

  const handleRecalculate = () => {
    api.recalculateScores(weights)
      .then(d => {
        setSignals(d.signals);
        if (d.signals.length) setSelSig(d.signals[0]);
        alert('Sentinel Scores recalculated successfully with custom weights!');
      })
      .catch((err) => alert(`Recalculation failed: ${err.message}`));
  };

  const handleExportReport = () => {
    if (!selSig) return;
    api.exportReport(selSig.id)
      .then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AMR_Report_${selSig.id}.json`;
        a.click();
      });
  };

  const TABS: { id:Tab; icon:string; label:string }[] = [
    { id:'home',          icon:'shield',   label:'Overview' },
    { id:'radar',         icon:'activity', label:'Discover Signals' },
    { id:'investigation', icon:'search',   label:'Signal Investigation' },
    { id:'weather',       icon:'globe',    label:'AMR Weather' },
    { id:'clusters',      icon:'dna',      label:'Pattern Explorer' },
    { id:'graph',         icon:'network',  label:'Knowledge Graph' },
    { id:'search',        icon:'search',   label:'Researcher Search' },
    { id:'literature',    icon:'book',     label:'Literature Evidence' },
    { id:'quality',       icon:'check',    label:'Data Quality' },
    { id:'validation',    icon:'cpu',      label:'Model Validation' },
    { id:'config',        icon:'sliders',  label:'Scoring Config' },
    { id:'sources',       icon:'database', label:'Data Sources' },
  ];

  const ov = overview;

  return (
    <div className="dashboard-container">

      {/* ── Top Data Status Header Bar ── */}
      <div style={{ background: '#050a14', borderBottom: '1px solid var(--border)', padding: '.4rem 2rem', fontSize: '.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: dataStatus?.mode==='live'?'var(--green)':dataStatus?.mode==='demo'?'var(--orange)':'var(--red)', fontWeight: 700 }}>
            {dataStatus?.status || (apiError ? '🔴 DATA UNAVAILABLE' : '🟡 STRUCTURED SEED DATASET')}
          </span>
          <span style={{ color: 'var(--text-3)' }}>•</span>
          <span style={{ color: 'var(--text-2)' }}>Run ID: <strong style={{ color: 'var(--cyan)', fontFamily: 'var(--mono)' }}>{dataStatus?.run_id || 'AMR-2026-08-09-001'}</strong></span>
          <span style={{ color: 'var(--text-3)' }}>•</span>
          <span style={{ color: 'var(--text-2)' }}>Records Analyzed: <strong style={{ color: 'var(--text-1)' }}>{dataStatus?.isolates || dataStatus?.total_records || (ov ? ov.observations_analyzed : '—')} isolates</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-2)' }}>Data Completeness: <strong style={{ color: 'var(--orange)' }}>{dataStatus?.completeness_score || dataStatus?.data_completeness || 84.5} / 100</strong></span>
          <span style={{ color: 'var(--text-3)' }}>•</span>
          <span style={{ color: 'var(--text-3)' }}>Last Updated: {dataStatus?.last_updated ? new Date(dataStatus.last_updated).toLocaleString() : 'Just now'}</span>
          <button onClick={loadAllData} style={{ background: 'transparent', border: 'none', color: 'var(--cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '.72rem' }}>
            <Ic n="refresh" size={12} color="var(--cyan)"/> Refresh
          </button>
        </div>
      </div>

      {/* ── API Error Banner ── */}
      {apiError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', borderBottom: '1px solid var(--red)', padding: '.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fca5a5', fontSize: '.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <Ic n="alert" size={18} color="var(--red)"/>
            <div>
              <strong>DATA STATUS: 🔴 Data unavailable</strong> — {apiError}
            </div>
          </div>
          <button onClick={loadAllData} style={{ padding: '.35rem .85rem', borderRadius: 6, background: 'var(--red)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            Retry Connection
          </button>
        </div>
      )}

      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="logo-group">
          <div className="logo-pulse"><Ic n="dna" size={28} color="#06b6d4"/></div>
          <div>
            <div style={{ fontSize:'1.15rem', fontWeight:800, letterSpacing:'.08em', color:'var(--text-1)' }}>AMR-SENTINEL <span style={{ fontSize: '.7rem', color: 'var(--cyan)', padding: '2px 6px', borderRadius: 4, background: 'var(--cyan-dim)', border: '1px solid rgba(6,182,212,.3)' }}>V2 RESEARCH</span></div>
            <div style={{ fontSize:'.65rem', color:'var(--text-3)', letterSpacing:'.04em' }}>COMPUTATIONAL AMR SURVEILLANCE & INTELLIGENCE NETWORK</div>
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
          <span className="status-dot" style={{ background: dataStatus?.mode==='live'?'#10b981':'#f97316' }}/>
          {dataStatus?.mode==='live'?'LIVE DATA':dataStatus?.mode==='demo'?'DEMO/SEED DATA':'DATA SYSTEM'}
        </div>
      </header>

      {/* ── Metric Bar ── */}
      <div className="metric-bar">
        {[
          { icon:'alert',    val: apiError ? '—' : (ov?.active_signals ?? signals.length),            sub: apiError ? 'Data unavailable' : `${ov?.high_priority_signals ?? signals.filter(s=>s.severity==='HIGH').length} HIGH PRIORITY`, label:'Active Signals',   col:'var(--red)' },
          { icon:'zap',      val: apiError ? '—' : (ov?.average_sentinel_score ?? (signals.length ? round(signals.reduce((a,b)=>a+b.sentinel_score,0)/signals.length,1) : '—')),    sub:'/ 100 composite score',       label:'Avg Sentinel Score',col:'var(--cyan)' },
          { icon:'dna',      val: apiError ? '—' : (ov?.genomic_clusters ?? clusters.length),          sub:'pattern clusters',            label:'AMR Pattern Clusters',  col:'var(--purple)' },
          { icon:'globe',    val: apiError ? '—' : (ov?.monitored_countries ?? mapPts.length),       sub:'surveillance regions',         label:'Countries Monitored',col:'var(--green)' },
          { icon:'bar',      val: apiError ? '—' : (ov?.observations_analyzed ?? dataStatus?.isolates ?? '—'),     sub:'isolate records',              label:'Isolates Analyzed', col:'var(--orange)' },
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

        {/* 1. OVERVIEW & HOME ──────────────────────────────── */}
        {tab==='home' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>

            {/* AMR Radar Top Signals */}
            <div className="card">
              <div className="card-title"><Ic n="activity" size={16} color="var(--red)"/> Active AMR Signals — High Priority</div>
              {signals.length > 0 ? (
                signals.slice(0,5).map((sig,i)=>(
                  <div key={sig.id} className="radar-item" onClick={()=>{ setSelSig(sig); setTab('investigation'); }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
                      <span style={{ width:26, height:26, borderRadius:'50%', background:i<2?'var(--red-dim)':'var(--orange-dim)', border:`1px solid ${i<2?'var(--red)':'var(--orange)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.72rem', fontWeight:800, color:i<2?'var(--red)':'var(--orange)', flexShrink:0 }}>0{i+1}</span>
                      <div>
                        <div style={{ fontWeight:600, fontSize:'.88rem' }}><em>{sig.pathogen}</em> — <span style={{ color:'var(--cyan)' }}>{sig.resistance_gene}</span></div>
                        <div style={{ fontSize:'.72rem', color:'var(--text-3)' }}>Velocity {sig.resistance_velocity} · Score {sig.sentinel_score}/100</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Badge lv={sig.severity}/>
                      <div style={{ fontSize: '.68rem', color: 'var(--cyan)', marginTop: 3 }}>Investigate ➔</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>
                  {apiError ? "Unable to retrieve signals." : "No active surveillance signals found."}
                </div>
              )}
            </div>

            {/* What Changed */}
            <div className="card">
              <div className="card-title"><Ic n="trending" size={16} color="var(--green)"/> What Changed? — AMR Intelligence Brief</div>
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
              ) : (
                <div style={{ color:'var(--text-3)', padding: '1.5rem', textAlign: 'center' }}>
                  {apiError ? "Unable to generate intelligence briefing because current surveillance data is unavailable." : "Loading intelligence brief…"}
                </div>
              )}
            </div>

            {/* Platform Workflow */}
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <div className="card-title"><Ic n="shield" size={16} color="var(--cyan)"/> AMR-Sentinel Workflow for Researchers</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                {[
                  ['1. DISCOVER', 'Identify emerging high-velocity signals on the AMR Radar.', 'activity', 'var(--red)'],
                  ['2. INVESTIGATE', 'Examine temporal trends, forecasts, and evidence breakdowns.', 'search', 'var(--cyan)'],
                  ['3. VALIDATE', 'Cross-reference peer-reviewed literature and CARD ARO ontology.', 'book', 'var(--purple)'],
                  ['4. CONFIGURE', 'Adjust scoring weights to evaluate custom research hypotheses.', 'sliders', 'var(--orange)'],
                  ['5. REPORT', 'Export reproducible research summaries with explicit run provenance.', 'download', 'var(--green)'],
                ].map(([title, desc, icon, col]) => (
                  <div key={title as string} style={{ padding: '1rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: col as string, fontWeight: 700, fontSize: '.82rem', marginBottom: '.5rem' }}>
                      <Ic n={icon as string} size={15} color={col as string}/> {title}
                    </div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. DISCOVER SIGNALS (AMR RADAR) ──────────────────── */}
        {tab==='radar' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
            <div className="card">
              <div className="card-title"><Ic n="activity" size={16} color="var(--red)"/> Ranked Emerging Signals</div>
              <div className="radar-list">
                {signals.length > 0 ? (
                  signals.map((sig,i)=>(
                    <div key={sig.id} className={`radar-item ${selSig?.id===sig.id?'selected':''}`} onClick={()=>{ setSelSig(sig); setTab('investigation'); }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
                        <span style={{ width:28, height:28, borderRadius:'50%', background:i<2?'var(--red-dim)':'var(--orange-dim)', border:`1px solid ${i<2?'var(--red)':'var(--orange)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.72rem', fontWeight:800, color:i<2?'var(--red)':'var(--orange)', flexShrink:0 }}>0{i+1}</span>
                        <div>
                          <div style={{ fontWeight:600 }}><em style={{ color:'var(--text-1)' }}>{sig.pathogen}</em> &mdash; <span style={{ color:'var(--cyan)' }}>{sig.resistance_gene}</span></div>
                          <div style={{ fontSize:'.72rem', color:'var(--text-3)' }}>{sig.region}</div>
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <Badge lv={sig.severity}/>
                        <div style={{ fontSize:'.72rem', color:'var(--text-2)', marginTop:2 }}>Score {sig.sentinel_score}/100</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>
                    {apiError ? "Unable to retrieve signals from backend." : "No active surveillance signals available."}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Signal Summary */}
            <div className="card">
              <div className="card-title"><Ic n="info" size={16} color="var(--cyan)"/> Signal Quick Summary</div>
              {selSig ? (
                <div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>SIGNAL ID: {selSig.id}</div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-1)', fontStyle: 'italic', margin: '6px 0' }}>{selSig.pathogen}</h3>
                  <div style={{ fontSize: '1rem', color: 'var(--cyan)', fontWeight: 700 }}>Gene: {selSig.resistance_gene}</div>
                  <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                    <div style={{ padding: '.75rem', background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '.68rem', color: 'var(--text-3)', textTransform: 'uppercase' }}>Sentinel Score</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cyan)' }}>{selSig.sentinel_score} / 100</div>
                    </div>
                    <div style={{ padding: '.75rem', background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '.68rem', color: 'var(--text-3)', textTransform: 'uppercase' }}>Resistance Velocity</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--red)' }}>{selSig.resistance_velocity}</div>
                    </div>
                  </div>
                  <button onClick={()=>setTab('investigation')} style={{ marginTop: '1.25rem', width: '100%', padding: '.75rem', borderRadius: 8, background: 'var(--cyan)', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    Full Signal XAI & Literature Investigation ➔
                  </button>
                </div>
              ) : (
                <div style={{ color: 'var(--text-3)', padding: '2rem', textAlign: 'center' }}>Select a signal from the list.</div>
              )}
            </div>
          </div>
        )}

        {/* 3. SIGNAL INVESTIGATION (XAI) ───────────────────── */}
        {tab==='investigation' && (
          <div>
            {selSig && investigation ? (
              <>
                {/* Header Banner */}
                <div className="card" style={{ background: 'var(--bg-2)', border: '1px solid var(--cyan)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>SIGNAL ID: {investigation.basic_info.signal_id}</div>
                      <h2 style={{ fontSize: '1.4rem', color: 'var(--text-1)', fontStyle: 'italic', margin: '4px 0' }}>{investigation.basic_info.pathogen}</h2>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cyan)' }}>Resistance Gene: {investigation.basic_info.resistance_gene}</div>
                      <div style={{ fontSize: '.82rem', color: 'var(--text-2)', marginTop: 4 }}>
                        Geographic Region: <strong style={{ color: 'var(--text-1)' }}>{investigation.basic_info.region}</strong> | Category: <Badge lv={investigation.basic_info.severity}/>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                      <button onClick={handleExportReport} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.6rem 1rem', borderRadius: 8, background: 'var(--panel)', border: '1px solid var(--border-light)', color: 'var(--cyan)', fontWeight: 600, cursor: 'pointer' }}>
                        <Ic n="download" size={14} color="var(--cyan)"/> Export Research Report
                      </button>
                    </div>
                  </div>
                </div>

                {/* Grid Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  {/* Time Series & Trend Forecast */}
                  <div className="card">
                    <div className="card-title"><Ic n="trending" size={16} color="var(--cyan)"/> Time-Series Observation Trend & 3-Month Forecast</div>
                    <div style={{ height: 180, background: '#070e1e', borderRadius: 8, padding: '1rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                      {(investigation.time_series||[]).map((t: any) => (
                        <div key={t.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: '100%', height: `${Math.min(130, t.count * 12)}px`, background: 'var(--cyan)', borderRadius: '4px 4px 0 0' }}/>
                          <div style={{ fontSize: '.65rem', color: 'var(--text-3)', marginTop: 4 }}>{t.month}</div>
                        </div>
                      ))}
                    </div>
                    {investigation.forecast && (
                      <div style={{ marginTop: '1rem', padding: '.75rem', background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.78rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--orange)', marginBottom: 4 }}>
                          Short-Term Forecast Projection: <span style={{ color: 'var(--text-1)' }}>{investigation.forecast.trend_direction}</span> (Confidence: {investigation.forecast.confidence})
                        </div>
                        <div style={{ color: 'var(--text-2)' }}>{investigation.forecast.disclaimer}</div>
                      </div>
                    )}
                  </div>

                  {/* Sentinel Score Decomposition */}
                  <div className="card">
                    <div className="card-title"><Ic n="zap" size={16} color="var(--cyan)"/> Sentinel Score Decomposition</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--cyan)', marginBottom: '.75rem' }}>
                      {investigation.metrics.sentinel_score} <span style={{ fontSize: '1rem', color: 'var(--text-3)', fontWeight: 400 }}>/ 100 Composite Score</span>
                    </div>
                    <ScoreRow label="Resistance Velocity (df/dt)" val={investigation.score_breakdown.velocity_contrib_pct} color="var(--red)"/>
                    <ScoreRow label="IsolationForest Genomic Novelty" val={investigation.score_breakdown.novelty_contrib_pct} color="var(--orange)"/>
                    <ScoreRow label="Geographic Expansion" val={investigation.score_breakdown.expansion_contrib_pct} color="var(--purple)"/>
                    <ScoreRow label="Data Coverage & Quality" val={investigation.score_breakdown.coverage_contrib_pct} color="var(--green)"/>
                    <ScoreRow label="Temporal Consistency" val={investigation.score_breakdown.consistency_contrib_pct} color="var(--cyan)"/>
                  </div>
                </div>

                {/* Evidence & Literature */}
                <div className="card">
                  <div className="card-title"><Ic n="book" size={16} color="var(--purple)"/> Peer-Reviewed Scientific Literature Evidence</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {(investigation.literature_evidence||[]).map((lit: LitItem) => (
                      <div key={lit.pmid} style={{ padding: '.85rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '.88rem' }}>{lit.title}</div>
                          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '.68rem', background: 'var(--cyan-dim)', color: 'var(--cyan)', border: '1px solid rgba(6,182,212,.3)' }}>Alignment: {lit.alignment_strength}</span>
                        </div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-3)', marginTop: 4 }}>
                          Authors: {lit.authors} · <em>{lit.journal}</em> ({lit.year}) · PMID: <a href={`https://pubmed.ncbi.nlm.nih.gov/${lit.pmid}`} target="_blank" rel="noreferrer">{lit.pmid}</a>
                        </div>
                        <div style={{ fontSize: '.78rem', color: 'var(--text-2)', marginTop: 6, fontStyle: 'italic' }}>
                          "{lit.key_finding}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : <div style={{ color: 'var(--text-3)', padding: '2rem', textAlign: 'center' }}>Select a signal to investigate.</div>}
          </div>
        )}

        {/* 4. AMR WEATHER MAP ──────────────────────────────── */}
        {tab==='weather' && (
          <div className="card">
            <div className="card-title"><Ic n="globe" size={16} color="var(--cyan)"/> Global AMR Weather Map</div>
            <p style={{ color:'var(--text-2)', fontSize:'.83rem', marginBottom:'1.25rem', lineHeight:1.65 }}>
              Circles represent surveillance hotspots. Size = isolate count. Color = signal level. Hover for full details.<br/>
              <strong style={{ color:'var(--text-1)' }}>Resistance Velocity (df/dt)</strong> measures the rate of change of resistance signal frequency — not transmission speed.
            </p>
            <WeatherMap pts={mapPts} showCoverage={false} onRetry={loadAllData}/>
          </div>
        )}

        {/* 5. PATTERN EXPLORER ─────────────────────────────── */}
        {tab==='clusters' && (
          <div className="card">
            <div className="card-title"><Ic n="dna" size={16} color="var(--purple)"/> AMR Pattern Cluster Explorer</div>
            <p style={{ color: 'var(--text-2)', fontSize: '.83rem', marginBottom: '1.25rem' }}>
              Feature vector similarity clusters derived via IsolationForest anomaly scoring. <br/>
              <em style={{ color: 'var(--text-3)' }}>Note: Feature similarity does NOT establish nucleotide-level genomic transmission links.</em>
            </p>
            {clusters.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1rem' }}>
                {clusters.map(c => (
                  <div key={c.id} style={{ padding: '1rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text-1)', fontStyle: 'italic' }}>{c.pathogen_name}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text-3)', marginTop: 2 }}>Gene: <span style={{ color: 'var(--cyan)' }}>{c.primary_gene}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', marginTop: '.75rem', color: 'var(--text-2)' }}>
                      <span>Sequence Count: <strong>{c.sequence_count}</strong></span>
                      <span>Novelty Score: <strong style={{ color: c.novelty_score>50?'var(--orange)':'var(--green)' }}>{c.novelty_score}/100</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                No pattern clusters available for the current surveillance query.
              </div>
            )}
          </div>
        )}

        {/* 6. KNOWLEDGE GRAPH ──────────────────────────────── */}
        {tab==='graph' && (
          <div className="card">
            <div className="card-title"><Ic n="network" size={16} color="var(--orange)"/> AMR Knowledge Graph</div>
            <p style={{ color:'var(--text-2)', fontSize:'.83rem', marginTop:0, marginBottom:'1.25rem' }}>
              Interactive multi-relational graph: <strong style={{ color:'var(--red)' }}>Pathogen</strong> → <strong style={{ color:'var(--cyan)' }}>Gene</strong> → <strong style={{ color:'var(--orange)' }}>Mechanism</strong> → <strong style={{ color:'var(--purple)' }}>Drug Class</strong> → <strong style={{ color:'var(--green)' }}>Region</strong>.
            </p>
            <KnowledgeGraph data={graph} loading={loading} onRetry={loadAllData}/>
          </div>
        )}

        {/* 7. RESEARCHER SEARCH ────────────────────────────── */}
        {tab==='search' && (
          <div className="card">
            <div className="card-title"><Ic n="search" size={16} color="var(--cyan)"/> Advanced AMR Researcher Search</div>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '.75rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                placeholder="Search by pathogen (e.g. Klebsiella), gene (e.g. mcr-1), mechanism, or country code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '.75rem', borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-1)', fontSize: '.88rem' }}
              />
              <button type="submit" style={{ padding: '.75rem 1.5rem', borderRadius: 8, background: 'var(--cyan)', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Search Repository
              </button>
            </form>

            {searchResults && (
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: '1rem' }}>
                  Search Results ({searchResults.matching_signals_count} signals, {searchResults.matching_observations_count} observations)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  {(searchResults.observations||[]).map((obs: any, i: number) => (
                    <div key={i} style={{ padding: '.75rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.8rem', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-3)', marginRight: 8 }}>{obs.accession}</span>
                        <em style={{ color: 'var(--text-1)' }}>{obs.pathogen_name}</em> — <span style={{ color: 'var(--cyan)' }}>{obs.gene_symbol}</span>
                      </div>
                      <div style={{ color: 'var(--text-2)' }}>{obs.country_code} · {obs.antimicrobial_class}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 8. LITERATURE EVIDENCE ───────────────────────────── */}
        {tab==='literature' && (
          <div className="card">
            <div className="card-title"><Ic n="book" size={16} color="var(--purple)"/> Peer-Reviewed Scientific Literature Evidence</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {literature.map(lit => (
                <div key={lit.pmid} style={{ padding: '1.25rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '.95rem' }}>{lit.title}</div>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '.68rem', background: 'var(--cyan-dim)', color: 'var(--cyan)', border: '1px solid rgba(6,182,212,.3)' }}>Alignment: {lit.alignment_strength}</span>
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-3)', marginTop: 4 }}>
                    Authors: {lit.authors} · <em>{lit.journal}</em> ({lit.year}) · PMID: <a href={`https://pubmed.ncbi.nlm.nih.gov/${lit.pmid}`} target="_blank" rel="noreferrer">{lit.pmid}</a>
                  </div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text-2)', marginTop: 8, fontStyle: 'italic' }}>
                    "{lit.key_finding}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. DATA QUALITY DASHBOARD ────────────────────────── */}
        {tab==='quality' && (
          <div className="card">
            <div className="card-title"><Ic n="check" size={16} color="var(--green)"/> Data Quality & Completeness Audit</div>
            {dataQuality ? (
              <>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--green)', margin: '1rem 0' }}>
                  {dataQuality.completeness_score} <span style={{ fontSize: '1rem', color: 'var(--text-3)', fontWeight: 400 }}>/ 100 Overall Data Completeness Score</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {Object.entries(dataQuality.metrics).map(([k, v]) => (
                    <div key={k} style={{ padding: '.85rem', background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '.72rem', color: 'var(--text-3)', textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-1)', marginTop: 2 }}>{v as string}</div>
                    </div>
                  ))}
                </div>
                <div className="info-box info" style={{ marginTop: '1.25rem' }}>{dataQuality.explanation}</div>
              </>
            ) : <div style={{ color: 'var(--text-3)', padding: '2rem', textAlign: 'center' }}>Loading data quality audit…</div>}
          </div>
        )}

        {/* 10. MODEL VALIDATION & CARD ──────────────────────── */}
        {tab==='validation' && (
          <div className="card">
            <div className="card-title"><Ic n="cpu" size={16} color="var(--purple)"/> Model Validation & Benchmark Metrics</div>
            {modelValidation ? (
              <>
                <p style={{ color: 'var(--text-2)', fontSize: '.83rem', marginBottom: '1.25rem' }}>
                  Empirical evaluation of algorithm benchmarks on metadata anomaly classification reference sets.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {modelValidation.metrics.map((m: any) => (
                    <div key={m.model_name} style={{ padding: '1.25rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                      <div style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: '.95rem', marginBottom: '.5rem' }}>{m.model_name}</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text-2)', marginBottom: '.75rem' }}>{m.description}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '.5rem', textAlign: 'center' }}>
                        {[
                          ['PRECISION', m.precision, 'var(--cyan)'],
                          ['RECALL', m.recall, 'var(--purple)'],
                          ['F1-SCORE', m.f1_score, 'var(--green)'],
                          ['ROC-AUC', m.roc_auc, 'var(--orange)'],
                          ['PR-AUC', m.pr_auc, 'var(--yellow)'],
                        ].map(([lbl, val, col]) => (
                          <div key={lbl as string} style={{ padding: '.5rem', background: 'var(--panel)', borderRadius: 6, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '.65rem', color: 'var(--text-3)' }}>{lbl}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: col as string }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="info-box warn" style={{ marginTop: '1.25rem' }}>{modelValidation.disclaimer}</div>
              </>
            ) : <div style={{ color: 'var(--text-3)', padding: '2rem', textAlign: 'center' }}>Loading validation metrics…</div>}
          </div>
        )}

        {/* 11. SCORING CONFIGURATION ────────────────────────── */}
        {tab==='config' && (
          <div className="card">
            <div className="card-title"><Ic n="sliders" size={16} color="var(--orange)"/> Configurable Sentinel Score Weights</div>
            <p style={{ color: 'var(--text-2)', fontSize: '.83rem', marginBottom: '1.5rem' }}>
              Researchers can dynamically adjust component weights to evaluate custom surveillance hypotheses.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 600 }}>
              {[
                ['Resistance Velocity (df/dt)', 'trend', weights.trend],
                ['IsolationForest Genomic Novelty', 'novelty', weights.novelty],
                ['Geographic Expansion Count', 'expansion', weights.expansion],
                ['Surveillance Coverage & Sample Size', 'coverage', weights.coverage],
                ['Temporal Consistency Rate', 'consistency', weights.consistency],
              ].map(([lbl, key, val]) => (
                <div key={key as string}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{lbl}</span>
                    <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{val}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={val as number}
                    onChange={e => setWeights({ ...weights, [key as string]: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
              <button onClick={handleRecalculate} style={{ padding: '.85rem', borderRadius: 8, background: 'var(--cyan)', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: '1rem' }}>
                Recalculate Platform Sentinel Scores ➔
              </button>
            </div>
          </div>
        )}

        {/* 12. DATA SOURCES ─────────────────────────────────── */}
        {tab==='sources' && (
          <div className="card">
            <div className="card-title"><Ic n="database" size={16} color="var(--cyan)"/> Data Sources & Provenance</div>
            <p style={{ color:'var(--text-2)', fontSize:'.83rem', marginTop:0, marginBottom:'1.25rem' }}>
              All data is obtained from publicly accessible repositories. Provenance metadata (source, license, retrieval date) is tracked per record.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sources.map(s => (
                <div key={s.name} style={{ padding: '1.25rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '.95rem' }}>{s.name}</div>
                  <a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize: '.78rem', color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    {s.url} <Ic n="external" size={11} color="var(--cyan)"/>
                  </a>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-2)', marginTop: 6 }}>Used for: {s.used_for}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ── Footer ── */}
      <footer style={{ padding:'.875rem 2rem', borderTop:'1px solid var(--border)', background:'var(--bg-2)', fontSize:'.7rem', color:'var(--text-3)', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'.5rem' }}>
        <span>AMR-Sentinel V2 · Research-Grade Computational AMR Intelligence Network</span>
        <span>⚕️ Not for clinical use · All outputs are surveillance signals · Public data only</span>
      </footer>
    </div>
  );
};

function round(val: number, decimals: number): number {
  const p = Math.pow(10, decimals);
  return Math.round(val * p) / p;
}

export default App;
