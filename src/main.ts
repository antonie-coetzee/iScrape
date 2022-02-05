import path from "path";
import winston from "winston";
import { program } from "commander";
import { MemoryLoader, ModuleLoader } from "./loader";
import { Scraper } from "./Scraper";
import testSetup from "./testSetup";

program
  .name('iscrape')
  .description('basic web scraping utility')
  .version('0.1.0');

program
  .requiredOption('-s, --setup <path>', 'setup script path')

program.parse();

const options = program.opts();

const debugMode = !__filename.includes("snapshot");
const rootDir = debugMode ? __dirname : path.dirname(process.execPath);

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

const loader = debugMode
  ? new MemoryLoader({ default: testSetup })
  : new ModuleLoader(rootDir);

const scraper = new Scraper(logger, loader, rootDir, debugMode);

(async function () {
  await scraper.scrape(debugMode ? "default" : options.setup);
})();
