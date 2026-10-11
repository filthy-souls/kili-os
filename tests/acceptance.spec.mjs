import { test, expect } from '@playwright/test';

const STATE_KEY='kili2026data_v2';
const SYNC_KEY='projectUhuruSyncKey';
const FIXED_DATE='2026-10-11T12:00:00+02:00';

async function installClock(page,{clear=true}={}) {
  await page.addInitScript(({fixed,clear}) => {
    const RealDate=Date;
    class FakeDate extends RealDate {
      constructor(...args){ super(...(args.length?args:[fixed])); }
      static now(){ return new RealDate(fixed).getTime(); }
    }
    window.Date=FakeDate;
    if(clear)localStorage.clear();
  },{fixed:FIXED_DATE,clear});
}

async function boot(page,{clear=true,remoteSync=false}={}) {
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await installClock(page,{clear});
  await page.goto(remoteSync?'/?remoteSync=1':'/',{waitUntil:'networkidle'});
  await expect(page.locator('#phaseLine')).toContainText('Sun, Oct 11');
  return errors;
}

async function openMoreSection(page,label){
  await page.getByRole('button',{name:'More'}).click();
  const section=page.locator('details.more-section').filter({hasText:label});
  if(!(await section.getAttribute('open'))) await section.locator(':scope > summary').click();
  return section;
}

async function state(page){
  return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),STATE_KEY);
}

test('Today renders moved Sljeme and dedicated hike check-in', async ({page}) => {
  const errors=await boot(page);
  await expect(page.locator('#todayPlan')).toContainText('Long Hike / Sljeme');
  await expect(page.locator('#todayHikeCheckin')).toContainText("Log today's hike");
  await expect(page.locator('#saveTodayHike')).toBeVisible();
  await expect(page.locator('#tomorrowPreview')).toContainText('Rest + easy walking');
  expect(errors).toEqual([]);
});

test('Today checklist changes completion and calendar, and unticking reverses it', async ({page}) => {
  const errors=await boot(page);
  const first=page.locator('#todayChecks input').first();
  await first.check();
  await page.getByRole('button',{name:'Progress'}).click();
  expect(parseInt(await page.locator('#todayPct').innerText())).toBeGreaterThan(0);
  await expect(page.locator('.cal-day[data-date="2026-10-11"]')).toHaveClass(/partial/);
  await page.getByRole('button',{name:'Today'}).click();
  await first.uncheck();
  await page.getByRole('button',{name:'Progress'}).click();
  await expect(page.locator('#todayPct')).toHaveText('0%');
  expect(errors).toEqual([]);
});

test('Today checklist persists through reload in local preview', async ({page}) => {
  const errors=await boot(page,{clear:false});
  await page.locator('#todayChecks input').nth(1).check();
  await page.reload({waitUntil:'networkidle'});
  await expect(page.locator('#todayChecks input').nth(1)).toBeChecked();
  expect(errors).toEqual([]);
});

test('Postpone moves Sunday Sljeme to next Saturday and undo restores it', async ({page}) => {
  const errors=await boot(page);
  await expect(page.locator('#moveSkipBtn')).toContainText('Postpone Sljeme');
  await page.locator('#moveSkipBtn').click();
  await expect(page.locator('#todayPlan')).toContainText('Skipped / Recovery Day');
  const s=await state(page);
  const last=s.scheduleState.actions.at(-1);
  expect(last.from).toBe('2026-10-11');
  expect(last.to).toBe('2026-10-17');
  expect(last.plan.title).toContain('Long Hike / Sljeme');
  await expect(page.locator('#undoPostponeBtn')).toBeVisible();
  await page.locator('#undoPostponeBtn').click();
  await expect(page.locator('#todayPlan')).toContainText('Long Hike / Sljeme');
  expect(errors).toEqual([]);
});

test('Skip today replaces the session and undo restores it', async ({page}) => {
  const errors=await boot(page);
  await page.locator('#skipTodayBtn').click();
  await expect(page.locator('#todayPlan')).toContainText('Skipped / Recovery Day');
  await expect(page.locator('#rescheduleStatus')).toContainText('Today is skipped');
  await page.locator('#undoPostponeBtn').click();
  await expect(page.locator('#todayPlan')).toContainText('Long Hike / Sljeme');
  expect(errors).toEqual([]);
});

