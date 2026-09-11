import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/home/tunabel/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:1500,height:1000}});
  page.setDefaultTimeout(90000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:3000/');
  await page.getByText('Model ready',{exact:false}).waitFor();
  await page.getByRole('button',{name:'Compare plans',exact:true}).click();
  for(const floor of ['EG','OG','DG']){
    await page.getByRole('group',{name:'Comparison floor'}).getByRole('button',{name:floor,exact:true}).click();
    const image=page.locator('.source-scroll img');await image.waitFor();
    await image.evaluate(img=>img.decode());
    assert(await image.evaluate(img=>img.naturalWidth>0));
    assert.equal(await page.locator('.blueprint svg').count(),1);
    await page.screenshot({path:`/tmp/house-comparison-${floor}.png`});
  }
  await page.getByRole('button',{name:'Dimensions',exact:true}).click();
  assert(await page.locator('.dimension-table tbody tr').count()>15);
  await page.getByRole('button',{name:'Close comparison'}).click();
  assert.equal(await page.locator('.comparison-left').count(),0);
  await page.getByRole('button',{name:'Compare plans',exact:true}).click();
  await page.keyboard.press('Escape');assert.equal(await page.locator('.comparison-left').count(),0);
  await page.getByRole('button',{name:'Compare plans',exact:true}).click();
  await page.setViewportSize({width:720,height:950});
  await page.screenshot({path:'/tmp/house-comparison-small.png'});
  assert.deepEqual(errors,[]);console.log('Comparison: three source sheets, synchronized floors, dimensions, close button and Escape passed.');
}finally{await browser.close();}
