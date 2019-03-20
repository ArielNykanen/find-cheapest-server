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
        var list = $(".s-item").map(function (i, item) {
          let rating = $(".b-starrating__star .clipped", item).first().text();
          if (rating) {
            rating = rating.split(' ')[0];
          }
          if (!Number(rating)) {
            rating = 0;
          } else {
            rating = +rating;
          }
          let title = $("a h3", item).first().text();
          let price = $(".s-item__price span", item).first().text();
          if (price.match('to')) {
            price = $(".s-item__detail", item).first('span').text();
            price = price.split('to')[0]
          }
          let image = $(".s-item__image-wrapper img", item).attr('src');
          let affiliateLink = 'http://adf.ly/21311553/' + $(".s-item__image a", item).attr('href');
          let prodLink = $(".s-item__image a", item).attr('href');
          if (!image.match('.gif')) {
            price = price.replace(/[^\d.-]/g, "");

            const newProdcut = {
              title: title,
              price: price,
              image: image,
              affiliateLink: affiliateLink,
              symbol: "ebay",
              logo: "ebay-logo.svg",
              prodLink: prodLink,
              rating: rating
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















