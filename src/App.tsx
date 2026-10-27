import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, AudioLines, Bell, CalendarDays,
  Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3,
  CloudRain, Coffee, Command, Compass, Flame, Focus, Headphones, Leaf,
  ListTodo, Menu, Moon, MoreHorizontal, Music2, Pause, Play, Plus, Search,
  Settings2, Sparkles, Sun, Waves, Wind, X, Zap, CheckCircle2, Circle,
  LayoutDashboard, NotebookPen, SlidersHorizontal, TimerReset, Volume2
} from 'lucide-react'

type Task = { id: number; title: string; time: string; category: string; done: boolean; color: string }
type Sound = { id: string; title: string; subtitle: string; icon: typeof Waves; tone: string; description: string }

const initialTasks: Task[] = [
  { id: 1, title: 'Review the weekly roadmap', time: '09:30 AM', category: 'Work', done: true, color: 'violet' },
  { id: 2, title: 'Build the new landing page', time: '11:00 AM', category: 'Deep work', done: false, color: 'blue' },
  { id: 3, title: 'Take a proper lunch break', time: '01:15 PM', category: 'Personal', done: false, color: 'mint' },
  { id: 4, title: 'Read 10 pages', time: '04:00 PM', category: 'Growth', done: false, color: 'peach' }
]
const sounds: Sound[] = [
  { id: 'rain', title: 'Window rain', subtitle: 'Soft rain on glass', icon: CloudRain, tone: 'rain', description: 'Fine droplets with a gentle, distant wash.' },
  { id: 'ocean', title: 'Ocean tide', subtitle: 'Slow rolling waves', icon: Waves, tone: 'ocean', description: 'Breathing waves that swell and recede.' },
  { id: 'forest', title: 'Forest air', subtitle: 'Wind through trees', icon: Wind, tone: 'forest', description: 'Leafy rustle with scattered bird-like tones.' },
  { id: 'cafe', title: 'Quiet café', subtitle: 'Warm room ambience', icon: Coffee, tone: 'cafe', description: 'A soft room murmur with distant clinks.' },
  { id: 'white', title: 'Soft noise', subtitle: 'Even, steady noise', icon: AudioLines, tone: 'white', description: 'A smooth noise bed for blocking distractions.' },
  { id: 'night', title: 'Night garden', subtitle: 'Calm evening tones', icon: Moon, tone: 'night', description: 'Low drone and delicate, slow bell tones.' }
]
type View = 'Overview' | 'My tasks' | 'Planner' | 'Focus room' | 'Sound studio' | 'Notes'

function readTasks(): Task[] {
  try { const value = localStorage.getItem('dayflow-v2-tasks'); return value ? JSON.parse(value) : initialTasks } catch { return initialTasks }
}