test('Safe shift never moves Sljeme to a weekday and can be undone', async ({page}) => {
  const errors=await boot(page);
  await expect(page.locator('#shiftAllBtn')).toContainText('Sat, Oct 17');
  await page.locator('#shiftAllBtn').click();
  const s=await state(page);
  const last=s.scheduleState.actions.at(-1);
  expect(last.mode).toBe('shift-all-safe');
  expect(last.to).toBe('2026-10-17');
  expect([0,6]).toContain(new Date(last.to+'T12:00:00').getDay());
  await page.locator('#undoPostponeBtn').click();
  await expect(page.locator('#todayPlan')).toContainText('Long Hike / Sljeme');
  expect(errors).toEqual([]);
});

test('Quick check-in saves every field and persists after reload', async ({page}) => {
  const errors=await boot(page,{clear:false});
  const values={
    sleep:'7.6',weight:'60.4',energy:'8',caloriesBurned:'2450',healthSteps:'9200',
    restingHr:'57',soreness:'2',shin:'1',jointPain:'0',notes:'Good legs, normal workday'
  };
  for(const [id,v] of Object.entries(values)) await page.locator('#'+id).fill(v);
  await page.locator('#saveCheckin').click();
  let s=await state(page);
  expect(s.checks['2026-10-11'].sleep).toBe(7.6);
  expect(s.checks['2026-10-11'].weight).toBe(60.4);
  expect(s.checks['2026-10-11'].notes).toBe(values.notes);
  await page.reload({waitUntil:'networkidle'});
  await expect(page.locator('#sleep')).toHaveValue('7.6');
  await expect(page.locator('#weight')).toHaveValue('60.4');
  await expect(page.locator('#notes')).toHaveValue(values.notes);
  expect(errors).toEqual([]);
});

