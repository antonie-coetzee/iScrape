import { mkdir, writeFile } from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import { Logger } from "winston";
import * as XLSX from "xlsx";
import { Loader } from "./loader";
import { ScrapeObject, ScrapeSetup } from "./ScrapeSetup";

export class Scraper {
  constructor(
    private logger: Logger,
    private loader: Loader,
    private rootDir: string,
    private debugMode: boolean
  ) {}

  async scrape(setupPath: string) {
    this.logger.info(`loading setup from: '${setupPath}'`);
    const setup = (await this.loader.load(setupPath)) as ScrapeSetup;
    if (setup == null) {
      throw new Error(`unable to load setup from: '${setupPath}'`);
    }
    const scrapedData: { url: string; data: ScrapeObject }[] = [];
    const baseContext = {
      logger: this.logger,
    };
    const maxItterations = setup.maxItterations || 1000;
    let i = 0;
    const chromePath = path.resolve(
      `${path.dirname(process.execPath)}/chrome-win/chrome.exe`
    );
    let browser = await puppeteer.launch({
      executablePath: this.debugMode ? undefined : chromePath,
    });
    if (browser == null) {
      throw new Error("unable to create browser instance");
    }
    this.logger.info(`starting scrape...`);

    for await (const url of setup.generator(baseContext)) {
      if (url == null) {
        break;
      }
      if (i++ >= maxItterations) {
        throw new Error(`max itterations exceeded: '${maxItterations}'`);
      }

      this.logger.info(`[${i}] url: '${url}'`);
      const navigatorContext = {
        ...baseContext,
        url,
        browser,
      };
      const pageProducers = await setup.navigator(navigatorContext);
      if (pageProducers == null || pageProducers.length === 0) {
        this.logger.warn(`[${i}] unable to navitage to: '${url}', skipping`);
        continue;
      }
      for (const chunkProducers of chunk(
        pageProducers,
        setup.concurrency || 1
      )) {
        await Promise.all(
          chunkProducers.map(async (pp) => {
            const page = await pp();
            this.logger.info(`[${i}] scraping data from ${page.url()}`);
            const selectorContext = { ...navigatorContext, page };
            const scrapeObj = await setup.selector(selectorContext);
            if (scrapeObj == null) {
              this.logger.warn(
                `[${i}] unable to scrape data from: '${page.url()}', skipping`
              );
              return;
            }
            scrapedData.push({ url: page.url(), data: scrapeObj });
            await page.close();
          })
        );
      }
    }

    await this.outputScrapedData(
      setup.outputPath || this.rootDir + "/results.json",
      scrapedData,
      setup.outputUrls
    );
    browser.close();
    process.exit(0);
  }

  async outputScrapedData(
    outputPath: string,
    scrapedData: { url: string; data: ScrapeObject }[],
    includeUrls: boolean = false
  ) {
    if (scrapedData == null || scrapedData.length === 0) {
      this.logger.warn("no scrape data, skipping output");
      return;
    }
    const outputData = includeUrls
      ? scrapedData
      : scrapedData.map((d) => d.data);
    const absPath = path.resolve(this.rootDir, outputPath);
    await mkdir(path.dirname(absPath), { recursive: true });
    this.logger.info(`writing output to: '${absPath}'`);
    const extension = path.extname(absPath);
    switch (extension) {
      case ".json":
        await writeFile(absPath, JSON.stringify(outputData, null, 2));
        break;
      case ".csv":
      case ".xlsx":
        var wb = XLSX.utils.book_new();
        var ws = XLSX.utils.json_to_sheet(outputData);
        XLSX.utils.book_append_sheet(wb, ws, "data");
        XLSX.writeFile(wb, absPath);
        break;
      default:
        this.logger.warn(`output filetype: '${extension}' not supported`);
        break;
    }
  }
}

function chunk<T>(arr: T[], len: number) {
  var chunks = [],
    i = 0,
    n = arr.length;
  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }
  return chunks;
}
