"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let count = 0;
const setup = {
    generator: async (cntx) => {
        if (count === 0) {
            count++;
            return "https://www.google.com";
        }
        else {
            return;
        }
    },
    navigator: async (cntx) => {
        const page = await cntx.browser.newPage();
        await page.goto(cntx.url);
        return page;
    },
    selector: async (cntx) => {
        return {
            foo: "qwe",
            bar: "asd"
        };
    }
};
exports.default = setup;
