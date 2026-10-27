import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check,
  CheckCheck, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock3,
  Command, Headphones, Home, LayoutGrid, ListTodo, Moon, MoreHorizontal,
  Music2, Pause, Play, Plus, Search, Settings2, Sparkles, Sun, Timer,
  Trash2, X, StickyNote, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import "./styles.css";

type Task = {
  id: string; title: string; completed: boolean; priority: "Low" | "Medium" | "High";
  category: string; due: string; time?: string;
};
type Note = { id: string; title: string; body: string; color: string };
type View = "Overview" | "My Tasks" | "Planner" | "Focus" | "Notes" | "Sound Studio" | "Settings";

const initialTasks: Task[] = [
  { id: "1", title: "Finish the Dayflow interface", completed: false, priority: "High", category: "Design", due: "Today", time: "09:30 AM" },
  { id: "2", title: "Review project notes and feedback", completed: false, priority: "Medium", category: "Work", due: "Today", time: "11:00 AM" },
  { id: "3", title: "Plan the week ahead", completed: true, priority: "Low", category: "Personal", due: "Today", time: "01:00 PM" },
  { id: "4", title: "Read 10 pages", completed: false, priority: "Low", category: "Learning", due: "Tomorrow", time: "07:00 PM" },
];
const initialNotes: Note[] = [
  { id: "n1", title: "Ideas to explore", body: "• A calmer morning routine\n• Break big projects into small steps\n• Keep the interface focused", color: "lilac" },
  { id: "n2", title: "This week", body: "Ship the new dashboard, tidy up my workspace, and make time for learning.", color: "mint" },
];
const nav: { label: View; icon: React.ElementType }[] = [
  { label: "Overview", icon: LayoutGrid }, { label: "My Tasks", icon: ListTodo },
  { label: "Planner", icon: CalendarDays }, { label: "Focus", icon: Timer },
  { label: "Notes", icon: StickyNote }, { label: "Sound Studio", icon: Headphones },
];

function getTodayLabel() {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
}

