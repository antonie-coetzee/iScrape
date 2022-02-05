import { ScrapeSetup } from "./ScrapeSetup";

let count = 0;

const setup: ScrapeSetup = {
  generator: async function* (cntx):AsyncIterableIterator<string | undefined> {
    if (count === 0) {
      count++;
      yield "https://opticalalliance.co.za/find-an-optometrist/item/408-maxine-manickam";
    } else {
      return;
    }
  },
  navigator: async (cntx) => {
    const page = await cntx.browser.newPage();
    await page.goto(cntx.url);
    await page.waitForSelector('.itemExtraFields');
    return [page];
  },
  selector: async (cntx) => {
    const val = await cntx.page.$eval<string>('.itemExtraFields ul li.even:nth-child(1) > span:nth-child(2)',el=>el.textContent);
    return {
      foo: String(val),
      bar: "asd",
    };
  },
  outputPath: "./results.json"
};

export default setup;
