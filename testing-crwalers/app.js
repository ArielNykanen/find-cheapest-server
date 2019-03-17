const puppeteer = require('puppeteer');

let bookingUrl = 'https://www.yad2.co.il/';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage(bookingUrl);

  // get hotel details
  const textContent = await page.evaluate(() => document.querySelector('title').textContent);
  const innerText = await page.evaluate(() => document.querySelector('title').innerText);


  console.dir(textContent);
  console.dir(innerText);
})();