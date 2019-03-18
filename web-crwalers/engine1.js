const axios = require('axios')
const cheerio = require('cheerio')
const chalk = require('chalk')
const AffProduct = require('../models/affiliate-product');
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
      func(1);
    }
  }));
}
// ? saves the products results in the json file

const scrapEtsy = async (searchString, page, priceFilter, prods, pageLimiter = 3) => {
  getRetry = 0;

  let url = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_pgn=${page}`;
  if (priceFilter === -1) {
    url = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=16&_pgn=${page}`;
  } else if (priceFilter === 1) {
    url = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=15&_pgn=${page}`;
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
          parsedResults.push(newProdcut)
          return newProdcut;
        }
      }).toArray();
      saveToDb(list, searchString)
      if (pageCounter >= pageLimit || maxProducts < parsedResults) {
        func('ended!');
       
        return false
      }
      // })
      // Pagination Elements Link
      pageCounter++;
      page++;
      let nextPageLink = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_pgn=${page}`;
      if (priceFilter === -1) {
        nextPageLink = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=16&_pgn=${page}`;
      } else if (priceFilter === 1) {
        nextPageLink = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=15&_pgn=${page}`;
      }
      console.log(chalk.cyan(`  Scraping: ${nextPageLink}`))

      if (pageCounter === pageLimit || maxProducts < parsedResults) {
        func('ended!');
       
        return false
      }

      getWebsiteContent(nextPageLink)
    } catch (error) {
      func('ended!');
      
      console.error(error)
      return false;
    }
  }
  getWebsiteContent(url)
}


const scrapEbay = async (searchString, page, priceFilter, prods, pageLimiter = 3) => {
  getRetry = 0;

  let url = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_pgn=${page}`;
  if (priceFilter === -1) {
    url = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=16&_pgn=${page}`;
  } else if (priceFilter === 1) {
    url = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=15&_pgn=${page}`;
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
          parsedResults.push(newProdcut)
          return newProdcut;
        }
      }).toArray();
      saveToDb(list, searchString)
      if (pageCounter >= pageLimit || maxProducts < parsedResults) {
        func('ended!');
       
        return false
      }
      // })
      // Pagination Elements Link
      pageCounter++;
      page++;
      let nextPageLink = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_pgn=${page}`;
      if (priceFilter === -1) {
        nextPageLink = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=16&_pgn=${page}`;
      } else if (priceFilter === 1) {
        nextPageLink = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${searchString}&_sacat=0&_sop=15&_pgn=${page}`;
      }
      console.log(chalk.cyan(`  Scraping: ${nextPageLink}`))

      if (pageCounter === pageLimit || maxProducts < parsedResults) {
        func('ended!');
       
        return false
      }

      getWebsiteContent(nextPageLink)
    } catch (error) {
      func('ended!');
      
      console.error(error)
      return false;
    }
  }
  getWebsiteContent(url)
}


const scrapAmazon = async (searchString, page, priceFilter, prods, pageLimiter = 3) => {
  getRetry = 0;

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
      var list = $(".s-result-item").map(function (i, item) {
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
      saveToDb(list, searchString)
      if (pageCounter >= pageLimit || maxProducts < parsedResults) {
        func('ended!');
       
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

      if (pageCounter === pageLimit || maxProducts < parsedResults) {
        func('ended!');
       
        return false
      }

      getWebsiteContent(nextPageLink)
    } catch (error) {
      func('ended!');
      
      console.error(error)
      return false;
    }
  }
  getWebsiteContent(url)
}

const scrapWalmart = async (searchString, page, priceFilter, prods, pageLimiter = 3) => {


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
      var list = $(".s-result-item").map(function (i, item) {
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
        var list = $(".Grid-col").map(function (i, item) {
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
      saveToDb(list, searchString)
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
        func('ended!');
       
        return false
      }

      getWebsiteContent(nextPageLink)
    } catch (error) {
      func('ended!');
      console.error(error)
      return false;
    }
  }
  getWebsiteContent(url)

}





function func(input) {
  process.send(input);
}










process.on('message', async (m) => {
  await scrapEtsy(m.search, m.page, m.sortBy, m.prods, m.pageLimiter);
  await scrapEbay(m.search, m.page, m.sortBy, m.prods, m.pageLimiter);
  await scrapAmazon(m.search, m.page, m.sortBy, m.prods, m.pageLimiter);
  await scrapWalmart(m.search, m.page, m.sortBy, m.prods, m.pageLimiter);
});

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-shard-00-00-4a0ak.mongodb.net:27017,cluster0-shard-00-01-4a0ak.mongodb.net:27017,cluster0-shard-00-02-4a0ak.mongodb.net:27017/${process.env.MONGO_DATABASE}?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true`, { server: { poolSize: 5 } });
var conn = mongoose.connection;

conn.once('open', function () {

}); 
