import fetch from "node-fetch";
import retry from "async-retry";
import uuid from "uuid";

type App = import("electron").App;
type BrowserWindow = import("electron").BrowserWindow;
type puppeteer = typeof import("puppeteer-core");
type Browser = import("puppeteer-core").Browser;

/**
 * Connects puppeteer to the electron app. Must be called at startup before the electron app is ready.
 * When connecting multiple times, you use the same port.
 * @param {App} app The app imported from electron.
 * @param {puppeteer} puppeteer The imported puppeteer namespace.
 * @param {number} port Port to host the DevTools websocket connection.
 * @returns {Promise<Browser>} An object containing the puppeteer browser, the port, and json received from DevTools.
 */
export const connect = async (app: App, puppeteer: puppeteer, port: number = 14292) => {
  if (!app) {
    throw new Error("The parameter 'app' was not passed in. " +
      "This may indicate that you are running in node rather than electron.");
  }

  if (!puppeteer) {
    throw new Error("The parameter 'puppeteer' was not passed in.");
  }

  if (app.isReady()) {
    throw new Error("Must be called at startup before the electron app is ready.");
  }

  if (port <= 0 || port > 65535) {
    throw new Error(`Invalid port ${port}.`);
  }

  const prevSwitch = app.commandLine.getSwitchValue("remote-debugging-port");
  if (prevSwitch && prevSwitch !== `${port}`) {
    throw new Error(`Attempting to connect on port ${port} when the previously` +
      `specified was ${prevSwitch} (must be the same for multiple connections)`);
  }
  app.commandLine.appendSwitch(
    "remote-debugging-port",
    `${port}`
  );

  await app.whenReady;
  const response = await retry(() => fetch(`http://127.0.0.1:${port}/json/version`));
  const json = await response.json();

  const browser = await puppeteer.connect({
    browserWSEndpoint: json.webSocketDebuggerUrl,
    defaultViewport: null
  });

  return browser;
};

/**
 * Given a BrowserWindow, find the corresponding puppeteer Page. It is undefined if external operations
 * occur on the page whilst we are attempting to find it. A url/file must be loaded on the window for it to be found.
 * If no url is loaded, the parameter 'allowBlankNavigate' allows us to load "about:blank" first.
 * @param {Browser} browser The puppeteer browser instance obtained from calling |connect|.
 * @param {BrowserWindow} window The browser window for which we want to find the corresponding puppeteer Page.
 * @param {boolean} allowBlankNavigate If no url is loaded, allow us to load "about:blank" so that we may find the Page.
 * @returns {Promise<Page>} The page that corresponds with the BrowserWindow.
 */
export const getPage = async (browser: Browser, window: BrowserWindow, allowBlankNavigate: boolean = true) => {
  if (!browser) {
    throw new Error("The parameter 'browser' was not passed in.");
  }

  if (!window) {
    throw new Error("The parameter 'window' was not passed in.");
  }

  if (window.webContents.getURL() === "") {
    if (allowBlankNavigate) {
      await window.loadURL("about:blank");
    } else {
      throw new Error("In order to get the puppeteer Page, we must be able " +
        "to execute JavaScript which requires the window having loaded a URL.");
    }
  }

  const guid = uuid.v4();
  await window.webContents.executeJavaScript(`window.puppeteer = "${guid}"`);
  const pages = await browser.pages();
  const guids = await Promise.all(pages.map((testPage) => testPage.evaluate("window.puppeteer")));
  const index = guids.findIndex((testGuid) => testGuid === guid);
  await window.webContents.executeJavaScript("delete window.puppeteer");
  const page = pages[index];
  if (!page) {
    throw new Error("Unable to find puppeteer Page from BrowserWindow. Please report this.");
  }
  return page;
};

export default {
  connect,
  getPage
};
