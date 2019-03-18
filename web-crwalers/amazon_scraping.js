const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const chalk = require('chalk')
const Crawler = require("crawler");
const request = require('request');
const AffProduct = require('../models/affiliate-product');
const MAX_PRODUCTS_PER_SEARCH = 30;
let TOTAL_PRODUCTS_FOUND = 0;
const saveToDb = async (results, searchString) => {
  await Promise.all(results.map(async (prod) => {
    const prodCheck = await AffProduct.find({ title: prod.title });
    if (prodCheck.length <= 0) {
      if (prod && prod.title != '' && Number(prod.price) && prod.image != '' && prod.affiliateLink != '') {
        const newAffiliateProd = await new AffProduct({
          title: prod.title,
          price: prod.price,
          quantity: 1,
          image: prod.image,
          affiliateLink: prod.affiliateLink,
          symbol: prod.symbol,
          logo: prod.logo,
          prodLink: prod.prodLink,
          productClickRate: 0,
          rating: +prod.rating,
          relatedKeyWords: searchString
        });
        await newAffiliateProd.save();
        func(1);
      }
    } else {
      prodCheck[0].relatedKeyWords + ' ' + searchString;
      await prodCheck[0].save();
    }
  }));
}
// ? saves the products results in the json file

const scrap = async (searchString, page, priceFilter, prods, pageLimiter = 3) => {
  getRetry = 0;
  return await new Promise(async (resolve, reject) => {
    let url = `https://www.amazon.com/s?k=${searchString}&page=${page}`
    if (priceFilter === -1) {
      url = `https://www.amazon.com/s?k=${searchString}&s=price-desc-rank&qid=1552497234&ref=sr_pg_${page}`;
    } else if (priceFilter === 1) {
      url = `https://www.amazon.com/s?k=${searchString}&s=price-asc-rank&qid=1552497432&ref=sr_pg_${page}`
    }

    const outputFile = 'data.json'
    const parsedResults = []
    const pageLimit = pageLimiter;
    let pageCounter = 0
    let resultCount = 0
    let maxProducts = prods;

    console.log(chalk.yellow.bgBlue(`\n  Scraping of ${chalk.underline.bold(url)} initiated...\n`))

    const getWebsiteContent = async (url) => {
      try {
        const response = await axios.get(url)
        const $ = await cheerio.load(response.data)
        var list = await $(".s-result-item").map(function (i, item) {
          // return $(this).text();
          let rating = $('i span', item).first().text().split(' ')[0];
          // console.log(stars);

          let title = $("a .a-size-medium", item).text();
          let price = $("span .a-offscreen", item).first().text().replace(/[&\/\\#,+()$~%$'":*?<>{}]/g, "");
          let image = $("img", item).attr("src");
          let affiliateLink = 'http://adf.ly/21311553/https://www.amazon.com' + $("h5 a", item).attr("href");
          let prodLink = 'https://www.amazon.com' + $("h5 a", item).attr("href");
          if (title == '') {
            title = $("h5 a span", item).text();
          }
          if (title == '') {

          }
          if (price == '') {
            price = $(".a-color-secondary .a-color-base", item).text();
          }
          if (price == '') {
            price = $(".acs_product-price__buying", item).text();

          }
          price.replace('$', '');
          if (rating == '') {
            rating = 0;
          } else {
            rating = Number(rating);
          }
          price = price.replace(/[^\d.-]/g, "");

          const newProdcut = {
            title: title,
            price: price,
            image: image,
            affiliateLink: affiliateLink,
            symbol: "amazon",
            logo: "amazon-logo.svg",
            prodLink: prodLink,
            rating: rating
          }
          parsedResults.push(newProdcut)
          return newProdcut;
        }).toArray();
        await saveToDb(list, searchString)
        if (pageCounter >= pageLimit || maxProducts < parsedResults.length) {
          func('amazon');
          resolve('Good!')
          return false
        }
        // })
        // Pagination Elements Link
        pageCounter++;
        page++;
        let nextPageLink = `https://www.amazon.com/s?k=${searchString}&page=${page}`;
        if (priceFilter === -1) {
          nextPageLink = `https://www.amazon.com/s?k=${searchString}&s=price-desc-rank&page=${page}`;
        } else if (priceFilter === 1) {
          nextPageLink = `https://www.amazon.com/s?k=${searchString}&s=price-asc-rank&page=${page}`
        }
        console.log(chalk.cyan(`  Scraping: ${nextPageLink}`))

        if (pageCounter === pageLimit || maxProducts < parsedResults.length) {
          resolve('Good!')
          func('amazon');
          return false
        }

        getWebsiteContent(nextPageLink)
      } catch (error) {
        reject(error);
        console.error(error)
        func('amazon');
        return false;
      }
    }
    getWebsiteContent(url)
  });
}

function func(input) {
  process.send(input);
}

process.on('message', async (m) => {
  scrap(m.search, m.page, m.sortBy, m.prods, m.pageLimiter);
});
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-shard-00-00-4a0ak.mongodb.net:27017,cluster0-shard-00-01-4a0ak.mongodb.net:27017,cluster0-shard-00-02-4a0ak.mongodb.net:27017/${process.env.MONGO_DATABASE}?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true`, { server: { poolSize: 5 } });
var conn = mongoose.connection;

conn.once('open', function () {

}); 