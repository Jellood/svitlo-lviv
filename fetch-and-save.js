import puppeteer from "puppeteer";
import { writeFileSync } from "fs";

// Parse "Група 1.1. Електроенергії немає з 20:30 до 24:00."
function parseLine(line) {
    const groupMatch = line.match(/Група\s+([\d.]+)/);
    if (!groupMatch) return null;

    const group = groupMatch[1];

    if (line.includes("Електроенергія є")) {
        return { group, intervals: [] };
    }

    const intervals = [...line.matchAll(/з\s*(\d{2}:\d{2})\s*до\s*(\d{2}:\d{2})/g)]
        .map(([_, from, to]) => ({ from, to }));

    return { group, intervals };
}

async function fetchSchedule() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto("https://poweron.loe.lviv.ua/", {
        waitUntil: "networkidle0"
    });

    const lines = await page.$$eval(".power-off__text p", elements =>
        elements.map(e => e.textContent.trim())
    );

    await browser.close();

    const result = {};

    for (const line of lines) {
        if (!line.startsWith("Група")) continue;

        const parsed = parseLine(line);
        if (parsed) {
            result[parsed.group] = parsed.intervals;
        }
    }

    return result;
}

async function update() {
    try {
        const data = await fetchSchedule();
        writeFileSync("schedule.json", JSON.stringify(data, null, 2), "utf-8");
        console.log(`[${new Date().toLocaleString()}] schedule.json updated`);
    } catch (err) {
        console.error("Error updating schedule:", err.message);
    }
}

// first run
update();

// repeat every 10 minutes
setInterval(update, 10 * 60 * 1000);