export default function App() {
  const [view, setView] = useState<View>("Overview");
  const [tasks, setTasks] = useState<Task[]>(() => {
    try { return JSON.parse(localStorage.getItem("dayflow-tasks") || "null") || initialTasks; } catch { return initialTasks; }
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    try { return JSON.parse(localStorage.getItem("dayflow-notes") || "null") || initialNotes; } catch { return initialNotes; }
  });
  const [theme, setTheme] = useState<"light" | "dark">(() => (localStorage.getItem("dayflow-theme") as "light" | "dark") || "light");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Open" | "Completed">("All");
  const [modal, setModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("Medium");
  const [newCategory, setNewCategory] = useState("Personal");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [activeSound, setActiveSound] = useState("Rain on glass");
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");

  useEffect(() => { localStorage.setItem("dayflow-tasks", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("dayflow-notes", JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem("dayflow-theme", theme); document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => setSecondsLeft(s => {
      if (s <= 1) { window.clearInterval(timer); setTimerRunning(false); return 0; }
      return s - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning]);
  useEffect(() => {
    if (secondsLeft === 0) { const audio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="); audio.play().catch(() => {}); }
  }, [secondsLeft]);

  const completed = tasks.filter(t => t.completed).length;
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  const filteredTasks = useMemo(() => tasks.filter(t => {
    const matches = `${t.title} ${t.category}`.toLowerCase().includes(query.toLowerCase());
    const status = filter === "All" || (filter === "Open" && !t.completed) || (filter === "Completed" && t.completed);
    return matches && status;
  }), [tasks, query, filter]);

  function addTask(e: React.FormEvent) {
    e.preventDefault(); if (!newTitle.trim()) return;
    setTasks(prev => [{ id: crypto.randomUUID(), title: newTitle.trim(), completed: false, priority: newPriority, category: newCategory, due: "Today", time: "Anytime" }, ...prev]);
    setNewTitle(""); setModal(false);
  }
  function addNote(e: React.FormEvent) {
    e.preventDefault(); if (!noteTitle.trim()) return;
    setNotes(prev => [{ id: crypto.randomUUID(), title: noteTitle.trim(), body: noteBody.trim(), color: ["lilac", "mint", "peach"][prev.length % 3] }, ...prev]);
    setNoteTitle(""); setNoteBody("");
  }
  function setDuration(min: number) { setFocusMinutes(min); setSecondsLeft(min * 60); setTimerRunning(false); }
  const time = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return <div className={`app-shell ${sidebarOpen ? "" : "sidebar-collapsed"}`} data-theme={theme}>
    <aside className="sidebar">
      <div className="brand-row"><div className="brand-mark"><Sparkles size={19}/></div>{sidebarOpen && <div className="brand-copy"><strong>dayflow<span>.</span></strong><small>make room for what matters</small></div>}<button className="icon-btn collapse-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">{sidebarOpen ? <PanelLeftClose size={17}/> : <PanelLeftOpen size={17}/>}</button></div>
      <button className="workspace-switch"><div className="workspace-avatar">D</div>{sidebarOpen && <><span><b>Personal space</b><small>Free workspace</small></span><ChevronDown size={15}/></>}</button>
      <div className="nav-label">{sidebarOpen && "WORKSPACE"}</div>
      <nav className="side-nav">{nav.map(item => { const Icon = item.icon; return <button key={item.label} className={`nav-item ${view === item.label ? "active" : ""}`} onClick={() => setView(item.label)} title={item.label}><Icon size={18}/>{sidebarOpen && <span>{item.label}</span>}{sidebarOpen && item.label === "My Tasks" && <em>{tasks.filter(t => !t.completed).length}</em>}</button>; })}</nav>
      <div className="sidebar-bottom"><div className="quote-card"><div className="quote-spark"><Sparkles size={17}/></div>{sidebarOpen && <><p>Small steps, every day.</p><span>Consistency creates momentum.</span></>}</div><button className={`nav-item ${view === "Settings" ? "active" : ""}`} onClick={() => setView("Settings")}><Settings2 size={18}/>{sidebarOpen && "Settings"}</button><div className="profile-row"><div className="profile-avatar">A</div>{sidebarOpen && <div className="profile-info"><b>My workspace</b><small>Personal account</small></div>}{sidebarOpen && <MoreHorizontal size={18}/>}</div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><b>{view}</b></div><div className="top-actions"><div className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search anything..." /><kbd>⌘ K</kbd></div><button className="icon-btn theme-toggle" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="Toggle theme">{theme === "light" ? <Moon size={18}/> : <Sun size={18}/>}</button><button className="icon-btn notification-btn" aria-label="Notifications"><Bell size={18}/><i/></button><div className="mini-avatar">A</div></div></header>
      <div className="page-content">
        {view === "Overview" && <section className="view-enter">
          <div className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> {getTodayLabel()}</div><h1>A little progress<br/><span>goes a long way.</span></h1><p className="subtitle">Your space to plan thoughtfully and get things done.</p></div><button className="primary-btn" onClick={() => setModal(true)}><Plus size={17}/> New task</button></div>
          <div className="overview-grid">
            <div className="stat-card stat-purple"><div className="stat-top"><span>Tasks completed</span><div className="stat-icon"><CheckCheck size={17}/></div></div><div className="stat-number">{completed}<small> / {tasks.length}</small></div><div className="stat-bottom"><span>{progress}% complete</span><div className="progress-track"><i style={{width: `${progress}%`}}/></div></div><div className="stat-orb orb-one"/></div>
            <div className="stat-card stat-blue"><div className="stat-top"><span>Still in motion</span><div className="stat-icon"><Activity size={17}/></div></div><div className="stat-number">{tasks.length - completed}<small> tasks left</small></div><div className="stat-bottom"><span>One step at a time</span><span className="trend-pill"><ArrowUpRight size={13}/> Keep going</span></div><div className="stat-orb orb-two"/></div>
            <div className="stat-card stat-peach"><div className="stat-top"><span>Focus session</span><div className="stat-icon"><Timer size={17}/></div></div><div className="stat-number">25<small> min</small></div><div className="stat-bottom"><span>Make space for deep work</span><button className="text-link" onClick={() => setView("Focus")}>Start focus <ArrowUpRight size={13}/></button></div><div className="stat-orb orb-three"/></div>
          </div>
          <div className="content-grid">
            <section className="panel tasks-panel"><div className="panel-heading"><div><span className="section-kicker">YOUR DAY</span><h2>Today’s tasks <span className="count-badge">{tasks.filter(t => !t.completed).length}</span></h2></div><button className="subtle-btn" onClick={() => setView("My Tasks")}>View all <ChevronRight size={15}/></button></div><div className="task-list">{tasks.filter(t => t.due === "Today").slice(0, 5).map(task => <TaskRow key={task.id} task={task} onToggle={() => setTasks(p => p.map(t => t.id === task.id ? {...t, completed: !t.completed} : t))}/>)}</div><button className="add-inline" onClick={() => setModal(true)}><Plus size={16}/> Add a task</button></section>
            <section className="panel focus-preview"><div className="panel-heading"><div><span className="section-kicker">SLOW DOWN TO SPEED UP</span><h2>Focus corner</h2></div><div className="round-icon"><Headphones size={17}/></div></div><div className="focus-illustration"><div className="focus-ring ring-a"/><div className="focus-ring ring-b"/><div className="focus-center"><Timer size={27}/></div><span className="floating-star star-a">✦</span><span className="floating-star star-b">✧</span></div><p className="focus-title">A moment for your mind.</p><p className="focus-copy">Set a gentle timer, tune out the noise, and give one thing your attention.</p><button className="focus-start" onClick={() => setView("Focus")}>Open focus timer <ArrowUpRight size={15}/></button></section>
          </div>
          <section className="panel week-panel"><div className="panel-heading"><div><span className="section-kicker">YOUR RHYTHM</span><h2>This week</h2></div><span className="week-caption">A steady pace beats a perfect plan.</span></div><div className="week-bars">{[{d:"Mon",v:52},{d:"Tue",v:78},{d:"Wed",v:63},{d:"Thu",v:91},{d:"Fri",v:45},{d:"Sat",v:32},{d:"Sun",v:20}].map((x,i)=><div className="day-bar" key={x.d}><div className="bar-area"><i style={{height:`${x.v}%`, animationDelay:`${i*80}ms`}}/></div><span>{x.d}</span></div>)}</div></section>
        </section>}

        {view === "My Tasks" && <section className="view-enter"><div className="page-heading"><div><span className="section-kicker">KEEP IT MOVING</span><h1>My tasks<span className="heading-dot">.</span></h1><p className="subtitle">Everything you want to make room for.</p></div><button className="primary-btn" onClick={() => setModal(true)}><Plus size={17}/> New task</button></div><div className="panel all-tasks"><div className="filter-row">{(["All","Open","Completed"] as const).map(f=><button key={f} className={`filter-chip ${filter===f?"selected":""}`} onClick={()=>setFilter(f)}>{f}{f==="All"&&<span>{tasks.length}</span>}{f==="Open"&&<span>{tasks.length-completed}</span>}</button>)}</div>{filteredTasks.length ? <div className="task-list roomy">{filteredTasks.map(t=><div className="task-with-delete" key={t.id}><TaskRow task={t} onToggle={()=>setTasks(p=>p.map(x=>x.id===t.id?{...x,completed:!x.completed}:x))}/><button className="delete-task" onClick={()=>setTasks(p=>p.filter(x=>x.id!==t.id))} aria-label="Delete task"><Trash2 size={15}/></button></div>)}</div> : <EmptyState title="Nothing here just yet" copy="Try another filter or add a new task." onAdd={()=>setModal(true)}/>}</div></section>}

        {view === "Planner" && <section className="view-enter"><div className="page-heading"><div><span className="section-kicker">MAKE A LITTLE SPACE</span><h1>Your planner<span className="heading-dot">.</span></h1><p className="subtitle">A softer way to see what’s coming up.</p></div><button className="primary-btn" onClick={() => setModal(true)}><Plus size={17}/> Add to planner</button></div><div className="planner-layout"><div className="panel calendar-panel"><div className="calendar-top"><div><span className="section-kicker">OCTOBER 2026</span><h2>Keep your week in view</h2></div><div className="calendar-arrows"><button className="icon-btn"><ChevronLeft size={17}/></button><button className="icon-btn"><ChevronRight size={17}/></button></div></div><div className="calendar-grid">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><span className="calendar-day-label" key={d}>{d}</span>)}{Array.from({length:35},(_,i)=>{const day=i-2; return <button key={i} className={`calendar-date ${day===28?"today":""} ${day<1||day>31?"muted":""}`} onClick={()=>{}}>{day<1?30+day:day>31?day-31:day}{[3,8,14,21,28].includes(day)&&<i/>}</button>})}</div></div><div className="panel agenda-panel"><span className="section-kicker">UP NEXT</span><h2>Coming up</h2><div className="agenda-date"><div className="agenda-date-num">28</div><div><b>Wednesday</b><small>Today · October</small></div></div>{tasks.filter(t=>!t.completed).slice(0,4).map(t=><div className="agenda-item" key={t.id}><i className={`agenda-dot ${t.priority.toLowerCase()}`}/><div><b>{t.title}</b><small>{t.time || "Anytime"} · {t.category}</small></div></div>)}<button className="add-inline" onClick={()=>setModal(true)}><Plus size={15}/> Plan something</button></div></div></section>}

        {view === "Focus" && <section className="view-enter focus-view"><div className="page-heading centered"><div><span className="section-kicker">A LITTLE LESS NOISE</span><h1>Find your focus<span className="heading-dot">.</span></h1><p className="subtitle">You don’t have to do everything. Just the next thing.</p></div></div><div className="panel timer-panel"><div className="timer-glow"/><div className="timer-modes">{[15,25,45,60].map(m=><button key={m} onClick={()=>setDuration(m)} className={focusMinutes===m?"chosen":""}>{m} min</button>)}</div><div className="timer-face"><svg viewBox="0 0 240 240" className="timer-svg"><circle cx="120" cy="120" r="103" className="timer-track"/><circle cx="120" cy="120" r="103" className="timer-progress" strokeDasharray={2*Math.PI*103} strokeDashoffset={2*Math.PI*103*(1-secondsLeft/(focusMinutes*60))}/></svg><div className="timer-time"><strong>{time}</strong><span>{timerRunning?"YOU’RE IN THE FLOW":"READY WHEN YOU ARE"}</span></div></div><div className="timer-controls"><button className="primary-btn timer-main" onClick={()=>{if(secondsLeft===0)setSecondsLeft(focusMinutes*60);setTimerRunning(!timerRunning)}}>{timerRunning?<Pause size={18}/>:<Play size={18} fill="currentColor"/>}{timerRunning?"Pause session":"Start focusing"}</button><button className="icon-btn reset-btn" onClick={()=>{setTimerRunning(false);setSecondsLeft(focusMinutes*60)}} aria-label="Reset timer"><Activity size={17}/></button></div><p className="timer-hint"><Sparkles size={14}/> Take a breath. One task is enough.</p></div></section>}

        {view === "Notes" && <section className="view-enter"><div className="page-heading"><div><span className="section-kicker">THOUGHTS, UNFILTERED</span><h1>Your notes<span className="heading-dot">.</span></h1><p className="subtitle">Catch a thought before it slips away.</p></div></div><div className="notes-layout"><form className="panel note-editor" onSubmit={addNote}><span className="section-kicker">QUICK CAPTURE</span><input value={noteTitle} onChange={e=>setNoteTitle(e.target.value)} placeholder="Give this note a title..." required/><textarea value={noteBody} onChange={e=>setNoteBody(e.target.value)} placeholder="Start writing anything on your mind..." rows={5}/><div className="editor-footer"><span><StickyNote size={14}/> Saved in this browser</span><button className="primary-btn small" type="submit"><Plus size={15}/> Save note</button></div></form><div className="notes-list">{notes.map(n=><article className={`note-card ${n.color}`} key={n.id}><div className="note-card-top"><span className="note-pin"><StickyNote size={15}/></span><button className="icon-btn note-delete" onClick={()=>setNotes(p=>p.filter(x=>x.id!==n.id))} aria-label="Delete note"><Trash2 size={14}/></button></div><h3>{n.title}</h3><p>{n.body || "An empty page is still a place to begin."}</p><small>JUST NOW</small></article>)}</div></div></section>}

        {view === "Sound Studio" && <section className="view-enter"><div className="page-heading"><div><span className="section-kicker">SET YOUR OWN ATMOSPHERE</span><h1>Sound studio<span className="heading-dot">.</span></h1><p className="subtitle">Pick a soundscape to make the background feel a little quieter.</p></div></div><div className="sound-hero panel"><div className="sound-art"><div className="sound-wave wave-one"/><div className="sound-wave wave-two"/><div className="sound-wave wave-three"/><div className="sound-disc"><Headphones size={30}/></div><span className="sound-star">✦</span></div><div className="sound-hero-copy"><span className="section-kicker">NOW IN YOUR SPACE</span><h2>{activeSound}</h2><p>A gentle layer of sound for whatever you’re working on.</p><div className="playing-indicator">{soundPlaying?<><span className="equalizer"><i/><i/><i/><i/></span> Playing preview</>:<><span className="pause-dot"/> Paused</>}</div><button className="primary-btn" onClick={()=>setSoundPlaying(!soundPlaying)}>{soundPlaying?<Pause size={17}/>:<Play size={17} fill="currentColor"/>}{soundPlaying?"Pause sound":"Preview sound"}</button><p className="sound-note">Demo controls only — connect audio tracks to enable actual playback.</p></div></div><div className="sound-grid">{[{name:"Rain on glass",desc:"Soft rain, steady and quiet",icon:"☂",tone:"lavender"},{name:"Forest morning",desc:"Birdsong in a green escape",icon:"❋",tone:"mint"},{name:"Ocean hush",desc:"Slow waves on a distant shore",icon:"≈",tone:"blue"},{name:"Café ambience",desc:"Warm hum and gentle chatter",icon:"☕",tone:"peach"},{name:"Night crickets",desc:"A still evening outdoors",icon:"☾",tone:"violet"},{name:"Pink noise",desc:"A smooth, even sound bed",icon:"〰",tone:"rose"}].map(s=><button className={`sound-card ${activeSound===s.name?"active":""}`} key={s.name} onClick={()=>{setActiveSound(s.name);setSoundPlaying(false)}}><div className={`sound-icon ${s.tone}`}>{s.icon}</div><div><b>{s.name}</b><small>{s.desc}</small></div><span className="sound-select">{activeSound===s.name?<Check size={15}/>:<Play size={14}/>}</span></button>)}</div></section>}

        {view === "Settings" && <section className="view-enter"><div className="page-heading"><div><span className="section-kicker">MAKE IT YOURS</span><h1>Settings<span className="heading-dot">.</span></h1><p className="subtitle">A few small tweaks to make Dayflow feel like you.</p></div></div><div className="panel settings-panel"><div className="setting-row"><div className="setting-icon"><Sun size={18}/></div><div className="setting-copy"><b>Appearance</b><small>Choose a light or dark workspace.</small></div><div className="theme-options"><button className={theme==="light"?"selected":""} onClick={()=>setTheme("light")}><Sun size={15}/> Light</button><button className={theme==="dark"?"selected":""} onClick={()=>setTheme("dark")}><Moon size={15}/> Dark</button></div></div><div className="setting-row"><div className="setting-icon"><CheckCheck size={18}/></div><div className="setting-copy"><b>Task progress</b><small>{completed} of {tasks.length} tasks completed.</small></div><div className="setting-progress">{progress}%</div></div><div className="setting-row"><div className="setting-icon"><Command size={18}/></div><div className="setting-copy"><b>Local-first storage</b><small>Your tasks and notes are saved in this browser.</small></div><span className="status-pill">Enabled</span></div><div className="setting-row"><div className="setting-icon"><Trash2 size={18}/></div><div className="setting-copy"><b>Reset demo data</b><small>Restore the sample tasks and notes.</small></div><button className="subtle-btn danger" onClick={()=>{setTasks(initialTasks);setNotes(initialNotes)}}>Reset data</button></div></div></section>}
      </div>
      <footer className="footer"><span>Made for a little more breathing room <span className="footer-heart">✳</span></span><span>DAYFLOW / 2026</span></footer>
    </main>
    {modal && <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}><form className="task-modal" onSubmit={addTask}><div className="modal-head"><div><span className="section-kicker">MAKE IT HAPPEN</span><h2>A new task</h2></div><button type="button" className="icon-btn" onClick={()=>setModal(false)}><X size={18}/></button></div><label>What would you like to do?<input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="e.g. Sketch out the next idea" required/></label><div className="modal-fields"><label>Priority<select value={newPriority} onChange={e=>setNewPriority(e.target.value as Task["priority"])}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Category<select value={newCategory} onChange={e=>setNewCategory(e.target.value)}><option>Personal</option><option>Work</option><option>Design</option><option>Learning</option><option>Health</option></select></label></div><div className="modal-actions"><button type="button" className="subtle-btn" onClick={()=>setModal(false)}>Cancel</button><button type="submit" className="primary-btn"><Plus size={16}/> Create task</button></div></form></div>}
  </div>;
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return <div className={`task-row ${task.completed ? "is-complete" : ""}`}><button className={`task-check ${task.completed ? "checked" : ""}`} onClick={onToggle} aria-label={task.completed ? "Mark incomplete" : "Complete task"}>{task.completed && <Check size={13}/>}</button><div className="task-main"><b>{task.title}</b><div className="task-meta"><span className="category-dot"/>{task.category}<span className="meta-divider">·</span><Clock3 size={12}/>{task.time || "Anytime"}</div></div><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span><span className="task-due">{task.due}</span></div>;
}
function EmptyState({ title, copy, onAdd }: { title: string; copy: string; onAdd: () => void }) {
  return <div className="empty-state"><div className="empty-icon"><CheckCheck size={24}/></div><h3>{title}</h3><p>{copy}</p><button className="subtle-btn" onClick={onAdd}><Plus size={15}/> Add a task</button></div>;
}
