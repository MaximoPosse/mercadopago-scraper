const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const URL = "https://promociones.mercadopago.com.ar/";

(async () => {
  let browser;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
    });

    const page = await browser.newPage();

    await page.goto(URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await page.waitForSelector(".kiyo__cards--col", { timeout: 30000 });

    const promociones = await page.evaluate(() => {
      const columnas = document.querySelectorAll(".kiyo__cards--col");

      return [...columnas].map((columna) => {
        const data = columna.querySelector(".kiyo__data");
        const item = columna.querySelector(".kiyo__cards--item");

        const comercio =
          data?.querySelector("h3")?.innerText?.trim() ||
          item?.querySelector("h3")?.innerText?.trim() ||
          null;

        const beneficio =
          data
            ?.querySelector(".kiyo__cards--badge:not(.kiyo__cards--badge2) span")
            ?.innerText?.trim() ||
          item
            ?.querySelector(".kiyo__cards--badge:not(.kiyo__cards--badge2) span")
            ?.innerText?.trim() ||
          null;

        const cuotas =
          data?.querySelector(".kiyo__cards--badge2 span")?.innerText?.trim() ||
          item?.querySelector(".kiyo__cards--badge2 span")?.innerText?.trim() ||
          null;

        const imagen =
          data?.querySelector("img")?.src || item?.querySelector("img")?.src || null;

        const descripcion =
          data?.querySelector(".kiyo__data--details-row1 p")?.innerText?.trim() || null;

        const vigencia =
          data?.querySelector(".kiyo__data--details-row2 small")?.innerText?.trim() || null;

        const url_promocion =
          data?.querySelector(".kiyo__data--details-btn a")?.href || null;

        return {
          comercio,
          beneficio,
          cuotas,
          imagen,
          descripcion,
          vigencia,
          url_promocion,
        };
      });
    });

    fs.writeFileSync(
      path.join(DATA_DIR, "promociones.json"),
      JSON.stringify(promociones, null, 2)
    );

    console.log(`✅ ${promociones.length} promociones guardadas en data/promociones.json`);
  } catch (error) {
    console.error("❌ Error al ejecutar el scraper:", error.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
