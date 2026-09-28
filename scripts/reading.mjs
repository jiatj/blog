import { scanReadingSites } from "../lib/reading/scan.ts";

const dateFlag = process.argv.indexOf("--date");
const date = dateFlag >= 0 ? process.argv[dateFlag + 1] : undefined;
if (dateFlag >= 0 && !date) throw new Error("--date requires YYYY-MM-DD");

const result = await scanReadingSites({ date });
console.log(`Scanned ${result.scanned} sites for ${result.date}; saved ${result.saved} articles.`);
for (const error of result.errors) console.error(error);
if (result.errors.length) process.exitCode = 1;
