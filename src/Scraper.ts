import { writeFile } from "fs/promises";
import path from "path";
import puppeteer from 'puppeteer'
import * as XLSX from "xlsx";
import { Logger } from "winston";
import { Loader } from "./loader/Loader";
import { ScrapeObject, ScrapeSetup } from "./ScrapeSetup";

export class Scraper {
  constructor(private logger: Logger, private loader: Loader) {}

  async scrape(setupPath: string) {
    this.logger.info(`loading setup from: '${setupPath}'`);
    const setup = (await this.loader.import(setupPath)) as ScrapeSetup;
    if (setup == null) {
      throw new Error(`unable to load setup from: '${setupPath}'`);
    }
    const scrapedData: { url: string; data: ScrapeObject }[] = [];
    const baseContext = {
      logger: this.logger,
    };
    const maxItterations = setup.maxItterations || 1000;
    let i = 0;
    let url: string | undefined;
    let browser = await puppeteer.launch();
    if (browser == null) {
      throw new Error("unable to create browser instance");
    }
    this.logger.info(`starting scrape...`);
    while (true) {
      if (i++ >= maxItterations) {
        throw new Error(`max itterations exceeded: '${maxItterations}'`);
      }
      url = await setup.generator(baseContext);
      if (url == null) {
        break;
      }
      this.logger.info(`step ${i}, navigating to: '${url}'`);
      const navigatorContext = {
        ...baseContext,
        url,
        browser,
      };
      const page = await setup.navigator(navigatorContext);
      if (page == null) {
        this.logger.warn(`unable to navitage to: '${url}', skipping`);
        continue;
      }
      const selectorContext = { ...navigatorContext, page };
      this.logger.info(`selecting scrape data`);
      const scrapeObj = await setup.selector(selectorContext);
      if (scrapeObj == null) {
        this.logger.warn(
          `unable to select scrape data from: '${url}', skipping`
        );
        continue;
      }
      scrapedData.push({ url, data: scrapeObj });
    }
    await this.outputScrapedData(
      setup.outputPath || __dirname + "/results.json",
      scrapedData,
      setup.outputUrls
    );
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
    const absPath = path.isAbsolute(outputPath)
      ? outputPath
      : path.resolve(outputPath);
    this.logger.info(`writing output to: '${absPath}'`);
    const extension = path.extname(absPath);
    switch (extension) {
      case ".json":
        await writeFile(absPath, JSON.stringify(outputData));  
        break;
      case ".csv":
      case ".xlsx":
        var wb = XLSX.utils.book_new();
        var ws = XLSX.utils.json_to_sheet(outputData);
        XLSX.utils.book_append_sheet(wb, ws, "data");
        XLSX.writeFile(wb, outputPath);
        break;
      default:
        this.logger.warn(`output filetype: '${extension}' not supported`);
        break;
    }
  }
}