export default function App() {
  const [view, setView] = useState<View>('Overview')
  const [tasks, setTasks] = useState<Task[]>(readTasks)
  const [newTask, setNewTask] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [soundId, setSoundId] = useState('rain')
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(42)
  const [minutes, setMinutes] = useState(25)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [timerOn, setTimerOn] = useState(false)
  const [note, setNote] = useState(() => localStorage.getItem('dayflow-v2-note') || 'A little space to think clearly…')
  const [monthShift, setMonthShift] = useState(0)
  const [mobileNav, setMobileNav] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('dayflow-v2-theme') === 'dark')
  const [toast, setToast] = useState('')
  const audioRef = useRef<{ ctx: AudioContext; nodes: AudioNode[]; gain: GainNode } | null>(null)

  useEffect(() => { localStorage.setItem('dayflow-v2-tasks', JSON.stringify(tasks)) }, [tasks])
  useEffect(() => { localStorage.setItem('dayflow-v2-note', note) }, [note])
  useEffect(() => { localStorage.setItem('dayflow-v2-theme', dark ? 'dark' : 'light') }, [dark])
  useEffect(() => {
    if (!timerOn) return
    const id = window.setInterval(() => setSecondsLeft(s => {
      if (s <= 1) { setTimerOn(false); setToast('Focus session complete — take a breath.'); return 0 }
      return s - 1
    }), 1000)
    return () => window.clearInterval(id)
  }, [timerOn])
  useEffect(() => {
    if (audioRef.current) audioRef.current.gain.gain.setTargetAtTime(playing ? volume / 100 * 0.22 : 0, audioRef.current.ctx.currentTime, 0.12)
  }, [volume, playing])

  const doneCount = tasks.filter(t => t.done).length
  const selectedSound = sounds.find(s => s.id === soundId) || sounds[0]
  const filteredTasks = useMemo(() => tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase())), [tasks, search])
  const date = new Date()
  const displayDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(''), 2600) }
  function toggleTask(id: number) { setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t)) }
  function addTask() {
    if (!newTask.trim()) return
    setTasks(prev => [...prev, { id: Date.now(), title: newTask.trim(), time: 'Anytime', category: 'Personal', done: false, color: 'violet' }])
    setNewTask(''); setShowAdd(false); notify('Task added to your day')
  }
  function startSound(id: string) {
    setSoundId(id)
    try {
      if (!audioRef.current) {
        const ctx = new AudioContext()
        const gain = ctx.createGain(); gain.gain.value = 0
        gain.connect(ctx.destination)
        audioRef.current = { ctx, nodes: [], gain }
      }
      const audio = audioRef.current
      audio.nodes.forEach(n => { try { n.disconnect() } catch {} })
      audio.nodes = []
      const ctx = audio.ctx
      if (ctx.state === 'suspended') void ctx.resume()
      // Each sound has its own synthesis recipe, not the same noise loop with a different label.
      const makeNoise = (type: 'white' | 'pink' | 'brown') => {
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        let last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
        for (let i = 0; i < data.length; i++) {
          const white = Math.random() * 2 - 1
          if (type === 'white') data[i] = white
          else if (type === 'brown') { last = (last + 0.02 * white) / 1.02; data[i] = last * 3.5 }
          else { b0 = .99886*b0 + white*.0555179; b1=.99332*b1+white*.0750759; b2=.969*b2+white*.153852; b3=.8665*b3+white*.3104856; b4=.55*b4+white*.5329522; b5=-.7616*b5-white*.016898; data[i]=(b0+b1+b2+b3+b4+b5+b6+white*.5362)*.11; b6=white*.115926 }
        }
        const source = ctx.createBufferSource(); source.buffer = buffer; source.loop = true
        const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = type === 'brown' ? 420 : type === 'pink' ? 1800 : 5200
        source.connect(filter); filter.connect(audio.gain); source.start()
        audio.nodes.push(source, filter)
      }
      const tone = (freq: number, type: OscillatorType, gainValue: number, detune = 0) => {
        const osc = ctx.createOscillator(), g = ctx.createGain(), filter = ctx.createBiquadFilter()
        osc.type = type; osc.frequency.value = freq; osc.detune.value = detune
        g.gain.value = gainValue; filter.type = 'lowpass'; filter.frequency.value = Math.max(180, freq * 4)
        osc.connect(filter); filter.connect(g); g.connect(audio.gain); osc.start()
        audio.nodes.push(osc, filter, g)
      }
      if (id === 'rain') { makeNoise('pink'); tone(95, 'sine', .12); }
      if (id === 'ocean') { makeNoise('brown'); tone(68, 'sine', .18); tone(0.09, 'sine', .045); }
      if (id === 'forest') { makeNoise('pink'); tone(760, 'sine', .015); tone(1180, 'sine', .008, 7); }
      if (id === 'cafe') { makeNoise('white'); tone(180, 'triangle', .025); tone(310, 'sine', .012, 12); }
      if (id === 'white') { makeNoise('white'); }
      if (id === 'night') { makeNoise('brown'); tone(110, 'sine', .15); tone(164.81, 'sine', .025); tone(220, 'sine', .018); }
      audio.gain.gain.setTargetAtTime(playing ? volume / 100 * .22 : 0, ctx.currentTime, .1)
    } catch { notify('Your browser may need audio permission. Tap play again.') }
  }
  function toggleAudio() {
    if (!playing) { startSound(soundId); setPlaying(true) }
    else setPlaying(false)
  }
  function changeSound(id: string) { setSoundId(id); if (playing) { startSound(id); setPlaying(true) } }
  function exportData() {
    const blob = new Blob([JSON.stringify({ tasks, note }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'dayflow-backup.json'; a.click(); URL.revokeObjectURL(url)
    notify('Your Dayflow backup is ready')
  }
  const navItems: { name: View; icon: typeof LayoutDashboard; sub: string }[] = [
    { name: 'Overview', icon: LayoutDashboard, sub: 'Your day at a glance' },
    { name: 'My tasks', icon: ListTodo, sub: 'Small steps, real progress' },
    { name: 'Planner', icon: CalendarDays, sub: 'Give your time a shape' },
    { name: 'Focus room', icon: Focus, sub: 'One thing at a time' },
    { name: 'Sound studio', icon: Headphones, sub: 'Find your calm' },
    { name: 'Notes', icon: NotebookPen, sub: 'Catch a thought' }
  ]

  return <div className={`app-shell ${dark ? 'dark' : ''}`}>
    <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="ambient ambient-three" />
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><span /><span /><span /></div><span>dayflow<span className="brand-dot">.</span></span><button className="icon-button sidebar-close" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
      <div className="workspace"><div className="workspace-avatar">D</div><div><b>Personal space</b><small>Free workspace</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{navItems.map(item => { const Icon = item.icon; return <button key={item.name} className={`nav-item ${view === item.name ? 'active' : ''}`} onClick={() => { setView(item.name); setMobileNav(false) }}><Icon size={18}/><span>{item.name}</span>{item.name === 'My tasks' && <span className="nav-count">{tasks.filter(t=>!t.done).length}</span>}{view === item.name && <span className="nav-active-dot"/>}</button> })}</nav>
      <div className="sidebar-bottom"><div className="quote-card"><div className="quote-orb"><Sparkles size={19}/></div><p>Make room for what matters.</p><small>A little progress is still progress.</small></div><button className="nav-item" onClick={() => setDark(v => !v)}><Moon size={18}/><span>{dark ? 'Light appearance' : 'Dark appearance'}</span><span className={`toggle ${dark ? 'on' : ''}`} /></button><button className="nav-item" onClick={exportData}><Settings2 size={18}/><span>Export your data</span></button><div className="profile-row"><div className="profile-avatar">AJ</div><div><b>Your space</b><small>Just for you</small></div><MoreHorizontal size={19}/></div></div>
    </aside>
    {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close menu"/>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <b>{view}</b></div></div><div className="topbar-actions"><label className="searchbox"><Search size={16}/><input placeholder="Search your day..." value={search} onChange={e => setSearch(e.target.value)}/><kbd>⌘ K</kbd></label><button className="icon-button notification" onClick={() => notify('You’re all caught up')}><Bell size={18}/><i/></button><div className="top-avatar">AJ</div></div></header>
      <div className="page-content">
        <div className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> {displayDate}</div><h1>{view === 'Overview' ? <>A little more <span className="gradient-text">in flow.</span></> : view}</h1><p className="page-subtitle">{navItems.find(n => n.name === view)?.sub || 'Your personal space for better days.'}</p></div><button className="primary-button" onClick={() => { setShowAdd(true); setView('My tasks') }}><Plus size={17}/> New task</button></div>
        {view === 'Overview' && <div className="overview-layout">
          <section className="main-column">
            <div className="hero-card"><div className="hero-content"><div className="hero-pill"><Sparkles size={13}/> YOUR DAILY RESET</div><h2>Progress over<br/><em>perfection.</em></h2><p>You’ve already shown up today. Let’s make the next step a good one.</p><button className="hero-button" onClick={() => setView('Focus room')}>Start a focus session <ArrowUpRight size={16}/></button></div><div className="hero-art" aria-hidden="true"><div className="art-ring ring-a"/><div className="art-ring ring-b"/><div className="art-planet planet-a"/><div className="art-planet planet-b"/><div className="art-card"><Activity size={20}/><div className="art-chart"><i/><i/><i/><i/><i/><i/><i/><i/></div><small>YOUR MOMENTUM</small><strong>{Math.round(doneCount / Math.max(tasks.length, 1) * 100)}%</strong></div><div className="floating-star star-a">✳</div><div className="floating-star star-b">✦</div></div><div className="hero-grain"/></div>
            <div className="section-heading"><div><h3>Your rhythm</h3><p>A snapshot of how today is shaping up</p></div><button className="text-button" onClick={() => setView('Planner')}>View planner <ArrowUpRight size={15}/></button></div>
            <div className="stats-grid"><div className="stat-card stat-lilac"><div className="stat-top"><span>Tasks completed</span><span className="stat-icon"><CheckCircle2 size={17}/></span></div><div className="stat-number">{doneCount}<small> / {tasks.length}</small></div><div className="mini-progress"><span style={{width: `${tasks.length ? doneCount/tasks.length*100 : 0}%`}}/></div><div className="stat-foot"><span><ArrowUpRight size={13}/> Keep your streak alive</span><span>{Math.round(doneCount/Math.max(tasks.length,1)*100)}%</span></div></div><div className="stat-card stat-peach"><div className="stat-top"><span>Focus minutes</span><span className="stat-icon"><Flame size={17}/></span></div><div className="stat-number">25<small> min</small></div><div className="sparkline"><svg viewBox="0 0 160 32" preserveAspectRatio="none"><path d="M0 24 C12 23 10 6 23 13 S39 28 49 16 S62 5 73 20 S90 29 100 12 S115 5 124 17 S143 27 160 4"/></svg></div><div className="stat-foot"><span>One focused session</span><span>+ today</span></div></div><div className="stat-card stat-mint"><div className="stat-top"><span>Open tasks</span><span className="stat-icon"><Zap size={17}/></span></div><div className="stat-number">{tasks.length-doneCount}<small> left to do</small></div><div className="dot-track"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="stat-foot"><span>One thing at a time</span><span>● On track</span></div></div></div>
            <div className="section-heading task-heading"><div><h3>Today’s plan <span className="soft-count">{tasks.filter(t=>!t.done).length} left</span></h3><p>Small wins add up</p></div><button className="round-plus" onClick={() => setShowAdd(v=>!v)}><Plus size={19}/></button></div>
            {showAdd && <div className="add-task"><input autoFocus value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTask()} placeholder="What would you like to get done?"/><button onClick={addTask}>Add task</button></div>}
            <div className="task-list">{filteredTasks.slice(0,4).map(task => <TaskRow key={task.id} task={task} onToggle={toggleTask}/>)}</div>
            <button className="view-all" onClick={() => setView('My tasks')}>See all tasks <ArrowUpRight size={15}/></button>
          </section>
          <aside className="right-column">
            <div className="calendar-card"><div className="card-heading"><div><h3>Your calendar</h3><p>{new Date(date.getFullYear(), date.getMonth()+monthShift, 1).toLocaleDateString('en-US',{month:'long',year:'numeric'})}</p></div><div className="calendar-arrows"><button onClick={()=>setMonthShift(m=>m-1)}><ChevronLeft size={16}/></button><button onClick={()=>setMonthShift(m=>m+1)}><ChevronRight size={16}/></button></div></div><MiniCalendar shift={monthShift}/><div className="calendar-legend"><span><i className="legend-purple"/> Focus</span><span><i className="legend-blue"/> Tasks</span><span><i className="legend-mint"/> Me time</span></div></div>
            <div className="focus-card"><div className="focus-card-top"><span className="focus-chip"><Focus size={13}/> FOCUS ROOM</span><span className="soft-live">READY</span></div><div className="focus-circle"><div><span>{String(Math.floor(secondsLeft/60)).padStart(2,'0')}:{String(secondsLeft%60).padStart(2,'0')}</span><small>MINDFUL MINUTES</small></div></div><div className="focus-controls"><button className="focus-play" onClick={()=>setTimerOn(v=>!v)}>{timerOn?<Pause size={16}/>:<Play size={16} fill="currentColor"/>}{timerOn?'Pause session':'Start focus'}</button><button className="focus-reset" onClick={()=>{setTimerOn(false);setSecondsLeft(minutes*60)}}><TimerReset size={17}/></button></div><p>Take a breath. Pick one thing.</p></div>
            <div className="quote-mini"><div className="quote-mark">“</div><p>You don’t have to see the whole staircase. Just take the first step.</p><span>— A gentle reminder</span></div>
          </aside>
        </div>}
        {view === 'My tasks' && <div className="content-panel"><div className="panel-toolbar"><div><h2>Tasks that move you forward</h2><p>{doneCount} completed · {tasks.length-doneCount} still in progress</p></div><button className="primary-button" onClick={()=>setShowAdd(v=>!v)}><Plus size={16}/> Add task</button></div>{showAdd&&<div className="add-task"><input autoFocus value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTask()} placeholder="Write a task and press Enter"/><button onClick={addTask}>Add task</button></div>}<div className="task-list full-task-list">{filteredTasks.map(t=><TaskRow key={t.id} task={t} onToggle={toggleTask}/>)}</div>{tasks.length===0&&<EmptyState title="A clear page." body="Add a small task to get your momentum going." onClick={()=>setShowAdd(true)}/>}</div>}
        {view === 'Planner' && <div className="content-panel planner-panel"><div className="panel-toolbar"><div><h2>Make time for your life</h2><p>Flexible plans, not a perfect schedule.</p></div><div className="planner-date">{displayDate}</div></div><div className="week-strip">{['MON','TUE','WED','THU','FRI','SAT','SUN'].map((d,i)=><button key={d} className={i===((date.getDay()+6)%7)?'selected':''}><small>{d}</small><b>{new Date(date.getFullYear(),date.getMonth(),date.getDate()-((date.getDay()+6)%7)+i).getDate()}</b><i/></button>)}</div><div className="timeline">{[['09:00','Slow start','Ease into the day','mint'],['10:30','Deep work','Protect a little quiet time','violet'],['12:30','Reset break','Food, water, fresh air','peach'],['02:00','Make progress','One meaningful next step','blue'],['04:30','Close the loop','Wrap up and reflect','mint']].map((it:any)=><div className="timeline-row" key={it[0]}><span className="timeline-time">{it[0]}</span><div className={`timeline-event ${it[3]}`}><span className="timeline-dot"/><div><b>{it[1]}</b><p>{it[2]}</p></div><MoreHorizontal size={18}/></div></div>)}</div><button className="outline-button" onClick={()=>notify('Planner block added to your local day')}> <Plus size={16}/> Add a time block</button></div>}
        {view === 'Focus room' && <div className="focus-page"><div className="focus-page-glow"/><div className="focus-label"><span className="live-dot"/> YOUR QUIET CORNER</div><h2>One thing.<br/><span className="gradient-text">All your attention.</span></h2><p className="focus-page-sub">You can do less, and do it with care.</p><div className="big-timer"><div className="timer-ring"><svg viewBox="0 0 300 300"><circle cx="150" cy="150" r="132"/><circle className="timer-progress" cx="150" cy="150" r="132" style={{strokeDashoffset: 830-(secondsLeft/(minutes*60||1))*830}}/></svg><div className="timer-center"><span>{String(Math.floor(secondsLeft/60)).padStart(2,'0')}:{String(secondsLeft%60).padStart(2,'0')}</span><small>MINUTES TO YOURSELF</small></div></div></div><div className="timer-presets">{[15,25,45].map(m=><button key={m} className={minutes===m?'chosen':''} onClick={()=>{setMinutes(m);setSecondsLeft(m*60);setTimerOn(false)}}>{m} min</button>)}</div><div className="timer-actions"><button className="primary-button large" onClick={()=>setTimerOn(v=>!v)}>{timerOn?<Pause size={18}/>:<Play size={18} fill="currentColor"/>}{timerOn?'Pause focus':'Begin focus'}</button><button className="icon-button reset-button" onClick={()=>{setTimerOn(false);setSecondsLeft(minutes*60)}}><TimerReset size={19}/></button></div><div className="focus-tip"><Sparkles size={15}/> Tip: silence the noise, not your curiosity.</div></div>}
        {view === 'Sound studio' && <div className="sound-layout"><div className="sound-intro"><div className="eyebrow"><AudioLines size={14}/> AMBIENT SOUND STUDIO</div><h2>Find your own<br/><span className="gradient-text">kind of quiet.</span></h2><p>Six distinct soundscapes, made in your browser. Choose one, adjust the mix, and settle in.</p><div className={`sound-visual ${playing?'is-playing':''} sound-${selectedSound.tone}`}><div className="visual-glow"/><div className="visual-orbit orbit-1"/><div className="visual-orbit orbit-2"/><div className="visual-orbit orbit-3"/><div className="visual-core"><selectedSound.icon size={35}/></div><div className="wave-bars">{Array.from({length:27},(_,i)=><i key={i} style={{'--i':i} as React.CSSProperties}/>)}</div><span className="visual-caption">{playing?'NOW PLAYING':'A MOMENT FOR YOU'}</span></div><div className="now-playing"><div className="sound-thumb"><selectedSound.icon size={20}/></div><div className="now-info"><b>{selectedSound.title}</b><small>{selectedSound.description}</small></div><button className="play-button" onClick={toggleAudio}>{playing?<Pause size={18}/>:<Play size={18} fill="currentColor"/>}</button></div><div className="volume-control"><div><Volume2 size={17}/><span>Volume</span><b>{volume}%</b></div><input type="range" min="0" max="100" value={volume} onChange={e=>setVolume(Number(e.target.value))}/><div className="volume-labels"><span>Soft</span><span>Immersive</span></div></div></div><div className="sound-picker"><div className="section-heading"><div><h3>Choose your atmosphere</h3><p>Each one has its own texture</p></div><span className="sound-count">06 SOUNDS</span></div><div className="sound-grid">{sounds.map((s,i)=>{const Icon=s.icon;return <button key={s.id} className={`sound-option ${soundId===s.id?'selected':''} option-${s.tone}`} onClick={()=>changeSound(s.id)}><div className="sound-option-top"><div className="sound-option-icon"><Icon size={20}/></div>{soundId===s.id&&<span className="selected-check"><Check size={13}/></span>}</div><b>{s.title}</b><small>{s.subtitle}</small><div className={`option-wave ${playing&&soundId===s.id?'wave-active':''}`}>{Array.from({length:18},(_,j)=><i key={j} style={{'--i':j} as React.CSSProperties}/>)}</div></button>})}</div><div className="sound-note"><CircleHelp size={16}/><p>Sound is synthesized locally using the Web Audio API. Tap play to start audio; your browser may require a user gesture first.</p></div><div className="sleep-banner"><div className="sleep-icon"><Moon size={20}/></div><div><b>Wind down without watching the clock</b><p>Set a gentle reminder to end your listening session.</p></div><button onClick={()=>notify('Sleep timer is set for 30 minutes')}>30 min timer <ChevronRight size={15}/></button></div></div></div>}
        {view === 'Notes' && <div className="notes-layout"><div className="notes-paper"><div className="notes-paper-top"><span><NotebookPen size={16}/> QUICK NOTE</span><span>Saved automatically <Check size={13}/></span></div><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Let your thoughts land here…"/><div className="notes-footer"><span>{note.length} characters</span><button className="text-button" onClick={()=>{setNote('');notify('Note cleared')}}>Clear note <X size={14}/></button></div></div><div className="note-side"><div className="note-tip"><Sparkles size={18}/><h3>Capture it before it disappears.</h3><p>Ideas don’t need to be polished. Just get them out of your head and onto the page.</p></div><button className="outline-button" onClick={exportData}>Export tasks & note <ArrowDownRight size={16}/></button></div></div>}
        <footer className="page-footer"><span>✳ dayflow <span className="footer-dot">·</span> a softer way to get things done</span><span>Made for your real life <span className="footer-heart">♥</span></span></footer>
      </div>
    </main>
    {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>
}

function TaskRow({task,onToggle}:{task:Task;onToggle:(id:number)=>void}) {
  return <div className={`task-row ${task.done?'task-done':''}`}><button className={`task-check ${task.done?'checked':''}`} onClick={()=>onToggle(task.id)} aria-label={task.done?'Mark incomplete':'Mark complete'}>{task.done?<Check size={14}/>:<span/>}</button><div className="task-main"><b>{task.title}</b><div className="task-meta"><span className={`task-dot ${task.color}`}/><span>{task.category}</span><span className="meta-divider">·</span><Clock3 size={12}/><span>{task.time}</span></div></div><button className="task-more" aria-label="Task options"><MoreHorizontal size={18}/></button></div>
}
function MiniCalendar({shift}:{shift:number}) {
  const now=new Date(), first=new Date(now.getFullYear(),now.getMonth()+shift,1), year=first.getFullYear(), month=first.getMonth()
  const days=new Date(year,month+1,0).getDate(), offset=(first.getDay()+6)%7
  return <div className="mini-calendar"><div className="calendar-weekdays">{['M','T','W','T','F','S','S'].map((d,i)=><span key={i}>{d}</span>)}</div><div className="calendar-days">{Array.from({length:offset},(_,i)=><span key={'e'+i}/>)}{Array.from({length:days},(_,i)=>{const day=i+1,isToday=shift===0&&day===now.getDate();return <span key={day} className={isToday?'today':''}>{day}{[3,8,15,22].includes(day)&&<i/>}</span>})}</div></div>
}
function EmptyState({title,body,onClick}:{title:string;body:string;onClick:()=>void}) { return <div className="empty-state"><div><Sparkles size={22}/></div><h3>{title}</h3><p>{body}</p><button className="primary-button" onClick={onClick}><Plus size={16}/> Add a task</button></div> }