test('Steps and office stairs save and steps affect completion', async ({page}) => {
  const errors=await boot(page);
  await page.locator('#dailySteps').fill('4000');
  await expect(page.locator('#stepPct')).toHaveText('50%');
  await page.locator('#officeStairs').check();
  let s=await state(page);
  expect(s.daily['2026-10-11'].dailySteps).toBe(4000);
  expect(s.daily['2026-10-11'].officeStairs).toBe(true);
  await page.getByRole('button',{name:'Progress'}).click();
  expect(parseInt(await page.locator('#todayPct').innerText())).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('Changing step goal recalculates percentage and persists', async ({page}) => {
  const errors=await boot(page,{clear:false});
  await page.locator('#dailySteps').fill('4000');
  await page.getByRole('button',{name:'Progress'}).click();
  await page.locator('#stepGoalSetting').fill('10000');
  await page.locator('#saveGoals').click();
  await page.getByRole('button',{name:'Today'}).click();
  await expect(page.locator('#stepPct')).toHaveText('40%');
  await page.reload({waitUntil:'networkidle'});
  await expect(page.locator('#stepGoalLabel')).toHaveText('10,000');
  expect(errors).toEqual([]);
});

test('Sljeme form saves hike metrics, calendar dot, logs and benchmarks', async ({page}) => {
  const errors=await boot(page);
  await page.locator('#todayHikeDuration').fill('180');
  await page.locator('#todayHikeDistance').fill('10.5');
  await page.locator('#todayHikeAscent').fill('720');
  await page.locator('#todayHikePack').fill('3');
  await page.locator('#todayHikeHr').fill('128');
  await page.locator('#todayHikeRpe').fill('6');
  await page.locator('#todayHikeShin').fill('1');
  await page.locator('#todayHikePain').fill('0');
  await page.locator('#todayHikeNotes').fill('Acceptance test hike');
  await page.locator('#saveTodayHike').click();
  await expect(page.locator('#todayHikeCheckin')).toContainText('Hike logged');
  await page.getByRole('button',{name:'Progress'}).click();
  await expect(page.locator('#recentLogs')).toContainText('720 m');
  await expect(page.locator('.cal-day[data-date="2026-10-11"] .dot')).toHaveCount(1);
  await expect(page.locator('#benchmarkBars')).toContainText('3.0 h');
  await expect(page.locator('#benchmarkBars')).toContainText('720 m');
  await expect(page.locator('#benchmarkBars')).toContainText('3 kg');
  expect(errors).toEqual([]);
});

test('Manual unscheduled workout saves from More and appears in Recent logs', async ({page}) => {
  const errors=await boot(page);
  await openMoreSection(page,'Manual workout entry');
  await page.locator('#logDate').fill('2026-10-09');
  await page.locator('#logType').selectOption('Run');
  await page.locator('#duration').fill('31');
  await page.locator('#distance').fill('4.6');
  await page.locator('#rpe').fill('5');
  await page.locator('#logNotes').fill('Easy unscheduled run');
  await page.locator('#saveWorkout').click();
  await page.getByRole('button',{name:'Progress'}).click();
  await expect(page.locator('#recentLogs')).toContainText('Run');
  await expect(page.locator('#recentLogs')).toContainText('4.6 km');
  expect(errors).toEqual([]);
});

test('Progress renders historical percentages and the full 73-day calendar', async ({page}) => {
  const errors=await boot(page);
  await page.getByRole('button',{name:'Progress'}).click();
  expect(parseInt(await page.locator('#weekPct').innerText())).toBeGreaterThan(0);
  expect(parseInt(await page.locator('#planPct').innerText())).toBeGreaterThan(0);
  await expect(page.locator('.cal-day')).toHaveCount(73);
  await expect(page.locator('.cal-day[data-date="2026-10-11"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('Plan contains all ten weeks and current week opens', async ({page}) => {
  const errors=await boot(page);
  await page.getByRole('button',{name:'Plan'}).click();
  await expect(page.locator('.plan-week')).toHaveCount(10);
  await expect(page.locator('.plan-week').first()).toHaveAttribute('open','');
  await expect(page.locator('#planList')).toContainText('Rebuild');
  await expect(page.locator('#planList')).toContainText('Peak');
  await expect(page.locator('#planList')).toContainText('Taper');
  expect(errors).toEqual([]);
});

test('3-day and 7-day summaries generate correctly', async ({page}) => {
  const errors=await boot(page);
  await openMoreSection(page,'Summary & export');
  await page.locator('#gen3').click();
  await expect(page.locator('#summaryText')).toHaveValue(/3-DAY CHECK-IN/);
  await page.locator('#genWeek').click();
  await expect(page.locator('#summaryText')).toHaveValue(/SUNDAY \/ 7-DAY CHECK-IN/);
  await expect(page.locator('#summaryText')).toHaveValue(/Average steps/);
  expect(errors).toEqual([]);
});

test('Data export produces JSON download', async ({page}) => {
  const errors=await boot(page);
  await openMoreSection(page,'Summary & export');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportData').click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe('uhuru-2026-10-11.json');
  expect(errors).toEqual([]);
});

test('Data import replaces app state and rerenders settings', async ({page}) => {
  const errors=await boot(page);
  await openMoreSection(page,'Summary & export');
  const imported={
    version:2,settings:{stepGoal:9500,themeMode:'dark'},checks:{},daily:{},
    workouts:[],scheduleState:{globalShiftDays:0,actions:[]}
  };
  await page.locator('#importData').setInputFiles({
    name:'uhuru-import.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))
  });
  await page.getByRole('button',{name:'Progress'}).click();
  await expect(page.locator('#stepGoalSetting')).toHaveValue('9500');
  const s=await state(page);
  expect(s.settings.stepGoal).toBe(9500);
  expect(errors).toEqual([]);
});

test('Top navigation is exactly Today Progress Plan More', async ({page}) => {
  const errors=await boot(page);
  expect(await page.locator('.tabs button').allTextContents()).toEqual(['Today','Progress','Plan','More']);
  for(const name of ['Progress','Plan','More','Today']) await page.getByRole('button',{name,exact:true}).click();
  expect(errors).toEqual([]);
});

test('More contains manual logging, summaries, safety and app connection', async ({page}) => {
  const errors=await boot(page);
  await page.getByRole('button',{name:'More'}).click();
  await expect(page.locator('details.more-section')).toHaveCount(3);
  await expect(page.getByText('Manual workout entry',{exact:true})).toBeVisible();
  await expect(page.getByText('Summary & export',{exact:true})).toBeVisible();
  await expect(page.getByText('Safety & app settings',{exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('Light, dark and auto theme controls remain functional', async ({page}) => {
  const errors=await boot(page);
  await page.getByRole('button',{name:'Progress'}).click();
  await page.locator('#themeMode').selectOption('light');
  await expect(page.locator('body')).toHaveClass(/light-theme/);
  await page.locator('#themeMode').selectOption('dark');
  await expect(page.locator('body')).not.toHaveClass(/light-theme/);
  await page.locator('#themeMode').selectOption('auto');
  await expect(page.locator('body')).toHaveClass(/light-theme/);
  expect(errors).toEqual([]);
});

test('Mobile layout has no page-level horizontal overflow on every primary tab', async ({page},testInfo) => {
  test.skip(testInfo.project.name!=='mobile');
  const errors=await boot(page);
  for(const name of ['Today','Progress','Plan','More']){
    await page.getByRole('button',{name}).click();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
  expect(errors).toEqual([]);
});

test('Sync key is stored once and reused after reload', async ({page}) => {
  let lastKey='';
  await page.route('**/.netlify/functions/uhuru-data',async route=>{
    lastKey=route.request().headers()['x-uhuru-key']||'';
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({state:null,sha:null})});
  });
  const errors=await boot(page,{clear:false,remoteSync:true});
  const outer=await openMoreSection(page,'Safety & app settings');
  const appConnection=outer.locator('details.advanced-card');
  await appConnection.locator('summary').click();
  await page.locator('#syncKey').fill('test-secret');
  await page.locator('#saveSyncKey').click();
  await expect.poll(()=>lastKey).toBe('test-secret');
  expect(await page.evaluate(k=>localStorage.getItem(k),SYNC_KEY)).toBe('test-secret');
  await page.reload({waitUntil:'networkidle'});
  await expect.poll(()=>lastKey).toBe('test-secret');
  expect(errors).toEqual([]);
});

test('Wrong sync key surfaces an error and a valid key recovers', async ({page}) => {
  await page.route('**/.netlify/functions/uhuru-data',async route=>{
    const key=route.request().headers()['x-uhuru-key']||'';
    if(key!=='correct') return route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'Invalid sync key'})});
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({state:null,sha:null})});
  });
  const errors=await boot(page,{clear:false,remoteSync:true});
  const outer=await openMoreSection(page,'Safety & app settings');
  await outer.locator('details.advanced-card summary').click();
  await page.locator('#syncKey').fill('wrong');
  await page.locator('#saveSyncKey').click();
  await expect(page.locator('#syncMiniText')).toHaveText('Sync error');
  await page.locator('#syncKey').fill('correct');
  await page.locator('#saveSyncKey').click();
  await expect(page.locator('#syncMiniText')).toHaveText('Synced');
  expect(errors).toEqual([]);
});

test('Save automatically PUTs through sync API when connected', async ({page}) => {
  let putBody=null;
  await page.route('**/.netlify/functions/uhuru-data',async route=>{
    const req=route.request();
    if(req.method()==='PUT'){
      putBody=JSON.parse(req.postData());
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,commit:'abc'})});
    }
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({state:null,sha:null})});
  });
  const errors=await boot(page,{clear:false,remoteSync:true});
  await page.evaluate(k=>localStorage.setItem(k,'connected-key'),SYNC_KEY);
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#dailySteps').fill('8100');
  await expect.poll(()=>putBody,{timeout:5000}).not.toBeNull();
  expect(putBody.state.daily['2026-10-11'].dailySteps).toBe(8100);
  await expect(page.locator('#syncMiniText')).toHaveText('Synced');
  expect(errors).toEqual([]);
});

test('Offline save stays pending and reconnect pushes automatically', async ({page,context}) => {
  let putCount=0;
  await page.route('**/.netlify/functions/uhuru-data',async route=>{
    if(route.request().method()==='PUT'){putCount++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})});}
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({state:null})});
  });
  const errors=await boot(page,{clear:false,remoteSync:true});
  await page.evaluate(k=>localStorage.setItem(k,'connected-key'),SYNC_KEY);
  await context.setOffline(true);
  await page.locator('#dailySteps').fill('8300');
  await expect(page.locator('#syncMiniText')).toContainText('Offline');
  expect(putCount).toBe(0);
  await context.setOffline(false);
  await expect.poll(()=>putCount,{timeout:5000}).toBeGreaterThan(0);
  await expect(page.locator('#syncMiniText')).toHaveText('Synced');
  expect(errors).toEqual([]);
});

test('No manual sync button is exposed in normal UI', async ({page}) => {
  const errors=await boot(page);
  await expect(page.locator('#syncNow')).toHaveCount(0);
  await page.getByRole('button',{name:'Progress'}).click();
  await expect(page.getByText('GitHub sync',{exact:true})).toHaveCount(0);
  expect(errors).toEqual([]);
});
