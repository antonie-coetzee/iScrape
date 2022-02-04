import { Page } from "puppeteer";
import { Logger } from "winston";

export type BaseContext = {
  logger: Logger;
};

export type NavigatorContext = BaseContext & {
  url: URL;
};

export type SelectorContext = NavigatorContext & {
  page: Page;
};

export type Generator = (context: BaseContext) => Promise<URL | undefined>;

export type Navigator = (context: NavigatorContext) => Promise<Page>;

export type Selector = (
  context: SelectorContext
) => Promise<{ [index: string]: string | undefined } | undefined>;

export type ScrapeConfig = {
  generator: Generator;
  navigator: Navigator;
  selector: Selector;
};
