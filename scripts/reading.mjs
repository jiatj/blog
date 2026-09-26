import { scanReadingSites } from "../lib/reading/scan.ts";

const result = await scanReadingSites();
console.log(`Scanned ${result.scanned} sites; saved ${result.saved} articles.`);
for (const error of result.errors) console.error(error);
if (result.errors.length) process.exitCode = 1;
