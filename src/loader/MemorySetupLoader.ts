import { ScrapeSetup } from "../ScrapeSetup";
import { Loader } from "./Loader";

export class MemorySetupLoader implements Loader {
  constructor(private scrapeSetups: {[path:string]:ScrapeSetup}) {}

  async import(path: string): Promise<unknown> {
    return this.scrapeSetups[path];
  }
}
