import deasync from "deasync";
import fetch from "node-fetch";
import portfinder from "portfinder";
import retry from "async-retry";
import uuid from "uuid";

type App = import("electron").App;
type BrowserWindow = import("electron").BrowserWindow;
type puppeteer = typeof import("puppeteer-core");
type Browser = import("puppeteer-core").Browser;

const connect = async (app: App, puppeteer: puppeteer, port?: number) => {
  if (!app) {
    throw new Error("The parameter 'app' was not passed in. " +
      "This may indicate that you are running in node rather than electron");
  }

  if (!puppeteer) {
    throw new Error("The parameter 'puppeteer' was not passed in.");
  }

  if (app.isReady()) {
    throw new Error("Must be called before the electron app is ready");
  }

  if (port < 1 || port > 65535) {
    throw new Error(`Invalid port ${port}`);
  }

  // eslint-disable-next-line no-param-reassign
  port = port || deasync(portfinder.getPort)();

  app.commandLine.appendSwitch("remote-debugging-port", `${port}`);

  await app.whenReady;
  const response = await retry(() => fetch(`http://127.0.0.1:${port}/json/version`));
  const json = await response.json();

  const browser = await puppeteer.connect({
    browserWSEndpoint: json.webSocketDebuggerUrl,
    defaultViewport: null
  });

  return {browser, json, port};
};

const getPage = async (browser: Browser, window: BrowserWindow) => {
  if (!browser) {
    throw new Error("The parameter 'browser' was not passed in.");
  }

  if (!window) {
    throw new Error("The parameter 'window' was not passed in.");
  }

  const guid = uuid.v4();
  await window.webContents.executeJavaScript(`window.puppeteer = "${guid}"`);
  const pages = await browser.pages();
  const guids = await Promise.all(pages.map((testPage) => testPage.evaluate("window.puppeteer")));
  const index = guids.findIndex((testGuid) => testGuid === guid);
  await window.webContents.executeJavaScript("delete window.puppeteer");
  return pages[index];
};

export default {
  connect,
  getPage
};
