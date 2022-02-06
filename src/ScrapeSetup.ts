import { Browser, Page } from "puppeteer";
import { Logger } from "winston";

export type BaseContext = {
  logger: Logger;
};

export type NavigatorContext = BaseContext & {
  url: string;
  browser: Browser;
};

export type SelectorContext = NavigatorContext & {
  page: Page;
};

export type Generator = (context: BaseContext) => AsyncIterableIterator<string | undefined>;

export type Navigator = (context: NavigatorContext) => Promise<(()=>Promise<Page>)[] | undefined>;

export type ScrapeObject = { [index: string]: string | undefined };

export type Selector = (
  context: SelectorContext
) => Promise<ScrapeObject | undefined>;

export type ScrapeSetup = {
  generator: Generator;
  navigator: Navigator;
  selector: Selector;
  maxItterations?: number;
  outputPath?: string;
  outputUrls?: boolean;
  concurrency?: number;
};
