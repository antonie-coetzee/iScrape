import winston from "winston";
import { MemorySetupLoader } from "./loader/MemorySetupLoader";
import {Scraper} from "./Scraper";
import testSetup from "./testSetup";

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
  ]
});

const loader = new MemorySetupLoader({"default": testSetup});

const scraper = new Scraper(logger, loader);

(async function() {
  await scraper.scrape("default");
}());
