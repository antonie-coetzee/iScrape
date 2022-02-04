"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scraper = void 0;
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const XLSX = __importStar(require("xlsx"));
class Scraper {
    constructor(logger, loader) {
        this.logger = logger;
        this.loader = loader;
    }
    async scrape(setupPath) {
        this.logger.info(`loading setup from: '${setupPath}'`);
        const setup = (await this.loader.import(setupPath));
        if (setup == null) {
            throw new Error(`unable to load setup from: '${setupPath}'`);
        }
        const scrapedData = [];
        const baseContext = {
            logger: this.logger,
        };
        const maxItterations = setup.maxItterations || 1000;
        let i = 0;
        let url;
        let browser = await puppeteer_1.default.launch();
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
            this.logger.info(`navigating to: '${url}'`);
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
                this.logger.warn(`unable to select scrape data from: '${url}', skipping`);
                continue;
            }
            scrapedData.push({ url, data: scrapeObj });
        }
        await this.outputScrapedData(setup.outputPath || __dirname + "/results.json", scrapedData, setup.outputUrls);
    }
    async outputScrapedData(outputPath, scrapedData, includeUrls = false) {
        if (scrapedData == null || scrapedData.length === 0) {
            this.logger.warn("no scrape data, skipping output");
            return;
        }
        const outputData = includeUrls
            ? scrapedData
            : scrapedData.map((d) => d.data);
        const absPath = path_1.default.isAbsolute(outputPath)
            ? outputPath
            : path_1.default.resolve(outputPath);
        this.logger.info(`writing output to: '${absPath}'`);
        const extension = path_1.default.extname(absPath);
        switch (extension) {
            case ".json":
                await (0, promises_1.writeFile)(absPath, JSON.stringify(outputData));
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
exports.Scraper = Scraper;
