import {BrowserWindow, app} from "electron";
import assert from "assert";
import pie from "./index";
import puppeteer from "puppeteer-core";

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
