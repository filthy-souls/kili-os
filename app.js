
const KEY="kili2026data_v2", SYNC_KEY="projectUhuruSyncKey", API="/.netlify/functions/uhuru-data";
const URL_FLAGS=new URLSearchParams(location.search);
const LOCAL_PREVIEW=["localhost","127.0.0.1"].includes(location.hostname) && !URL_FLAGS.has("remoteSync");
let plan=null, data={version:2,settings:{stepGoal:8000,themeMode:"auto"},checks:{},daily:{},workouts:[],scheduleState:{globalShiftDays:0,actions:[]}},dirty=false,syncing=false,timer=null;
const $=id=>document.getElementById(id);
const todayISO=()=>new Date().toLocaleDateString("en-CA");
const fmt=s=>new Date(s+"T12:00:00").toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
function addDate(s,n){const d=new Date(s+"T12:00:00");d.setDate(d.getDate()+n);return d.toLocaleDateString("en-CA")}
function normalize(x){x=x||{};x.settings=Object.assign({stepGoal:8000,themeMode:"auto"},x.settings||{});x.checks=x.checks||{};x.daily=x.daily||{};x.workouts=Array.isArray(x.workouts)?x.workouts:[];x.scheduleState=x.scheduleState||{globalShiftDays:0,actions:[]};x.scheduleState.actions=x.scheduleState.actions||[];return x}
function loadLocal(){try{data=normalize(JSON.parse(localStorage.getItem(KEY))||data)}catch(e){data=normalize(data)}}
function cache(){localStorage.setItem(KEY,JSON.stringify(data))}
function getKey(){return localStorage.getItem(SYNC_KEY)||""}
function setSync(kind,label,detail){const mini=$("syncMini");if(mini)mini.className="sync-mini "+kind;if($("syncMiniText"))$("syncMiniText").textContent=label;const d=$("syncDetail");if(d&&detail!==undefined)d.textContent=detail}
async function remote(method,body){const headers={"Content-Type":"application/json"};if(getKey())headers["x-uhuru-key"]=getKey();const r=await fetch(API,{method:method,headers,body:body?JSON.stringify(body):undefined,cache:"no-store"});let j={};try{j=await r.json()}catch(e){}if(!r.ok)throw new Error(j.error||("HTTP "+r.status));return j}
async function pull(){
  if(syncing||!navigator.onLine)return;
  syncing=true;
  setSync("syncing",LOCAL_PREVIEW?"Loading preview…":"Syncing…",LOCAL_PREVIEW?"Loading repository seed data":"Pulling GitHub state");
  try{
    let state=null;
    if(LOCAL_PREVIEW){
      const cached=localStorage.getItem(KEY);
      if(cached){
        state=JSON.parse(cached);
      }else{
        const r=await fetch("data/state.json?v=4.9",{cache:"no-store"});
        if(!r.ok)throw new Error("Local seed data unavailable");
        state=await r.json();
      }
    }else{
      const r=await remote("GET");
      state=r.state;
    }
    if(state&&!dirty){data=normalize(state);cache();renderAll()}
    setSync("ok",LOCAL_PREVIEW?"Local preview":"Synced",LOCAL_PREVIEW?"Loaded data/state.json from develop":"GitHub is authoritative");
  }catch(e){setSync("error",LOCAL_PREVIEW?"Preview data error":"Sync error",e.message)}
  finally{syncing=false}
}
async function push(force){if(syncing||!navigator.onLine||(!dirty&&!force))return;if(!getKey()){setSync("error","Write key needed","Open More → Safety & app settings → App connection and enter the key once.");return;}syncing=true;setSync("syncing","Syncing…","Saving to GitHub");try{await remote("PUT",{state:data,message:"Uhuru data update "+new Date().toISOString()});dirty=false;cache();setSync("ok","Synced","Latest changes committed to GitHub")}catch(e){setSync("error","Sync error",e.message)}finally{syncing=false}}
function save(){cache();dirty=true;setSync(navigator.onLine?"syncing":"offline",navigator.onLine?"Pending sync…":"Offline — pending","");clearTimeout(timer);timer=setTimeout(()=>push(false),900)}
function weekFor(date){return plan.weeks.find(w=>date>=w.start&&date<=w.end)}
function basePlan(date){const pre=(plan.preWeekend||[]).find(x=>x.date===date);if(pre)return Object.assign({phase:"Re-entry"},pre);const w=weekFor(date);if(!w)return null;const day=new Date(date+"T12:00:00").toLocaleDateString("en-US",{weekday:"long"});const p=w.days[day];return p?Object.assign({phase:w.phase,week:w.week},p):null}
function actions(){return (data.scheduleState.actions||[]).filter(a=>!a.undone)}
function effectivePlan(date){
  const list=[...actions()].reverse();
  for(const a of list){
    if(a.type==="skip"&&a.date===date){
      return {title:"Skipped / Recovery Day",phase:"",items:["No scheduled workout today","Resume normal schedule tomorrow"]};
    }
    if(a.type==="move-skip"&&a.from===date){
      return {title:"Skipped / Recovery Day",phase:"",items:["No scheduled workout today","Easy walking only if comfortable","Do not make up this session later"]};
    }
    if(a.type==="move-skip"&&a.to===date){
      const p=a.plan||basePlan(a.from);
      return p?Object.assign({},p,{rescheduled:true,rescheduledFrom:a.originalFrom||a.from}):null;
    }
  }
  return basePlan(date)
}
function isWeekend(date){const d=new Date(date+"T12:00:00").getDay();return d===0||d===6}
function nextSaturday(date){let d=addDate(date,1);while(new Date(d+"T12:00:00").getDay()!==6)d=addDate(d,1);return d}
function postponeTarget(date,p){const tomorrow=addDate(date,1);return isHikePlan(p)&&!isWeekend(tomorrow)?nextSaturday(date):tomorrow}
function isTraining(p){if(!p)return false;const t=(p.title||"").toLowerCase();return !(t.includes("rest")||t.includes("recovery")||t.includes("easy walk"))}
function isHikePlan(p){if(!p)return false;const t=((p.title||"")+" "+((p.items||[]).join(" "))).toLowerCase();return t.includes("sljeme")||t.includes("long hike")||t.includes("second hike")}
function completion(date){
  const p=effectivePlan(date),st=data.daily[date]||{},checks=st.checks||{},items=(p&&p.items)||[];
  const done=Object.values(checks).filter(Boolean).length,checkScore=items.length?Math.min(1,done/items.length):1;
  const hasWorkout=data.workouts.some(w=>w.date===date);
  const trainingScore=hasWorkout?1:checkScore;
  const goal=Math.max(1000,Number(data.settings.stepGoal)||8000),steps=Number(st.dailySteps)||0,stepScore=Math.min(1,steps/goal);
  return Math.round((trainingScore*.7+stepScore*.3)*100);
}
function renderToday(){const date=todayISO(),p=effectivePlan(date),st=data.daily[date]||{};$("phaseLine").textContent=(p&&p.phase?p.phase:"")+" • "+fmt(date);if(!p){$("todayPlan").innerHTML="<div class='card'><div class='today-title'>No scheduled plan</div></div>";return}let html="<div class='card'><div class='pill'>"+(p.phase||"")+(p.week?" • Week "+p.week:"")+"</div><div class='today-title'>"+p.title+"</div><div id='todayChecks'>";(p.items||[]).forEach((x,i)=>{html+="<label class='check'><input type='checkbox' data-i='"+i+"' "+(st.checks&&st.checks[i]?"checked":"")+"><span>"+x+"</span></label>"});html+="</div></div>";$("todayPlan").innerHTML=html;document.querySelectorAll("#todayChecks input").forEach(el=>el.onchange=e=>{data.daily[date]=data.daily[date]||{};data.daily[date].checks=data.daily[date].checks||{};data.daily[date].checks[e.target.dataset.i]=e.target.checked;save();renderDashboard()});$("officeStairs").checked=!!st.officeStairs}
function renderSteps(){const date=todayISO(),st=data.daily[date]||{},goal=Math.max(1000,Number(data.settings.stepGoal)||8000),v=Number(st.dailySteps)||0,p=Math.min(100,Math.round(v/goal*100));$("dailySteps").value=v||"";$("stepCountLabel").textContent=v.toLocaleString();$("stepGoalLabel").textContent=goal.toLocaleString();$("stepPct").textContent=p+"%";$("stepRing").style.setProperty("--p",p);$("stepGoalSetting").value=goal}
function renderTomorrowPreview(){const p=effectivePlan(addDate(todayISO(),1));$("tomorrowPreview").innerHTML=p?"<b>"+p.title+"</b><p class='muted'>"+(p.items||[]).slice(0,2).join(" • ")+"</p>":"<span class='muted'>No scheduled session</span>"}
function rangeDates(s,e){const out=[];let d=s;while(d<=e){out.push(d);d=addDate(d,1)}return out}
function renderDashboard(){
  const today=todayISO(),todayPct=completion(today);
  $("todayPct").textContent=todayPct+"%";$("todayRing").style.setProperty("--p",todayPct);
  const w=weekFor(today),weekDates=w?rangeDates(w.start,w.end).filter(d=>d<=today):[],weekPct=weekDates.length?Math.round(weekDates.reduce((s,d)=>s+completion(d),0)/weekDates.length):0;
  $("weekPct").textContent=weekPct+"%";$("weekRing").style.setProperty("--p",weekPct);
  const end=today<"2026-12-14"?today:"2026-12-14",all=rangeDates("2026-10-03",end),planPct=all.length?Math.round(all.reduce((s,d)=>s+completion(d),0)/all.length):0;
  $("planPct").textContent=planPct+"%";$("planRing").style.setProperty("--p",planPct);
  const calStart="2026-10-03",calEnd="2026-12-14";
  const monthStarts=["2026-10-01","2026-11-01","2026-12-01"];
  const months=monthStarts.map(ms=>{
    const md=new Date(ms+"T12:00:00"),monthName=md.toLocaleDateString(undefined,{month:"long",year:"numeric"});
    const y=md.getFullYear(),m=md.getMonth(),last=new Date(y,m+1,0).getDate(),pad=(md.getDay()+6)%7;
    const cells=['<div class="cal-head">Mon</div><div class="cal-head">Tue</div><div class="cal-head">Wed</div><div class="cal-head">Thu</div><div class="cal-head">Fri</div><div class="cal-head">Sat</div><div class="cal-head">Sun</div>'];
    for(let i=0;i<pad;i++)cells.push('<div class="cal-blank" aria-hidden="true"></div>');
    for(let day=1;day<=last;day++){
      const d=y+"-"+String(m+1).padStart(2,"0")+"-"+String(day).padStart(2,"0");
      const inPlan=d>=calStart&&d<=calEnd;
      if(!inPlan){cells.push('<div class="cal-outside" aria-hidden="true"><span class="date-num">'+day+'</span></div>');continue}
      const pct=completion(d),hasLog=data.workouts.some(x=>x.date===d);
      let cls="cal-day";if(d>today)cls+=" future";else if(pct===100)cls+=" done";else if(pct>0)cls+=" partial";if(d===today)cls+=" today";
      cells.push('<div class="'+cls+'" data-date="'+d+'" title="'+fmt(d)+' — '+pct+'%"><span class="date-num">'+day+'</span>'+(d<=today?'<span class="pct">'+pct+'%</span>':'')+(hasLog?'<span class="dot"></span>':'')+'</div>');
    }
    return '<section class="calendar-month"><div class="calendar-month-title">'+monthName+'</div><div class="month-grid">'+cells.join("")+'</div></section>';
  });
  $("trainingCalendar").innerHTML=months.join("");
  const hikes=data.workouts.filter(x=>x.type==="Hike"),bestHours=hikes.length?Math.max(...hikes.map(x=>(x.duration||0)/60)):0,bestAscent=hikes.length?Math.max(...hikes.map(x=>x.ascent||0)):0,bestPack=hikes.length?Math.max(...hikes.map(x=>x.pack||0)):0;
  $("benchmarkBars").innerHTML=[["Longest hike",bestHours,6.5,"h"],["Vertical ascent",bestAscent,1200,"m"],["Pack carried",bestPack,6.5,"kg"]].map(([n,v,t,u])=>{const p=Math.min(100,Math.round(v/t*100));return '<div class="bench-row"><div class="bench-head"><span>'+n+'</span><span>'+(v?(u==="h"?v.toFixed(1):v.toFixed(0)):0)+' '+u+' / '+t+' '+u+'</span></div><div class="bar"><span style="width:'+p+'%"></span></div></div>'}).join("");
  const logs=[...data.workouts].sort((x,y)=>y.date.localeCompare(x.date)).slice(0,12);
  $("recentLogs").innerHTML=logs.length?logs.map(x=>'<div class="log-item"><b>'+fmt(x.date)+' • '+x.type+'</b><div class="tiny">'+(x.duration||0)+' min • '+(x.distance||0)+' km • +'+(x.ascent||0)+' m • pack '+(x.pack||0)+' kg • RPE '+(x.rpe||"–")+'</div>'+(x.notes?'<div>'+x.notes+'</div>':'')+'</div>').join(""):'<p class="muted">No logs yet.</p>';
}
function renderPlan(){
  const out=[],cw=weekFor(todayISO());
  (plan.weeks||[]).forEach(w=>{const ds=rangeDates(w.start,w.end).filter(d=>d<=todayISO()),wp=ds.length?Math.round(ds.reduce((s,d)=>s+completion(d),0)/ds.length):0;
    out.push('<details class="day-card plan-week" '+(cw&&cw.week===w.week?'open':'')+'><summary class="day-head"><span><b>Week '+w.week+'</b> • '+w.phase+'</span><span class="plan-progress-chip">'+fmt(w.start)+'–'+fmt(w.end)+(ds.length?' • '+wp+'%':'')+'</span></summary><div class="day-body">');
    Object.entries(w.days).forEach(([day,p])=>out.push('<details class="day-card"><summary class="day-head"><span>'+day+'</span><span>'+p.title+'</span></summary><div class="day-body"><ul>'+p.items.map(x=>'<li>'+x+'</li>').join("")+'</ul></div></details>'));
    out.push("</div></details>");
  });$("planList").innerHTML=out.join("");
}
function renderTodayHikeCheckin(){
  const box=$("todayHikeCheckin");if(!box)return;const d=todayISO(),p=effectivePlan(d);if(!isHikePlan(p)){box.innerHTML="";return;}
  const existing=[...data.workouts].reverse().find(w=>w.date===d&&w.type==="Hike");
  if(existing){box.innerHTML='<div class="card hike-checkin"><div class="hike-title-row"><div><div class="pill">TODAY\'S SLJEME</div><h2>Hike logged</h2></div><div class="hike-badge">SLJEME</div></div><div class="metric-strip"><div class="metric-tile"><b>'+(existing.duration||0)+'</b><span>MINUTES</span></div><div class="metric-tile"><b>'+(existing.ascent||0)+'</b><span>ASCENT M</span></div><div class="metric-tile"><b>'+(existing.rpe||"–")+'</b><span>RPE</span></div></div><p class="muted">'+(existing.distance||0)+' km • pack '+(existing.pack||0)+' kg • avg HR '+(existing.avgHr||"–")+'</p></div>';return;}
  box.innerHTML='<div class="card hike-checkin"><div class="hike-title-row"><div><div class="pill">TODAY\'S SLJEME</div><h2>Log today\'s hike</h2></div><div class="hike-badge">SLJEME</div></div><div class="grid2"><label>Duration (min)<input id="todayHikeDuration" type="number" min="0"></label><label>Distance (km)<input id="todayHikeDistance" type="number" step="0.1" min="0"></label><label>Ascent (m)<input id="todayHikeAscent" type="number" min="0"></label><label>Pack (kg)<input id="todayHikePack" type="number" step="0.1" min="0"></label><label>Avg HR<input id="todayHikeHr" type="number" min="0"></label><label>RPE 1–10<input id="todayHikeRpe" type="number" min="1" max="10"></label><label>Shin pain 0–10<input id="todayHikeShin" type="number" min="0" max="10"></label><label>Other pain 0–10<input id="todayHikePain" type="number" min="0" max="10"></label></div><label>Notes<textarea id="todayHikeNotes" placeholder="Weather, legs, breathing, descents, footwear…"></textarea></label><button id="saveTodayHike">Save Sljeme check-in</button></div>';
  $("saveTodayHike").onclick=()=>{data.workouts.push({id:Date.now(),date:d,type:"Hike",duration:+$("todayHikeDuration").value||0,distance:+$("todayHikeDistance").value||0,ascent:+$("todayHikeAscent").value||0,pack:+$("todayHikePack").value||0,avgHr:+$("todayHikeHr").value||0,rpe:+$("todayHikeRpe").value||0,shin:+$("todayHikeShin").value||0,pain:+$("todayHikePain").value||0,notes:$("todayHikeNotes").value.trim()});save();renderTodayHikeCheckin();renderDashboard();};
}
function loadInputs(){const c=data.checks[todayISO()]||{};["sleep","weight","energy","caloriesBurned","healthSteps","restingHr","soreness","shin","jointPain","notes"].forEach(k=>{if($(k))$(k).value=c[k]??""});renderSteps()}
function renderAll(){renderToday();renderTodayHikeCheckin();renderSteps();renderTomorrowPreview();renderDashboard();renderPlan();loadInputs();renderScheduleState();summaryStatus();applyTheme()}
function saveCheckin(){const d=todayISO();data.checks[d]={sleep:+$("sleep").value||null,weight:+$("weight").value||null,energy:+$("energy").value||null,caloriesBurned:+$("caloriesBurned").value||null,healthSteps:+$("healthSteps").value||null,restingHr:+$("restingHr").value||null,soreness:+$("soreness").value||null,shin:+$("shin").value||null,jointPain:+$("jointPain").value||null,notes:$("notes").value.trim()};save()}
function saveWorkout(){data.workouts.push({id:Date.now(),date:$("logDate").value||todayISO(),type:$("logType").value,duration:+$("duration").value||0,distance:+$("distance").value||0,ascent:+$("ascent").value||0,pack:+$("pack").value||0,avgHr:+$("avgHr").value||0,rpe:+$("rpe").value||0,shin:+$("logShin").value||0,pain:+$("logPain").value||0,notes:$("logNotes").value.trim()});save();renderDashboard()}
function moveToday(){
  const from=todayISO(),current=effectivePlan(from),to=postponeTarget(from,current),targetPlan=effectivePlan(to);
  data.scheduleState.actions.push({
    type:"move-skip",from,to,plan:current?JSON.parse(JSON.stringify(current)):null,
    originalFrom:current?.rescheduledFrom||from,skippedTitle:targetPlan?targetPlan.title:"",
    skippedWasTraining:isTraining(targetPlan),createdAt:new Date().toISOString(),undone:false
  });
  save();renderAll()
}
function skipToday(){
  const d=todayISO(),current=effectivePlan(d);
  data.scheduleState.actions.push({type:"skip",date:d,plan:current?JSON.parse(JSON.stringify(current)):null,createdAt:new Date().toISOString(),undone:false});
  save();renderAll()
}
function undoLast(){const a=[...data.scheduleState.actions].reverse().find(x=>!x.undone);if(a){a.undone=true;save();renderAll()}}
function shiftAll(){
  const d=todayISO(),p=effectivePlan(d),to=postponeTarget(d,p);
  const target=effectivePlan(to);
  data.scheduleState.actions.push({
    type:"move-skip",mode:"shift-all-safe",from:d,to,plan:p?JSON.parse(JSON.stringify(p)):null,
    originalFrom:p?.rescheduledFrom||d,skippedTitle:target?target.title:"",
    skippedWasTraining:isTraining(target),createdAt:new Date().toISOString(),undone:false
  });
  save();renderAll()
}
function renderScheduleState(){
  const d=todayISO(),p=effectivePlan(d),target=postponeTarget(d,p),active=[...actions()].reverse()[0];
  if($("moveSkipBtn"))$("moveSkipBtn").textContent=isHikePlan(p)&&target!==addDate(d,1)?"Postpone Sljeme → "+fmt(target):"Move today → tomorrow & skip tomorrow";
  if($("shiftAllBtn"))$("shiftAllBtn").textContent=isHikePlan(p)?"Shift safely → "+fmt(target):"Shift today +1 day";
  if($("scheduleWarning"))$("scheduleWarning").innerHTML=isHikePlan(p)&&target!==addDate(d,1)?"<p class='muted'>Weekday hiking is locked out. A postponed Sljeme session moves to the next Saturday.</p>":"";
  if($("rescheduleStatus"))$("rescheduleStatus").textContent=active?(active.undone?"":(active.type==="skip"?"Today is skipped.":active.from&&active.to?"Last change: "+fmt(active.from)+" → "+fmt(active.to):"")):"";
  if($("undoPostponeBtn"))$("undoPostponeBtn").classList.toggle("hidden",!active)
}
function generateSummary(days,label){const end=todayISO(),start=addDate(end,-days+1),ws=data.workouts.filter(w=>w.date>=start&&w.date<=end),steps=rangeDates(start,end).map(d=>Number(data.daily[d]?.dailySteps)||0),avgSteps=steps.length?Math.round(steps.reduce((a,b)=>a+b,0)/steps.length):0;$("summaryText").value="KILI TRAINING UPDATE — "+label+"\nPeriod: "+start+" to "+end+"\n\nTRAINING\n- Sessions logged: "+ws.length+"\n- Total time: "+(ws.reduce((a,w)=>a+(w.duration||0),0)/60).toFixed(1)+" h\n- Vertical ascent: "+ws.reduce((a,w)=>a+(w.ascent||0),0)+" m\n\nMOVEMENT\n- Average steps: "+avgSteps+"\n- Step goal: "+(data.settings.stepGoal||8000)+"\n\nPlease assess whether I should progress, hold, or reduce load and tell me what to change next."}
function summaryStatus(){$("summaryDue").textContent=new Date().getDay()===0?"Sunday check-in due today.":"Generate a 3-day summary every ~3 days; Sunday is the full weekly check-in."}
function exportData(){const b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="uhuru-"+todayISO()+".json";a.click()}
function importData(file){const r=new FileReader();r.onload=()=>{try{data=normalize(JSON.parse(r.result));save();renderAll()}catch(e){alert("Invalid file")}};r.readAsText(file)}
function applyTheme(){const mode=data.settings.themeMode||"auto",h=new Date().getHours(),actual=mode==="auto"?(h>=6&&h<18?"light":"dark"):mode;document.body.classList.toggle("light-theme",actual==="light");if($("themeMode"))$("themeMode").value=mode}
function initDevPreview(){
  const bar=$("devPreviewBar");if(!bar||window.innerWidth<=620)return;
  bar.classList.remove("hidden");
  const apply=mode=>{
    const phone=mode==="phone";
    document.body.classList.toggle("dev-phone-preview",phone);
    $("previewPhone")?.classList.toggle("active",phone);
    $("previewDesktop")?.classList.toggle("active",!phone);
    localStorage.setItem("uhuruDevViewport",phone?"phone":"desktop");
  };
  $("previewPhone").onclick=()=>apply("phone");
  $("previewDesktop").onclick=()=>apply("desktop");
  apply(localStorage.getItem("uhuruDevViewport")==="phone"?"phone":"desktop");
}
function initTabs(){document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tabs button,.tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.tab).classList.add("active")})}
window.addEventListener("load",async()=>{plan=await fetch("plan.json?v=4.9",{cache:"no-store"}).then(r=>r.json());const hadLocal=!!localStorage.getItem(KEY);loadLocal();if(LOCAL_PREVIEW&&!hadLocal){try{const seed=await fetch("data/state.json?v=4.9",{cache:"no-store"}).then(r=>r.json());data=normalize(seed);cache()}catch(e){}}initTabs();initDevPreview();$("logDate").value=todayISO();renderAll();$("dailySteps").oninput=e=>{const d=todayISO();data.daily[d]=data.daily[d]||{};data.daily[d].dailySteps=Math.max(0,+e.target.value||0);save();renderSteps();renderDashboard()};$("officeStairs").onchange=e=>{const d=todayISO();data.daily[d]=data.daily[d]||{};data.daily[d].officeStairs=e.target.checked;save()};$("saveCheckin").onclick=saveCheckin;$("saveWorkout").onclick=saveWorkout;$("moveSkipBtn").onclick=moveToday;$("skipTodayBtn").onclick=skipToday;$("undoPostponeBtn").onclick=undoLast;$("shiftAllBtn").onclick=shiftAll;$("gen3").onclick=()=>generateSummary(3,"3-DAY CHECK-IN");$("genWeek").onclick=()=>generateSummary(7,"SUNDAY / 7-DAY CHECK-IN");$("copySummary").onclick=()=>navigator.clipboard.writeText($("summaryText").value);$("shareSummary").onclick=async()=>{if(navigator.share)await navigator.share({title:"Kili training update",text:$("summaryText").value});else navigator.clipboard.writeText($("summaryText").value)};$("exportData").onclick=exportData;$("importData").onchange=e=>e.target.files[0]&&importData(e.target.files[0]);$("saveGoals").onclick=()=>{data.settings.stepGoal=Math.max(1000,+$("stepGoalSetting").value||8000);save();renderAll()};$("themeMode").onchange=e=>{data.settings.themeMode=e.target.value;save();applyTheme()};if($("saveSyncKey"))$("saveSyncKey").onclick=()=>{const v=$("syncKey").value.trim();if(v)localStorage.setItem(SYNC_KEY,v);$("syncKey").value="";dirty?push(true):pull()};if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js?v=4.9").then(r=>r.update()).catch(()=>{});pull();setInterval(()=>{if(!dirty)pull()},15*60*1000)});
window.addEventListener("online",()=>dirty?push(true):pull());window.addEventListener("offline",()=>setSync("offline","Offline","Changes cached locally"));
