/* eslint-disable @typescript-eslint/no-var-requires */
const {BrowserWindow, app} = require("electron");
const assert = require("assert");
const pie = require("./bin/index");
const puppeteer = require("puppeteer-core");

const main = async () => {
  await pie.initialize(app);
  const browser = await pie.connect(
    app,
    puppeteer
  );

  const window = new BrowserWindow();

  const page = await pie.getPage(
    browser,
    window
  );

  const url = "https://example.com/";
  await window.loadURL(url);
  console.log(page.url());
  assert.strictEqual(
    page.url(),
    url
  );
  window.destroy();
};

main();
