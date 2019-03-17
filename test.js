const Crawler = require("crawler");
const request = require('request');
const cheerio = require('cheerio');
const AffProduct = require('./models/affiliate-product');

const saveProd = async (prodId, prod) => {
  const product = await AffProduct.findById(prodId);

      if (prod.title != '' && prod.price != '' && prod.image != '' && prod.affiliateLink != '') {
        // prod.price = prod.price.replace(/[^\d.-]/g, "");
       await product.update({
          title: prod.title,
          price: prod.price,
          quantity: 1,
          image: prod.image,
          affiliateLink: prod.affiliateLink,
          symbol: prod.symbol,
          logo: prod.logo,
          prodLink: prod.prodLink,
          productClickRate: 0,
          rating: +prod.rating
        })
      }
}

const dotenv = require('dotenv');
dotenv.config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const csrf = require('csurf');
const bodyParser = require('body-parser');
const graphQlHttp = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolvers = require('./graphql/resolvers');
const app = express();
const MONGODB_URI = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-shard-00-00-4a0ak.mongodb.net:27017,cluster0-shard-00-01-4a0ak.mongodb.net:27017,cluster0-shard-00-02-4a0ak.mongodb.net:27017/${process.env.MONGO_DATABASE}?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true`;
const auth = require('./middleware/auth');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
// const https = require('https');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header("Access-Control-Allow-Headers", 'Authorization, Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
// const csrfProtection = csrf();
// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'),
  { flags: 'a' }
);
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // application/json

const uploadRoutes = require('./routes/uploads');

// app.use(cors());
app.use('/upload', uploadRoutes);
// app.use(session({
//   secret: 'my secret',
//   resave: false,
//   saveUninitialized: false,
// }));
app.use(auth);
// csrf protection middleware
// app.use(csrfProtection);
// app.use((req, res, next) => {
//   res.locals.csrfToken = req.csrfToken();
//   next();
// });


app.use('/graphql', graphQlHttp({
  schema: graphqlSchema,
  graphiql: true,
  formatError(err) {
    if (!err.originalError) {
      return err;
    }

    const data = err.originalError.data;
    const message = err.message || 'An error occurred.'
    const code = err.originalError.code || 500;
    return { message: message, status: code, data: data }
  }
}))

app.use(express.static(__dirname + '/uploads/images/banners'));
app.use(express.static(__dirname + '/uploads/images/image-placeholders'));
app.use(express.static(__dirname + '/uploads/images/products'));
app.use(express.static(__dirname + '/uploads/images/categories'));
app.use(express.static(__dirname + '/uploads/images/companylogos'));
const datetime = require('node-datetime');
const Visits = require('./models/visit-tracker');
const PORT = 3303;
mongoose.connect(MONGODB_URI, { useMongoClient: true })
  .then(result => {
    const server = app.listen(PORT);
    console.log("App is running on port " + PORT);
    const scanUpdateAmazon = async () => {
    let miliSecs = 0;
    const timer = setInterval(() => {
      miliSecs += 0.10;
    }, 100);
    const allProducts = await AffProduct.find({symbol: 'amazon'});
    let res;
  if (allProducts.length > 0) {
    res = await  await Promise.all(allProducts.map(async (prod) => {
      // const element = prod;
      return await new Promise(async (resolve, reject) => {
        // allProducts.forEach(prod => {
        var c = new Crawler({
          maxConnections: 10,
          // This will be called for each crawled page
          callback: async function (error, res, done) {
            if (error) {
              
            } else {
              var $ = await res.$;
              let title = await $("#productTitle").text().trim();
              let price = await $("#priceblock_ourprice").text().trim();
              let rating = await $('i span').first().text();
              if (title === '') {
                title = prod.title;
              }
              if (title !== '') {
                prod.title = title;
              }
              if (price) {
                price = price.replace('$', '');
                if (Number(price)) {
                  price = +price;
                  prod.price = price;
                } else {
                  
                  price = price.split(' ')[0];
                  if (!Number(price)) {
                    price = prod.price;
                  }
                }
              } else {
                price = prod.price;
              }
              
              if (rating) {
                rating = rating.split(' ')[0];
                if (Number(rating)) {
                  rating = +rating;
                  prod.rating = rating;
                } else {
                  rating = 0;
                  prod.rating = rating;
                }
              } else {
                rating = prod.rating;
              }
              
              const newProdcut = {
                title: title,
                price: price,
                image: prod.image,
                affiliateLink: prod.affiliateLink,
                symbol: "amazon",
                logo: "amazon-logo.svg",
                prodLink: prod.prodLink,
                rating: rating
              }
              if (newProdcut.price === '' || !Number(newProdcut.price)) {
                newProdcut.price = await $("div .price-large").first().text().trim();
                
                console.log(newProdcut);
              }
              if (newProdcut.title === '') {
                console.log(newProdcut);
              }
              if (newProdcut.image === '') {
                console.log(newProdcut);
              }
              if (newProdcut.affiliateLink === '') {
                console.log(newProdcut);
              }
              if (newProdcut.symbol === '') {
                console.log(newProdcut);
              }
              if (newProdcut.logo === '') {
                console.log(newProdcut);
              }
              if (newProdcut.prodLink === '') {
                console.log(newProdcut);
              }
              if (newProdcut.rating === '') {
                console.log(newProdcut);
              }
              done(newProdcut);
              resolve(newProdcut);
              // }).toArray();
              await saveProd(prod.id, newProdcut);
            }
          }
        });
        c.queue(prod.prodLink);
      });
    }));
    clearInterval(timer);
    console.log('Amazon products scan and update took ' + (miliSecs).toFixed(2) + '\'s');
    miliSecs = 0;
    
    console.log(res.length);
    scanUpdateAmazon();
  }
  }  
    const scanUpdateEbay = async () => {
    let miliSecs = 0;
    const timer = setInterval(() => {
      miliSecs += 0.10;
    }, 100);
    const allProducts = await AffProduct.find({symbol: 'ebay'});
    let res;
  if (allProducts.length > 0) {
    res = await  await Promise.all(allProducts.map(async (prod) => {
      // const element = prod;
      return await new Promise(async (resolve, reject) => {
        // allProducts.forEach(prod => {
        var c = new Crawler({
          maxConnections: 10,
          // This will be called for each crawled page
          callback: async function (error, res, done) {
            if (error) {
              
            } else {
              var $ = await res.$;
              let title = await $("#itemTitle").text().trim();
              let price = await $("#prcIsum").text().trim();
              let rating = prod.rating;
              if (title !== '') {
                title = title.split('about')[1].trim();
                prod.title = title;
              }
              if (price !== '') {
                price = price.split(' ')[1].replace('$', '');
                if (Number(price)) {
                  prod.price = price;
                } else {
                  price = +prod.price;
                }
              } else {
                price = +prod.price;
              }
              const newProdcut = {
                title: title,
                price: price,
                image: prod.image,
                affiliateLink: prod.affiliateLink,
                symbol: "ebay",
                logo: "ebay-logo.svg",
                prodLink: prod.prodLink,
                rating: rating
              }
              if (newProdcut.price === '' || !Number(newProdcut.price)) {
                newProdcut.price = await $("div .price-large").first().text().trim();
                
                console.log(newProdcut);
              }
              if (newProdcut.title === '') {
                console.log(newProdcut);
              }
              if (newProdcut.image === '') {
                console.log(newProdcut);
              }
              if (newProdcut.affiliateLink === '') {
                console.log(newProdcut);
              }
              if (newProdcut.symbol === '') {
                console.log(newProdcut);
              }
              if (newProdcut.logo === '') {
                console.log(newProdcut);
              }
              if (newProdcut.prodLink === '') {
                console.log(newProdcut);
              }
              if (newProdcut.rating === '') {
                console.log(newProdcut);
              }
              done(newProdcut);
              resolve(newProdcut);
              await saveProd(prod.id, newProdcut);
            }
          }
        });
        c.queue(prod.prodLink);
      });
    }));
    clearInterval(timer);
    console.log('Ebay products scan and update took ' + (miliSecs).toFixed(2) + '\'s');
    miliSecs = 0;
    
    console.log(res.length);
    scanUpdateEbay();
  }
  }  
    
    const scanUpdateEtsy = async () => {
    let miliSecs = 0;
    const timer = setInterval(() => {
      miliSecs += 0.10;
    }, 100);
    const allProducts = await AffProduct.find({symbol: 'etsy'});
    let res;
  if (allProducts.length > 0) {
    res = await  await Promise.all(allProducts.map(async (prod) => {
      // const element = prod;
      return await new Promise(async (resolve, reject) => {
        // allProducts.forEach(prod => {
        var c = new Crawler({
          maxConnections: 10,
          // This will be called for each crawled page
          callback: async function (error, res, done) {
            if (error) {
              
            } else {
              var $ = await res.$;
              let price = await $("div .text-largest").text().trim();
              let rating = await $("span .screen-reader-only").text().trim();
              if (price !== '') {
                price = price.replace('$', '');
                price = price.replace('+', '');
                if (Number(price)) {
                  prod.price = price;
                } else {
                  price = +prod.price;
                }
              } else {
                price = +prod.price;
              }
              if (rating !== '') {
                rating = rating.split('out')[0];
                if (!Number(rating)) {
                  rating = prod.rating;
                } else {
                  prod.rating = rating;
                }
              } else {
                prod.rating = rating;
              }
              
              
              const newProdcut = {
                title: prod.title,
                price: price,
                image: prod.image,
                affiliateLink: prod.affiliateLink,
                symbol: "etsy",
                logo: "etsy-logo.svg",
                prodLink: prod.prodLink,
                rating: rating
              }
              if (newProdcut.price === '' || !Number(newProdcut.price)) {
                newProdcut.price = await $("div .price-large").first().text().trim();
                
                console.log(newProdcut);
              }
              if (newProdcut.title === '') {
                console.log(newProdcut);
              }
              if (newProdcut.image === '') {
                console.log(newProdcut);
              }
              if (newProdcut.affiliateLink === '') {
                console.log(newProdcut);
              }
              if (newProdcut.symbol === '') {
                console.log(newProdcut);
              }
              if (newProdcut.logo === '') {
                console.log(newProdcut);
              }
              if (newProdcut.prodLink === '') {
                console.log(newProdcut);
              }
              if (newProdcut.rating === '') {
                console.log(newProdcut);
              }
              done(newProdcut);
              resolve(newProdcut);
              await saveProd(prod.id, newProdcut);
            }
          }
        });
        c.queue(prod.prodLink);
      });
    }));
    clearInterval(timer);
    console.log('Etsy products scan and update took ' + (miliSecs).toFixed(2) + '\'s');
    miliSecs = 0;
    
    console.log(res.length);
    scanUpdateEtsy();
  }
  }  
    const scanUpdateWalmart = async () => {
    let miliSecs = 0;
    const timer = setInterval(() => {
      miliSecs += 0.10;
    }, 100);
    const allProducts = await AffProduct.find({symbol: 'walmart'});
    let res;
  if (allProducts.length > 0) {
    res = await  await Promise.all(allProducts.map(async (prod) => {
      // const element = prod;
      return await new Promise(async (resolve, reject) => {
        // allProducts.forEach(prod => {
        var c = new Crawler({
          maxConnections: 10,
          // This will be called for each crawled page
          callback: async function (error, res, done) {
            if (error) {
              
            } else {
              var $ = await res.$;
              let price = await $("span .price-group").text().trim();
              let rating = await $(".stars-container").attr("alt");
              if (rating !== '') {
                rating = rating.split('out')[0].split(' ')[2];
                if (!Number(rating)) {
                  rating = +prod.rating;
                } else {
                  prod.rating = rating;
                }
              } else {
                rating = prod.rating;
              }
              if (price !== '') {
                price = price.split('$')[1];
                if (!Number(price)) {
                  price = prod.price;
                } else {
                  prod.price = price;
                }
              } else {
                price = prod.price;
              }
              
              const newProdcut = {
                title: prod.title,
                price: price,
                image: prod.image,
                affiliateLink: prod.affiliateLink,
                symbol: "walmart",
                logo: "walmart-logo.svg",
                prodLink: prod.prodLink,
                rating: rating
              }
              if (newProdcut.price === '' || !Number(newProdcut.price)) {
                newProdcut.price = await $("div .price-large").first().text().trim();
                
                console.log(newProdcut);
              }
              if (newProdcut.title === '') {
                console.log(newProdcut);
              }
              if (newProdcut.image === '') {
                console.log(newProdcut);
              }
              if (newProdcut.affiliateLink === '') {
                console.log(newProdcut);
              }
              if (newProdcut.symbol === '') {
                console.log(newProdcut);
              }
              if (newProdcut.logo === '') {
                console.log(newProdcut);
              }
              if (newProdcut.prodLink === '') {
                console.log(newProdcut);
              }
              if (newProdcut.rating === '') {
                console.log(newProdcut);
              }
              done(newProdcut);
              resolve(newProdcut);
              await saveProd(prod.id, newProdcut);
            }
          }
        });
        c.queue(prod.prodLink);
      });
    }));
    clearInterval(timer);
    console.log('Walmart products scan and update took ' + (miliSecs).toFixed(2) + '\'s');
    miliSecs = 0;
    
    console.log(res.length);
    scanUpdateWalmart();
  }
  }  



    scanUpdateAmazon();
    scanUpdateEbay();
    scanUpdateEtsy();
    scanUpdateWalmart();
  }).catch(err => {
  console.log(err);
})

