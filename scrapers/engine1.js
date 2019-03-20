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
  try {
  const response = await axios.get(url)
  const $ = await cheerio.load(response.data)
  var list =  $(".s-result-item").map(function (i, item) {
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
          
    if (title && !productTitles.includes(title)) { 
            
            productTitles.push(title);
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
          totalFound.push(newProdcut)
          process.send(newProdcut)
          return newProdcut;
        }
    }).toArray();
    // if (totalFound.length > 10000) {
        //   await saveToDb(totalFound, '')
        //   totalFound = [];
        // }
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
      }
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
