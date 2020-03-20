import fetch from "node-fetch";
import getPort from "get-port";
import retry from "async-retry";
import uuid from "uuid";

type App = import("electron").App;
type BrowserWindow = import("electron").BrowserWindow;
type puppeteer = typeof import("puppeteer-core");
type Browser = import("puppeteer-core").Browser;

/**
 * Initialize the electron app to accept puppeteer/DevTools connections.
 * Must be called at startup before the electron app is ready.
 * @param {App} app The app imported from electron.
 * @param {number} port Port to host the DevTools websocket connection.
 */
export const initialize = async (app: App, port: number = 0) => {
  if (!app) {
    throw new Error("The parameter 'app' was not passed in. " +
      "This may indicate that you are running in node rather than electron.");
  }

  if (app.isReady()) {
    throw new Error("Must be called at startup before the electron app is ready.");
  }

  if (port < 0 || port > 65535) {
    throw new Error(`Invalid port ${port}.`);
  }

  if (app.commandLine.getSwitchValue("remote-debugging-port")) {
    throw new Error("The electron application is already listening on a port. Double `initialize`?");
  }

  const actualPort = port === 0 ? await getPort() : port;
  app.commandLine.appendSwitch(
    "remote-debugging-port",
    `${actualPort}`
  );
  app.commandLine.appendSwitch(
    "remote-debugging-address",
    "127.0.0.1"
  );
  const electronMajor = parseInt(
    app.getVersion().split(".")[0],
    10
  );
  // NetworkService crashes in electron 6.
  if (electronMajor >= 7) {
    app.commandLine.appendSwitch(
      "enable-features",
      "NetworkService"
    );
  }
};

/**
 * Connects puppeteer to the electron app. Must call {@link initialize} before connecting.
 * When connecting multiple times, you use the same port.
 * @param {App} app The app imported from electron.
 * @param {puppeteer} puppeteer The imported puppeteer namespace.
 * @returns {Promise<Browser>} An object containing the puppeteer browser, the port, and json received from DevTools.
 */
export const connect = async (app: App, puppeteer: puppeteer) => {
  if (!puppeteer) {
    throw new Error("The parameter 'puppeteer' was not passed in.");
  }

  const port = app.commandLine.getSwitchValue("remote-debugging-port");
  if (!port) {
    throw new Error("The electron application was not setup to listen on a port. Was `initialize` called at startup?");
  }

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
  getPage,
  initialize
};
