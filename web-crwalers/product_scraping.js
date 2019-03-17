const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const chalk = require('chalk')
const Crawler = require("crawler");
const request = require('request');
const AffProduct = require('../models/affiliate-product');
const MAX_PRODUCTS_PER_SEARCH = 30;
let TOTAL_PRODUCTS_FOUND = 0;


// ? saves the products results in the json file
const saveToDb = async (results, searchString) => {
  await Promise.all(results.map(async (prod) => {
    const prodCheck = await AffProduct.find({ title: prod.title });
    if (prodCheck.length <= 0) {
      console.log(prod);
      
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
        TOTAL_PRODUCTS_FOUND++;
        console.log('Total Products Found = ' + TOTAL_PRODUCTS_FOUND);
        
      }
    } else {
      prodCheck[0].relatedKeyWords + ' ' + searchString;
      await prodCheck[0].save();
    }
  }));
}
// const getTargetResults = async (searchString, page) => {
//   return await new Promise(async (resolve, reject) => {

//     var c = new Crawler({
//       maxConnections: 10,
//       // This will be called for each crawled page
//       callback: async function (error, res, done) {
//         if (error) {
//           console.log(error);
//         } else {
//           var $ = await res.$;
//           let body = $('body').text();
//           console.log(body);
//           console.log(2323);


//           var list = await $(".h-padding-a-none").map(function (i, item) {

//             let title = $(".jvxzGg", item).text();
//             // let price = $("span .currency-value", item).first().text();
//             // let image = $(".height-placeholder img", item).attr('src');
//             // let affiliateLink = 'http://adf.ly/21311553/' + $("div .listing-link", item).attr('href');
//             // let prodLink = $("div .listing-link", item).attr('href');
//               const newProdcut = {
//                 title: title,
//                 // price: price,
//                 // image: image,
//                 // affiliateLink: affiliateLink,
//                 symbol: "target",
//                 logo: "target-logo.svg",
//                 // prodLink: prodLink
//               }
//               return newProdcut;
//           }).toArray();
//           // await saveToDb(list);
//           console.log('etsy scraping finished and saving data finished');
//         }
//         console.log(list);

//         resolve(list);
//         done(list);
//       }
//     });
//     // c.queue(`https://www.etsy.com/search?q=${searchString}&ref=pagination&page=${page}`);
//     let currentPage = 0;
//     if (page > 1) {
//       currentPage = (page - 1 ) * 24;
//     }
//     c.queue(`https://www.target.com/s?searchTerm=${searchString}&Nao=0`);
//   });
// }









const getEtsiResults = async (searchString, page, priceFilter, prods) => {
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
    const pageLimit = 30
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
        const nextPageLink = $('.clearfix').find('.list-unstyled').find('.is-selected').next().find('a').attr('href')
        console.log(chalk.cyan(`  Scraping: ${nextPageLink}`))
        pageCounter++

        if (pageCounter === pageLimit || TOTAL_PRODUCTS_FOUND >= MAX_PRODUCTS_PER_SEARCH) {
          await saveToDb(parsedResults);
          resolve('Good!')
          return false
        }

        getWebsiteContent(nextPageLink)
      } catch (error) {
        await saveToDb(parsedResults);
        reject(error)
        console.error(error)
      }
    }
    getWebsiteContent(url)
  });
}


const getAmazonResults = async (searchString, page, priceFilter, prods, searchAlot = false) => {
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
    const pageLimit = 30
    let pageCounter = 0
    let resultCount = 0
    let maxProducts = prods;
    if (searchAlot) {
      maxProducts = 60;
    }

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
        if (list.length > 0 || TOTAL_PRODUCTS_FOUND >= MAX_PRODUCTS_PER_SEARCH) {
          resolve('Good');
          return false;
        }
        // })
        // Pagination Elements Link
        const nextPageLink = $('.a-pagination').find('.a-selected').next().find('a').attr('href');
        console.log(chalk.cyan(`  Scraping: ${nextPageLink}`))
        pageCounter++

        if (pageCounter === pageLimit) {
          resolve('Good!')
          return false
        }

        getWebsiteContent(nextPageLink)
      } catch (error) {
        reject(error);
        console.error(error)
      }
    }
    getWebsiteContent(url)
  });
}













