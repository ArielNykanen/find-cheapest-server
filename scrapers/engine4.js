const Crawler = require("crawler");
const dotenv = require('dotenv');
const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const chalk = require('chalk')
const request = require('request');
const CP = require('../models/crawledPages');



let obselete = []; // Array of what was crawled already
let productTitles = []; // Array of what was crawled already
const cp = CP.find().then(res => {
  obselete = obselete.concat(obselete, res[0].crawledPages);
  productTitles = productTitles.concat(productTitles, res[0].crawledPages);
});
// Array of what was crawled already

const addUrl = async (urls) => {
  const cpp = await CP.find()

  await cpp[0].update(
    { "$push": { "crawledPages": urls } },
  );
  await cpp[0].save();
}


let c = new Crawler();
let totalProducts = 0;
let totalFound = [];

async function crawlAllUrls(url, mainUrl) {
  // console.log(`Crawling ${url}`);
  c.queue({
    uri: url,
    callback: async function (err, res, done) {
      if (err) throw err;
      let $ = res.$;
      if (res) {
        var list =  $(".Grid-col").map(function (i, item) {
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
            process.send(newProdcut)

            return newProdcut;
          }
        }).toArray();
        // if (totalFound.length > 10000) {
        //   await saveToDb(totalFound, '')
        //   totalFound = [];
        // }
      }
      try {
        let urls = $("a");
        Object.keys(urls).forEach((item) => {
          if (urls[item].type === 'tag') {
            let href = urls[item].attribs.href;
            if (href && !obselete.includes(href)) {
              href = href.trim();
              obselete.push(href);
              // addUrl(href);
              // Slow down the
              setTimeout(function () {
                href.startsWith(mainUrl) ? crawlAllUrls(href, mainUrl) : crawlAllUrls(`${url}${href}`) // The latter might need extra code to test if its the same site and it is a full domain with no URI
              }, 10000)
            }
          }
        });
      } catch (e) {
        console.error(`Encountered an error crawling ${url}. Aborting crawl.`);
        done()
      }
      done();
    }
  })
}

process.on('message', async (m) => {
  crawlAllUrls(m.url, m.mainUrl);
});

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect(`mongodb://127.0.0.1:27017`, { server: { poolSize: 5 } });
var conn = mongoose.connection;

conn.once('open', function () {

});










