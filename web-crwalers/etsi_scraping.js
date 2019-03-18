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

const scrap = async (searchString, page = '1', priceFilter = '1', prods = 16, pageLimiter = 3) => {
  getRetry = 0;
  return await new Promise(async (resolve, reject) => {
    let url = `https://www.etsy.com/il-en/search?q=${searchString}&ref=pagination&page=${page}`
    if (priceFilter === -1) {
      url = `https://www.etsy.com/il-en/search?q=${searchString}&explicit=1&order=price_desc&ref=pagination&page=${page}`;
    } else if (priceFilter === 1) {
      url = `https://www.etsy.com/il-en/search?q=${searchString}&explicit=1&order=price_asc&ref=pagination&page=${page}`
    }

    const outputFile = 'data.json'
    const parsedResults = []
    const pageLimit = pageLimiter;
    let pageCounter = 0
    let resultCount = 0

    console.log(chalk.yellow.bgBlue(`\n  Scraping of ${chalk.underline.bold(url)} initiated...\n`))

    const getWebsiteContent = async (url) => {
      try {
        const response = await axios.get(url)
        const $ = await cheerio.load(response.data)
        var list = await $(".block-grid-item").map(function (i, item) {
          let rating = $("span .screen-reader-only", item).text();
          if (rating) {
            rating = rating.split(' ')[0];
          }
          if (!Number(rating)) {
            rating = 0;
          } else {
            rating = +rating;
          }
          let title = $("div h2", item).first().text().trim();
          let price = $("span .currency-value", item).first().text();
          let image = $(".height-placeholder img", item).attr('src');
          let affiliateLink = 'http://adf.ly/21311553/' + $("div .listing-link", item).attr('href');
          let prodLink = $("div .listing-link", item).attr('href');
          if (price.match(',')) {
            price = price.replace('.', ',');
            const t = price.split(',')[0];
            const h = price.split(',')[1];
            price = +(t * 1000) + +h;
          }

          const newProdcut = {
            title: title,
            price: price,
            image: image,
            affiliateLink: affiliateLink,
            symbol: "etsy",
            logo: "etsy-logo.svg",
            prodLink: prodLink,
            rating: rating
          }
          parsedResults.push(newProdcut)
          return newProdcut;
        }).toArray();
        // const title = $('h1').text();
        await saveToDb(list, searchString);
        // })
        // Pagination Elements Link
        pageCounter++
        page++
        let nextPageLink = `https://www.etsy.com/il-en/search?q=${searchString}&ref=pagination&page=${page}`
        if (priceFilter === -1) {
          nextPageLink = `https://www.etsy.com/il-en/search?q=${searchString}&explicit=1&order=price_desc&ref=pagination&page=${page}`;
        } else if (priceFilter === 1) {
          nextPageLink = `https://www.etsy.com/il-en/search?q=${searchString}&explicit=1&order=price_asc&ref=pagination&page=${page}`
        }
        console.log(chalk.cyan(`  Scraping: ${nextPageLink}`))

        if (pageCounter >= pageLimit || prods < parsedResults.length) {
          resolve('Good!')
          func('etsi');

          return false
        }

        getWebsiteContent(nextPageLink)
      } catch (error) {
        reject(error)
        console.error(error)
        func('etsi');
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