const { chromium } = require('playwright');
const { spawn } = require('child_process');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-c:v', 'mjpeg',
    '-r', '30',
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    'test_cdp.mp4'
  ]);

  const client = await page.context().newCDPSession(page);
  client.on('Page.screencastFrame', async (payload) => {
    ffmpeg.stdin.write(Buffer.from(payload.data, 'base64'));
    await client.send('Page.screencastFrameAck', { sessionId: payload.sessionId }).catch(()=>{});
  });

  await client.send('Page.startScreencast', { format: 'jpeg', quality: 100, everyNthFrame: 1 });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(5000);
  
  await client.send('Page.stopScreencast');
  ffmpeg.stdin.end();
  await browser.close();
})();
