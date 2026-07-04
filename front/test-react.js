const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('PAGE EXCEPTION:', err.message);
  });
  
  await page.goto('http://localhost:5173/auth/login');
  
  // Fill login
  await page.fill('input[type="email"]', 'velton@gmail.com');
  await page.fill('input[type="password"]', 'pompeli123'); // assuming standard dev password
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(2000);
  
  // Go to projects
  await page.goto('http://localhost:5173/projetos');
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
