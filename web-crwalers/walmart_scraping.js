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
        const a = await newAffiliateProd.save();
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

  return await new Promise(async (resolve, reject) => {
    const outputFile = 'data.json'
    const parsedResults = []
    const pageLimit = pageLimiter;
    let pageCounter = 0
    let resultCount = 0
    let maxProducts = prods;
    
    let url = `https://www.walmart.com/search/?cat_id=0&page=${page}&query=${searchString}#searchProductResult`;
    if (priceFilter === -1) {
      url = `https://www.walmart.com/search/?cat_id=0&page=${page}&query=${searchString}&sort=price_high#searchProductResult`;
    } else if (priceFilter === 1) {
      url = `https://www.walmart.com/search/?cat_id=0&page=${page}&query=${searchString}&sort=price_low#searchProductResult`
    }
    console.log(chalk.yellow.bgBlue(`\n  Scraping of ${chalk.underline.bold(url)} initiated...\n`))

    const getWebsiteContent = async (url) => {
      try {
        const response = await axios.get(url)
        const $ = await cheerio.load(response.data)
        var list = await $(".s-result-item").map(function (i, item) {
          // return $(this).text();
          let rating = $(".stars-container", item).attr('alt');
          if (rating) {
            rating = rating.split(' ')[2];
          }
          if (!Number(rating)) {
            rating = 0;
          } else {
            rating = +rating;
          }
          let title = $("div .visuallyhidden", item).first().text();

          let price = $(".price-group .price-characteristic", item).first().text() + $(".price-group .price-mark", item).first().text() + $(".price-group .price-mantissa", item).first().text();;
          let image = $(".search-result-productimage").find('img').attr('src');
          let affiliateLink = 'http://adf.ly/21311553/https://www.walmart.com' + $(".search-result-productimage").find('a').attr('href');
          let prodLink = 'https://www.walmart.com' + $(".search-result-productimage").find('a').attr('href');
          price.replace('$', '');
          price = price.replace(/[^\d.-]/g, "");
          if (title != '' && Number(price) && image != '') {
            const newProdcut = {
              title: title,
              price: price,
              image: image,
              affiliateLink: affiliateLink,
              symbol: "walmart",
              logo: "walmart-logo.svg",
              prodLink: prodLink,
              rating: rating
            }
            parsedResults.push(newProdcut);
            return newProdcut;
          }
        }).toArray();
        if (list.length <= 0) {
          var list = await $(".Grid-col").map(function (i, item) {
            // return $(this).text();
            let rating = $(".stars-container", item).attr('alt');
            if (rating) {
              rating = rating.split(' ')[2];
            }
            if (!Number(rating)) {
              rating = 0;
            } else {
              rating = +rating;
            }
            let title = $(".product-title-link span", item).first().text();
            let price = $(".price-group .price-characteristic", item).first().text() + $(".price-group .price-mark", item).first().text() + $(".price-group .price-mantissa", item).first().text();
            let image = $(".search-result-productimage").find('img').attr('src');
            let affiliateLink = 'http://adf.ly/21311553/https://www.walmart.com' + $(".search-result-productimage").find('a').attr('href');
            let prodLink = 'https://www.walmart.com' + $(".search-result-productimage").find('a').attr('href');
            price.replace('$', '');
            price = price.replace(/[^\d.-]/g, "");
            if (title != '' && Number(price) && image != '') {
              const newProdcut = {
                title: title,
                price: price,
                image: image,
                affiliateLink: affiliateLink,
                symbol: "walmart",
                logo: "walmart-logo.svg",
                rating: rating,
                prodLink: prodLink
              }
              parsedResults.push(newProdcut);
              return newProdcut;
            }
          }).toArray();
        }

        // const title = $('h1').text();
        await saveToDb(list, searchString)
        // })
        // Pagination Elements Link
        pageCounter++;
        page++;
        let nextPageLink = `https://www.walmart.com/search/?cat_id=0&page=${page}&query=${searchString}#searchProductResult`;
        if (priceFilter === -1) {
          nextPageLink = `https://www.walmart.com/search/?cat_id=0&page=${page}&query=${searchString}&sort=price_high#searchProductResult`;
        } else if (priceFilter === 1) {
          nextPageLink = `https://www.walmart.com/search/?cat_id=0&page=${page}&query=${searchString}&sort=price_low#searchProductResult`
        }
        console.log(chalk.cyan(`  Scraping: ${nextPageLink}`))

        if (pageCounter >= pageLimit || maxProducts < parsedResults) {
          resolve('Good!')
          func('walmart');
          return false
        }

        getWebsiteContent(nextPageLink)
      } catch (error) {
        console.error(error)
        func('walmart');
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