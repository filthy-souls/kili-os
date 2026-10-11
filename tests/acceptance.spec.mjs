import { test, expect } from '@playwright/test';

async function boot(page) {
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(() => {
    const RealDate=Date;
    class FakeDate extends RealDate {
      constructor(...args){ super(...(args.length?args:['2026-10-11T12:00:00+02:00'])); }
      static now(){ return new RealDate('2026-10-11T12:00:00+02:00').getTime(); }
    }
    window.Date=FakeDate;
    localStorage.clear();
  });
  await page.goto('/',{waitUntil:'networkidle'});
  await expect(page.locator('#phaseLine')).toContainText('Sun, Oct 11');
  return errors;
}

test('Today renders moved Sljeme and dedicated hike check-in', async ({page}) => {
  const errors=await boot(page);
  await expect(page.locator('#todayPlan')).toContainText('Long Hike / Sljeme');
  await expect(page.locator('#todayHikeCheckin')).toContainText("Log today's hike");
  await expect(page.locator('#saveTodayHike')).toBeVisible();
  await expect(page.locator('#tomorrowPreview')).toContainText('Rest + easy walking');
  expect(errors).toEqual([]);
});

test('Progress renders historical percentages and full calendar', async ({page}) => {
  const errors=await boot(page);
  await page.getByRole('button',{name:'Progress'}).click();
  const week=await page.locator('#weekPct').innerText();
  const plan=await page.locator('#planPct').innerText();
  expect(parseInt(week)).toBeGreaterThan(0);
  expect(parseInt(plan)).toBeGreaterThan(0);
  await expect(page.locator('.cal-day')).toHaveCount(73);
  await expect(page.locator('#stepPct')).toHaveText('0%');
  expect(errors).toEqual([]);
});

test('Plan contains all ten weeks and current week opens', async ({page}) => {
  const errors=await boot(page);
  await page.getByRole('button',{name:'Plan'}).click();
  await expect(page.locator('.plan-week')).toHaveCount(10);
  await expect(page.locator('.plan-week').first()).toHaveAttribute('open','');
  await expect(page.locator('#planList')).toContainText('Rebuild');
  await expect(page.locator('#planList')).toContainText('Taper');
  expect(errors).toEqual([]);
});

test('Step goal is numeric and percentage updates correctly', async ({page}) => {
  const errors=await boot(page);
  await page.locator('#dailySteps').fill('4000');
  await expect(page.locator('#stepPct')).toHaveText('50%');
  await page.locator('#dailySteps').fill('8000');
  await expect(page.locator('#stepPct')).toHaveText('100%');
  expect(errors).toEqual([]);
});

test('Sljeme form saves a hike and updates dashboard log', async ({page}) => {
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
  await expect(page.locator('#recentLogs')).toContainText('Hike');
  await expect(page.locator('#recentLogs')).toContainText('720 m');
  expect(errors).toEqual([]);
});

test('Summary generation works', async ({page}) => {
  const errors=await boot(page);
  await page.getByRole('button',{name:'More'}).click();
  await page.locator('details.more-section').filter({hasText:'Summary & export'}).locator('summary').click();
  await page.locator('#gen3').click();
  await expect(page.locator('#summaryText')).toHaveValue(/KILI TRAINING UPDATE/);
  await expect(page.locator('#summaryText')).toHaveValue(/Average steps/);
  expect(errors).toEqual([]);
});

test('No manual sync button in normal progress UI', async ({page}) => {
  const errors=await boot(page);
  await page.getByRole('button',{name:'Progress'}).click();
  await expect(page.locator('#syncNow')).toHaveCount(0);
  await expect(page.getByText('GitHub sync',{exact:true})).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Navigation tabs all activate without runtime errors', async ({page}) => {
  const errors=await boot(page);
  for (const name of ['Progress','Plan','More','Today']) {
    await page.getByRole('button',{name}).click();
  }
  expect(errors).toEqual([]);
});

test('Mobile layout has no page-level horizontal overflow', async ({page},testInfo) => {
  test.skip(testInfo.project.name!=='mobile');
  const errors=await boot(page);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('Light and dark theme switching remains functional', async ({page}) => {
  const errors=await boot(page);
  await page.getByRole('button',{name:'Progress'}).click();
  await page.locator('#themeMode').selectOption('light');
  await expect(page.locator('body')).toHaveClass(/light-theme/);
  await page.locator('#themeMode').selectOption('dark');
  await expect(page.locator('body')).not.toHaveClass(/light-theme/);
  expect(errors).toEqual([]);
});


test('Top navigation is simplified to four primary tabs', async ({page}) => {
  const errors=await boot(page);
  const labels=await page.locator('.tabs button').allTextContents();
  expect(labels).toEqual(['Today','Progress','Plan','More']);
  expect(errors).toEqual([]);
});

test('Manual workout entry is available under More and recent logs remain on Progress', async ({page}) => {
  const errors=await boot(page);
  await page.getByRole('button',{name:'More'}).click();
  await page.locator('details.more-section').filter({hasText:'Manual workout entry'}).locator('summary').click();
  await expect(page.locator('#saveWorkout')).toBeVisible();
  await page.getByRole('button',{name:'Progress'}).click();
  await expect(page.locator('#recentLogs')).toBeVisible();
  expect(errors).toEqual([]);
});
