# Introducing puppeteer-in-electron
Use puppeteer to test and control your electron application.
```
npm install puppeteer-in-electron puppeteer-core electron
```

See the [API documentation](/API.md).

# JavaScript
```javascript
const {BrowserWindow, app} = require("electron");
const pie = require("puppeteer-in-electron")
const puppeteer = require("puppeteer-core");

const main = async () => {
  await pie.initialize(app);
  const browser = await pie.connect(app, puppeteer);
 
  const window = new BrowserWindow();
  const url = "https://example.com/";
  await window.loadURL(url);
 
  const page = await pie.getPage(browser, window);
  console.log(page.url());
  window.destroy();
};

main();
```

# TypeScript
```typescript
import {BrowserWindow, app} from "electron";
import pie from "puppeteer-in-electron";
import puppeteer from "puppeteer-core";

const main = async () => {
  await pie.initialize(app);
  const browser = await pie.connect(app, puppeteer);

  const window = new BrowserWindow();
  const url = "https://example.com/";
  await window.loadURL(url);

  const page = await pie.getPage(browser, window);
  console.log(page.url());
  window.destroy();
};

main();
```
