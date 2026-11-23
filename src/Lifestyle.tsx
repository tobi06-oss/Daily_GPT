import {useEffect,useState} from 'react'

export type Goal={id:string;title:string;per_week:number;color_key:string;sort_order:number;created_at:string;updated_at:string;deleted_at:string|null;rev:number}
export type GoalCheck={id:string;goal_id:string;local_date:string;created_at:string;updated_at:string;deleted_at:string|null;rev:number}
export type SleepLog={id:string;kind:'wake'|'sleep';at:string;local_date:string;source:'app'|'shortcut';created_at:string;updated_at:string;deleted_at:string|null;rev:number}
export type Extras={goals:Goal[];goal_checks:GoalCheck[];sleep_logs:SleepLog[];user_settings:{day_start_hour:number}}
type EventLite={id:string;title:string;date:string;start:string;end:string;repeat:string;days:number[];except:string[]}
type TaskLite={done:boolean}
type EntryLite={date:string;line:string;body:string}
type Update=(fn:(state:Extras)=>Extras)=>void
const pad=(n:number)=>String(n).padStart(2,'0')
export const day=(date:Date)=>[date.getFullYear(),pad(date.getMonth()+1),pad(date.getDate())].join('-')
const shift=(s:string,n:number)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return day(d)}
const mondaylessWeek=(s:string)=>{const dt=new Date(s+'T12:00:00');return shift(s,-dt.getDay())}
const weeks=(s:string)=>Array.from({length:7},(_,i)=>shift(mondaylessWeek(s),i))
const dateTime=(d:Date)=>day(d)+'T'+pad(d.getHours())+':'+pad(d.getMinutes())
const ms=(s:string)=>new Date(s).getTime()
const newId=()=>globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)
const nowIso=()=>new Date().toISOString()
export function belongingDate(at:string,hour:number){const d=new Date(at);if(d.getHours()<hour)d.setDate(d.getDate()-1);return day(d)}
export function makeLog(kind:'wake'|'sleep',hour:number,source:'app'|'shortcut'='app'):SleepLog{const time=dateTime(new Date()),stamp=nowIso();return{id:newId(),kind,at:time,local_date:belongingDate(time,hour),source,created_at:stamp,updated_at:stamp,deleted_at:null,rev:1}}
export function goalFromText(raw:string){const m=raw.match(/(?:주\s*(\d)|일주일에\s*(\d)\s*번)\s*(.*)/);if(!m)return null;const n=Number(m[1]||m[2]);if(n<1||n>7)return null;const name=m[3].trim().replace(/^(회|번)\s*/, '').trim();return{title:name||'새 목표',per_week:n}}
function validEvent(e:EventLite,d:string){if(e.except?.includes(d)||d<e.date)return false;if(e.repeat==='daily')return true;if(e.repeat==='weekly')return e.days.includes(new Date(d+'T12:00:00').getDay());if(e.repeat==='monthly')return Number(d.slice(8))===Number(e.date.slice(8));return d===e.date}
const promptList=['오늘 가장 좋았던 순간은?','오늘 나를 웃게 한 일은?','오늘 가장 기억에 남는 대화는?','오늘의 작은 성취는?','오늘 고마웠던 일은?','오늘 나에게 필요한 말은?','오늘 새롭게 알게 된 건?','평소와 달랐던 순간은?','오늘 마음에 오래 남은 장면은?','내일 기대되는 일이 있나요?']
function prompt(d:string){return promptList[Number(d.replaceAll('-',''))%promptList.length]}
function fmtDuration(minutes:number){return Math.floor(minutes/60)+'시간 '+minutes%60+'분'}
function sleepHours(wake:SleepLog,all:SleepLog[]){const prior=all.filter(x=>!x.deleted_at&&x.kind==='sleep'&&ms(x.at)<ms(wake.at)&&ms(wake.at)-ms(x.at)<=24*3600000).sort((a,b)=>ms(b.at)-ms(a.at))[0];return prior?Math.round((ms(wake.at)-ms(prior.at))/60000):null}
function archived(d:string,months:number,years=0){const dt=new Date(d+'T12:00:00'),originalDay=dt.getDate();dt.setDate(1);dt.setMonth(dt.getMonth()+months);dt.setFullYear(dt.getFullYear()+years);const end=new Date(dt.getFullYear(),dt.getMonth()+1,0).getDate();dt.setDate(Math.min(originalDay,end));return day(dt)}
function goalChecked(goalId:string,date:string,x:Extras){return x.goal_checks.some(c=>!c.deleted_at&&c.goal_id===goalId&&c.local_date===date)}
export function toggleGoal(goalId:string,date:string,x:Extras,update:Update){if(date>day(new Date()))return;const prev=x.goal_checks.find(c=>c.goal_id===goalId&&c.local_date===date&&!c.deleted_at);const stamp=nowIso();update(old=>({...old,goal_checks:prev?old.goal_checks.map(c=>c.id===prev.id?{...c,deleted_at:stamp,updated_at:stamp,rev:c.rev+1}:c):[...old.goal_checks,{id:newId(),goal_id:goalId,local_date:date,created_at:stamp,updated_at:stamp,deleted_at:null,rev:1}]}))}
export function LinkedGoal({title,date,ends,data,update}:{title:string;date:string;ends:string;data:Extras;update:Update}){const g=data.goals.filter(x=>!x.deleted_at&&title.includes(x.title)).sort((a,b)=>b.title.length-a.title.length)[0];if(!g||date>day(new Date()))return null;const checked=goalChecked(g.id,date,data);const overdue=date<day(new Date())||(date===day(new Date())&&ends<=pad(new Date().getHours())+':'+pad(new Date().getMinutes()));return <button className={'linked-goal '+(checked?'checked':'')} onClick={()=>toggleGoal(g.id,date,data,update)} title={g.title+' 목표 체크'}>{checked?'✓ '+g.title:overdue?g.title+' 했나요?':g.title+' 체크'}</button>}
export function Highlights({selected,today,events,allEvents,tasks,entries,data,onDay,onJournal}:{selected:string;today:string;events:EventLite[];allEvents:EventLite[];tasks:TaskLite[];entries:EntryLite[];data:Extras;onDay:(x:string)=>void;onJournal:()=>void}){
 const [clock,setClock]=useState(new Date());useEffect(()=>{const id=window.setInterval(()=>setClock(new Date()),60000);return()=>clearInterval(id)},[])
 const h=clock.getHours(),greeting=h<5?'고요한 밤이네요':h<11?'좋은 아침이에요':h<17?'편안한 오후예요':h<21?'오늘도 수고했어요':'하루를 마무리할 시간'
 const todays=selected===today,now=pad(h)+':'+pad(clock.getMinutes())
 const current=events.filter(e=>e.start<=now&&now<e.end).sort((a,b)=>b.start.localeCompare(a.start))[0]
 const upcoming=events.filter(e=>e.start>now).sort((a,b)=>a.start.localeCompare(b.start))[0]
 const nextDay=shift(today,1),tomorrow=allEvents.filter(e=>validEvent(e,nextDay)).sort((a,b)=>a.start.localeCompare(b.start))[0]
 const next=current||upcoming
 const remaining=next?Math.max(0,Math.round((ms((current?selected+'T'+current.end:selected+'T'+next.start))-clock.getTime())/60000)):0
 const progress=tasks.length?Math.round(tasks.filter(t=>t.done).length/tasks.length*100):0
 const moodColor:Record<number,string>={1:'#E3C27A',2:'#C5836B',3:'#869B84',4:'#9AA3A8',5:'#A6998B'}
 const previous=[{name:'일주일 전',date:shift(selected,-7)},{name:'한 달 전',date:archived(selected,-1)},{name:'일 년 전',date:archived(selected,0,-1)}].map(x=>({...x,entry:entries.find(e=>e.date===x.date)})).filter(x=>x.entry)
 const have=new Set(entries.map(e=>e.date));let ref=selected;if(!have.has(ref))ref=shift(ref,-1);let streak=0;while(have.has(ref)){streak++;ref=shift(ref,-1);if(streak>10000)break}
 return <div className="life-top">
 <div className="life-hero"><div><small className="life-kicker">TODAY'S RHYTHM</small><h2>{todays?greeting:'그날의 작은 순간들'}</h2><p>{todays?(current?'지금 '+current.title+' 중':upcoming?'다음 일정 · '+upcoming.title:tomorrow?'내일 첫 일정 · '+tomorrow.title:'다음 일정을 천천히 계획해 봐요'):'일정과 기록을 함께 돌아봐요'}</p></div><div className="life-clock">{todays&&next?<><strong>{Math.floor(remaining/60)>0?Math.floor(remaining/60)+'시간 ':''}{remaining%60}분</strong><small>{current?'끝날 때까지':'시작까지'}</small></>:<span>✳</span>}</div></div>
 <div className="life-week">{weeks(selected).map(d=>{const hasEvents=allEvents.some(e=>validEvent(e,d));const ent=entries.find(e=>e.date===d);const mood=(ent as EntryLite&{mood?:number})?.mood;return <button className={d===selected?'active':''} key={d} onClick={()=>onDay(d)}><small>{'일월화수목금토'[new Date(d+'T12:00:00').getDay()]}</small><b>{Number(d.slice(8))}</b><span className="life-marks">{hasEvents?<i className="event"/>:null}{ent?<i style={{background:mood?moodColor[mood]:'#C5836B'}}/>:null}</span></button>})}</div>
 <div className="life-progress"><div><b>오늘 할 일</b><span>{tasks.filter(t=>t.done).length}/{tasks.length} 완료</span></div><div className="life-track"><i style={{width:progress+'%'}}/></div></div>
 {streak>=2?<div className="life-streak">✿ {streak}일째 이야기를 남기고 있어요</div>:null}
 <div className="life-prompt" onClick={onJournal} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')onJournal()}}><span>✎ 오늘의 질문</span><b>{prompt(selected)}</b><small>한 문장만 남겨도 좋아요 ›</small></div>
 {previous.length?<div className="life-previous"><b>지난 오늘</b>{previous.map(x=><button key={x.name} onClick={()=>onDay(x.date)}><small>{x.name} · {x.date}</small><span>{x.entry?.line}</span><i>›</i></button>)}</div>:null}
 {h>=18&&todays?<div className="life-evening">☾ 오늘의 마무리 · 일정 {events.length} · 할 일 {tasks.filter(t=>t.done).length}/{tasks.length} · {prompt(selected)}</div>:null}
 </div>
}
export function GoalsPanel({selected,data,update}:{selected:string;data:Extras;update:Update}){
 const [adding,setAdding]=useState(false),[title,setTitle]=useState(''),[target,setTarget]=useState(3)
 const goals=data.goals.filter(g=>!g.deleted_at).sort((a,b)=>a.sort_order-b.sort_order)
 const w=weeks(selected),today=day(new Date())
 function add(){if(!title.trim())return;const stamp=nowIso();update(d=>({...d,goals:[...d.goals,{id:newId(),title:title.trim(),per_week:target,color_key:'sage',sort_order:d.goals.length,created_at:stamp,updated_at:stamp,deleted_at:null,rev:1}]}));setTitle('');setAdding(false)}
 return <section className="life-panel"><header><div><span className="life-kicker">WEEKLY GOALS</span><h2>이번 주 작은 목표</h2></div><button onClick={()=>setAdding(v=>!v)}>{adding?'닫기':'+ 목표'}</button></header>
 {adding?<div className="life-add-goal"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="예: 러닝" aria-label="목표 이름"/><label>일주일에 <select value={target} onChange={e=>setTarget(+e.target.value)}>{Array.from({length:7},(_,i)=><option key={i} value={i+1}>{i+1}회</option>)}</select></label><button onClick={add} disabled={!title.trim()}>목표 추가</button></div>:null}
 {!goals.length?<p className="life-muted">주 3회 러닝처럼 나만의 리듬을 만들어 봐요</p>:goals.map(g=>{const count=w.filter(d=>goalChecked(g.id,d,data)).length,left=Math.max(0,g.per_week-count),available=w.filter(d=>d>=today).length;return <div className="life-goal" key={g.id}><div className="life-goal-heading"><b>{g.title}</b><span>{count>=g.per_week?count>g.per_week?'목표보다 '+(count-g.per_week)+'번 더':'이번 주 목표 달성':left+'번 남음 · '+available+'일 남음'}</span></div><div className="life-checkweek">{w.map(d=><button key={d} disabled={d>today} className={goalChecked(g.id,d,data)?'done':''} aria-label={d+' '+g.title+' 체크'} onClick={()=>toggleGoal(g.id,d,data,update)}><small>{'일월화수목금토'[new Date(d+'T12:00:00').getDay()]}</small><strong>{goalChecked(g.id,d,data)?'✓':Number(d.slice(8))}</strong></button>)}</div><div className="life-goal-foot"><div className="life-track"><i style={{width:Math.min(100,count/g.per_week*100)+'%'}}/></div><button onClick={()=>{const stamp=nowIso();update(x=>({...x,goals:x.goals.map(y=>y.id===g.id?{...y,deleted_at:stamp,updated_at:stamp,rev:y.rev+1}:y)}))}}>삭제</button></div></div>})}</section>
}
export function SleepPanel({selected,data,update}:{selected:string;data:Extras;update:Update}){
 const [manual,setManual]=useState<'wake'|'sleep'|null>(null),[time,setTime]=useState(dateTime(new Date()))
 const today=day(new Date()),h=new Date().getHours(),primary:'wake'|'sleep'=h>=4&&h<16?'wake':'sleep'
 const logs=data.sleep_logs.filter(x=>!x.deleted_at).sort((a,b)=>ms(b.at)-ms(a.at))
 const week=weeks(selected)
 const wakes=logs.filter(l=>l.kind==='wake')
 const durations=week.map(d=>{const wake=wakes.find(x=>x.local_date===d);return wake?sleepHours(wake,logs):null})
 const known=durations.filter((v):v is number=>v!==null)
 const avg=known.length?fmtDuration(Math.round(known.reduce((a,b)=>a+b,0)/known.length)):'아직 기록 없음'
 const wakeTimes=wakes.filter(x=>week.includes(x.local_date)).map(x=>{const d=new Date(x.at);return d.getHours()*60+d.getMinutes()})
 const avgWake=wakeTimes.length?pad(Math.floor(wakeTimes.reduce((a,b)=>a+b,0)/wakeTimes.length/60))+':'+pad(Math.round(wakeTimes.reduce((a,b)=>a+b,0)/wakeTimes.length)%60):'—'
 function record(kind:'wake'|'sleep',at?:string){if(at){const stamp=nowIso();update(s=>({...s,sleep_logs:[...s.sleep_logs,{id:newId(),kind,at,local_date:belongingDate(at,s.user_settings.day_start_hour),source:'app',created_at:stamp,updated_at:stamp,deleted_at:null,rev:1}]}))}else update(s=>({...s,sleep_logs:[...s.sleep_logs,makeLog(kind,s.user_settings.day_start_hour)]}));setManual(null)}
 return <section className="life-panel"><header><div><span className="life-kicker">REST & RHYTHM</span><h2>나의 수면 기록</h2></div><span className="life-small">하루 시작 {data.user_settings.day_start_hour}시</span></header>
 <div className="life-sleep-actions"><button className="main" onClick={()=>record(primary)}>{primary==='wake'?'☀ 일어났어요':'☾ 잘게요'} <small>지금 기록</small></button><button onClick={()=>record(primary==='wake'?'sleep':'wake')}>{primary==='wake'?'☾ 잘게요':'☀ 일어났어요'}</button></div>
 <div className="life-sleep-stats"><div><small>지난밤 수면</small><b>{(()=>{const w=wakes[0];const m=w?sleepHours(w,logs):null;return m===null?'—':fmtDuration(m)})()}</b></div><div><small>이번 주 평균</small><b>{avg}</b></div><div><small>평균 기상</small><b>{avgWake}</b></div></div>
 <div className="life-sleep-week">{week.map((d,i)=><div key={d}><small>{'일월화수목금토'[i]}</small><span>{durations[i]===null?'—':(durations[i]!/60).toFixed(1)+'h'}</span></div>)}</div>
 <button className="life-inline" onClick={()=>{setManual('sleep');setTime(dateTime(new Date()))}}>시간 직접 입력</button>
 {manual?<div className="life-manual"><select value={manual} onChange={e=>setManual(e.target.value as 'wake'|'sleep')}><option value="wake">기상</option><option value="sleep">취침</option></select><input type="datetime-local" value={time} onChange={e=>setTime(e.target.value)}/><button disabled={!time} onClick={()=>record(manual,time)}>저장</button></div>:null}
 {logs.slice(0,7).map(l=><div className="life-log" key={l.id}><span>{l.kind==='wake'?'☀ 기상':'☾ 취침'}</span><input aria-label="기록 시간 수정" type="datetime-local" value={l.at} onChange={e=>{const val=e.target.value;if(!val)return;update(s=>({...s,sleep_logs:s.sleep_logs.map(x=>x.id===l.id?{...x,at:val,local_date:belongingDate(val,s.user_settings.day_start_hour),updated_at:nowIso(),rev:x.rev+1}:x)}))}}/><button onClick={()=>update(s=>({...s,sleep_logs:s.sleep_logs.map(x=>x.id===l.id?{...x,deleted_at:nowIso(),rev:x.rev+1}:x)}))} aria-label="수면 기록 삭제">×</button></div>)}
 </section>
}
export function SettingsPanel({data,update,onClose}:{data:Extras;update:Update;onClose:()=>void}){
 const [notice,setNotice]=useState('')
 const base=location.origin+location.pathname
 const routes=[['#wake','기상 기록'],['#sleep','취침 기록'],['#write','한 줄 일기'],['#add','빠른 입력']]
 async function copy(s:string){try{await navigator.clipboard.writeText(s);setNotice('주소를 복사했어요')}catch{setNotice('복사할 수 없어요 · 주소를 길게 눌러 복사해 주세요')}}
 return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="sheet life-settings"><header><h2>나의 설정</h2><button onClick={onClose} aria-label="닫기">×</button></header><label className="life-setting-row">하루 시작 시각 <select value={data.user_settings.day_start_hour} onChange={e=>update(s=>({...s,user_settings:{...s.user_settings,day_start_hour:Number(e.target.value)}}))}>{Array.from({length:7},(_,i)=><option key={i} value={i}>새벽 {i}시</option>)}</select></label><h3>잠금화면 바로가기 주소</h3>{routes.map(([route,label])=><div className="life-setting-route" key={route}><div><b>{label}</b><small>{base+route}</small></div><button onClick={()=>void copy(base+route)}>복사</button></div>)}<p className="life-warning">중요: iPhone 단축어의 URL 열기는 Safari에서 실행될 수 있어요. Safari와 홈 화면 PWA의 기록은 공유되지 않을 수 있으므로 잠금화면에서 남긴 기록이 앱에 자동 반영된다고 보장할 수 없어요</p><div className="life-shortcut-help"><b>아이폰 단축어 만들기</b><p>단축어 앱 → 새 단축어 → URL → 위 주소 붙여넣기 → URL 열기 → 단축어 이름 지정 → 잠금화면에서 단축어 선택</p><p>기상·취침을 잠금화면 한 번의 동작으로 확실히 동기화하려면 인증된 서버 저장 또는 별도 iCloud 기록 후 가져오기 방식이 필요해요</p></div>{notice?<p role="status">{notice}</p>:null}</div></div>
}
export function ShortcutPanel({kind,data,update,onClose}:{kind:'wake'|'sleep';data:Extras;update:Update;onClose:()=>void}){return <div className="overlay"><div className="sheet life-settings"><h2>{kind==='wake'?'☀ 일어났어요':'☾ 잘게요'}</h2><p>지금 시각을 기록할까요?</p><p className="life-warning">단축어로 Safari에서 열었다면 홈 화면 앱과 기록이 분리될 수 있어요</p><div className="life-sleep-actions"><button className="main" onClick={()=>{update(x=>({...x,sleep_logs:[...x.sleep_logs,makeLog(kind,x.user_settings.day_start_hour,'shortcut')]}));onClose()}}>지금 기록하기</button><button onClick={onClose}>취소</button></div></div></div>}