const getWalmartResults = async (searchString, page, priceFilter, prods, searchAlot = false) => {
  
  return await new Promise(async (resolve, reject) => {
    const outputFile = 'data.json'
    const parsedResults = []
    const pageLimit = 10
    let pageCounter = 0
    let resultCount = 0
    let maxProducts = prods;
    if (searchAlot) {
      maxProducts = 32;
    }
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
        pageCounter++
        const nextPageLink = url.split('page')[0] + 'page=' + pageCounter + `&query=${searchString}#searchProductResult`;
        console.log(chalk.cyan(`  Scraping: ${nextPageLink}`))

        if (pageCounter === pageLimit || TOTAL_PRODUCTS_FOUND >= MAX_PRODUCTS_PER_SEARCH) {
          resolve('Good!')
          return false
        }

        getWebsiteContent(nextPageLink)
      } catch (error) {
        console.error(error)
      }
    }
    getWebsiteContent(url)
  });

}

const getEbayResults = async (searchString, page, priceFilter, retries, prods) => {
  return await new Promise(async (resolve, reject) => {
    getRetry = 0;
    totalFound = 0;
    var c = new Crawler({
      maxConnections: 10,
      // This will be called for each crawled page
      callback: async function (error, res, done) {
        if (error) {
          reject(error)
        } else {
          var $ = res.$;
          var list = await $(".s-item").map(function (i, item) {
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
              return newProdcut;
            }
          }).toArray();
          totalFound += list.length;
        }

        if (totalFound <= prods && getRetry <= retries) {
          getRetry++;
          page++;
          if (priceFilter === -1) {
            c.queue(`https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=16&_pgn=${page}`,
              {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.229.28.185 Safari/537.36'
              },
            );
          } else if (priceFilter === 1) {
            c.queue(`https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=15&_pgn=${page}`,
              {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.229.28.185 Safari/537.36'
              },
            );
          } else {
            c.queue(`https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_pgn=${page}`,
              {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.229.28.185 Safari/537.36'
              },
            );
          }
        } else {
          console.log('Ebay products found ' + totalFound);
          await saveToDb(list, searchString);
          resolve(list);
          done(list);
        }
      }
    });
    if (priceFilter === -1) {
      c.queue(`https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=16&_pgn=${page}`,
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.229.28.185 Safari/537.36'
        },
      );
      c.queue(`https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=16&_pgn=${page + 1}`,
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.229.28.185 Safari/537.36'
        },
      );
      c.queue(`https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=16&_pgn=${page + 2}`,
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.229.28.185 Safari/537.36'
        },
      );
      c.queue(`https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=16&_pgn=${page + 3}`,
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.229.28.185 Safari/537.36'
        },
      );
    } else if (priceFilter === 1) {
      c.queue(`https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=15&_pgn=${page}`,
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.229.28.185 Safari/537.36'
        },
      );
      c.queue(`https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=15&_pgn=${page + 1}`,
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.229.28.185 Safari/537.36'
        },
      );
      c.queue(`https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=15&_pgn=${page + 2}`,
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.229.28.185 Safari/537.36'
        },
      );
      c.queue(`https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=15&_pgn=${page + 3}`,
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.229.28.185 Safari/537.36'
        },
      );
    } else {
      c.queue(`https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_pgn=${page}`,
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.229.28.185 Safari/537.36'
        },
      );
      c.queue(`https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_pgn=${page + 1}`,
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.229.28.185 Safari/537.36'
        },
      );
      c.queue(`https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_pgn=${page + 2}`,
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.229.28.185 Safari/537.36'
        },
      );
      c.queue(`https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_pgn=${page + 3}`,
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.229.28.185 Safari/537.36'
        },
      );
    }
  });
}
// last store needs to be in await mode for saving products


exports.getSearchResults = {
  etsy: getEtsiResults,
  amazon: getAmazonResults,
  walmart: getWalmartResults,
  ebay: getEbayResults,
  // target: getTargetResults,
}