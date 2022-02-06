import { Page } from "puppeteer";
import { ScrapeSetup } from "./ScrapeSetup";

let index = 0;
let total = 33;

const setup: ScrapeSetup = {
  concurrency: 5,
  generator: async function* (cntx): AsyncIterableIterator<string | undefined> {
    while (index <= total) {
      yield `https://opticalalliance.co.za/optom-search-results/itemlist/filter?start=${
        index * 10
      }&Itemid=630`;
      index++;
    }
  },
  navigator: async (cntx) => {
    const page = await cntx.browser.newPage();
    await page.goto(cntx.url);
    await page.waitForSelector("#k2Container");
    const links = (await page.$$eval<string[]>(".k2ReadMore", (el) =>
      el.map((e) => e.href)
    )) as unknown as string[];
    if (links == null || links.length === 0) {
      return;
    }
    const filteredLinks = links.filter((l) =>
      l.includes("find-an-optometrist")
    );
    await page.close();
    if (filteredLinks == null || filteredLinks.length === 0) {
      return;
    }
    const pageProducers: (() => Promise<Page>)[] = [];
    for (const link of filteredLinks) {
      pageProducers.push(async () => {
        const childPage = await cntx.browser.newPage();
        await childPage.goto(link);
        await childPage.waitForSelector(".itemExtraFields");
        return childPage;
      });
    }
    return pageProducers;
  },

  selector: async (cntx) => {
    const practiceName = await safeStringEval(
      cntx.page,
      "#k2Container .itemTitle"
    );

    const memberName = await safeStringEval(
      cntx.page,
      ".itemExtraFields ul .aliasMemberName > span:nth-child(2)"
    );

    const cityTown = await safeStringEval(
      cntx.page,
      ".itemExtraFields ul .aliasTownCity > span:nth-child(2)"
    );

    const area = await safeStringEval(
      cntx.page,
      ".itemExtraFields ul .aliasArea > span:nth-child(2)"
    );

    const province = await safeStringEval(
      cntx.page,
      ".itemExtraFields ul .aliasProvince > span:nth-child(2)"
    );

    const address: string = await safeStringEval(
      cntx.page,
      ".itemExtraFields ul .aliasAddress > span:nth-child(2)"
    );

    const tel: string = await safeStringEval(
      cntx.page,
      ".itemExtraFields ul .aliasTel > span:nth-child(2)"
    );

    let email: string[] = [];
    try {
      email = (await cntx.page.$$eval<string[]>(
        ".itemExtraFields ul .aliasEmail > span:nth-child(2) > span > a",
        (el) => el.map((e) => e.textContent)
      )) as unknown as string[];
    } catch {}

    return {
      practiceName: practiceName.trim(),
      memberName: memberName.trim(),
      cityTown: cityTown.trim(),
      area: area.trim(),
      province: province.trim(),
      address: address.trim(),
      tel: tel.replaceAll("-", ""),
      email: String(email),
    };
  },
  outputPath: "./results.xlsx",
};

async function safeStringEval(page: Page, selector: string) {
  try {
    return await page.$eval<string>(
      selector,
      (el) => el.textContent
    ) as unknown as string;
  } catch {
    return "";
  }
}

export default setup;
