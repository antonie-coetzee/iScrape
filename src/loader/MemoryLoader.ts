import { ScrapeSetup } from "../ScrapeSetup";
import { Loader } from "./Loader";

export class MemoryLoader implements Loader {
  constructor(private scrapeSetups: {[path:string]:ScrapeSetup}) {}

  async load(path: string): Promise<unknown> {
    return this.scrapeSetups[path];
  }
}
