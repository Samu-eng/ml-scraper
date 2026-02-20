const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

app.get("/buscar", async (req, res) => {
  try {
    const query = req.query.q || "ofertas";

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto(`https://lista.mercadolivre.com.br/${query}`, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await page.waitForSelector(".ui-search-result", { timeout: 60000 });

    const produtos = await page.evaluate(() => {
      const items = document.querySelectorAll(".ui-search-result");
      const resultado = [];

      items.forEach(item => {
        const titulo = item.querySelector(".ui-search-item__title")?.innerText;
        const preco = item.querySelector(".price-tag-fraction")?.innerText;
        const link = item.querySelector("a")?.href;

        if (titulo && preco && link) {
          resultado.push({
            titulo,
            preco: parseFloat(preco.replace(".", "")),
            link
          });
        }
      });

      return resultado.slice(0, 10);
    });

    await browser.close();
    res.json(produtos);

  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
