const fork = require('child_process').fork;
const path = require('path');
const program1 = path.resolve('./scrapers/engine1.js');
const program2 = path.resolve('./scrapers/engine2.js');
const program3 = path.resolve('./scrapers/engine3.js');
const program4 = path.resolve('./scrapers/engine4.js');
const AffProduct = require('./models/affiliate-product');
const CP = require('./models/crawledPages');
const addProdTitle = async (title) => {
  const cpp = await CP.find()
  await cpp[0].update(
    { "$push": { "prodTitles": title } },
  );
  cpp[0].save();
}

const chalk = require('chalk')
const Cp = require('./models/crawledPages');

let place = 0;


const start = async () => {
  let totalProducts = [];
  let totalSaved = 0;
  let searchKeyArr = require('./searchKeywords.json');
  // const aa = await new Cp({
  //   crawledPages: []
  // })
  // await aa.save();
const saveToDb = async (results, searchString = '') => {
  return await Promise.all(results.map(async (prod) => {
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
        addProdTitle(prod.title);
        totalSaved++;
      }
  }));
}












  MAX_PER_SCRAP = 100000;
  let engineStopped = 0;
  let totalFound = 0;

  place++;
  let searchKey = await searchKeyArr[place]
  if (!searchKey) {
    place = 0;
    start();
  }
  let url1 = {
    url: `https://www.amazon.com/s?k=${searchKey}&ref=nb_sb_noss_2`,
    mainUrl: `https://www.amazon.com/`,
  };
  let url2 = {
    url: `https://www.ebay.com/sch/i.html?_from=R40&_trksid=m570.l1313&_nkw=${searchKey}&_sacat=0`,
    mainUrl: `https://www.ebay.com/`,
  };
  let url3 = {
    url: `https://www.etsy.com/il-en/search?q=${searchKey}`,
    mainUrl: `https://www.etsy.com/`,
  };
  let url4 = {
    url: `https://www.walmart.com/search/?cat_id=0&query=${searchKey}`,
    mainUrl: `https://www.walmart.com/`,
  };
          
  
  const generateNewSearch = async () => {
    place++;
    let searchKey = await searchKeyArr[place]
    if (!searchKey) {
      place = 0;
      start();
    }
    url1 = {
      url: `https://www.amazon.com/s?k=${searchKey}&ref=nb_sb_noss_2`,
      mainUrl: `https://www.amazon.com/`,
    };
    url2 = {
      url: `https://www.ebay.com/sch/i.html?_from=R40&_trksid=m570.l1313&_nkw=${searchKey}&_sacat=0`,
      mainUrl: `https://www.ebay.com/`,
    };
    url3 = {
      url: `https://www.etsy.com/il-en/search?q=${searchKey}`,
      mainUrl: `https://www.etsy.com/`,
    };
    url4 = {
      url: `https://www.walmart.com/search/?cat_id=0&query=${searchKey}`,
      mainUrl: `https://www.walmart.com/`,
    };
  }
  
  
  
  const etsiScrap = fork(program1);
  const amazonScrap = fork(program2);
  const walmartScrap = fork(program3);
  const ebayScrap = fork(program4);
  // amazonScrap.send(url2);
  etsiScrap.send(url1);
  // walmartScrap.send(url3);
  // ebayScrap.send(url4);
  const sendAll = async () => {
    await generateNewSearch();
    etsiScrap.send(url1);
    // amazonScrap.send(url2);
    // walmartScrap.send(url3);
    // ebayScrap.send(url4);
  }
  const restartAll = () => {
    totalProducts.length = 0;
    totalSaved = 0;
    console.log(chalk.bgGreen(`\n  Restarting and changing crwalers \n`))
    sendAll();
  }
  const killAll = () => {
    etsiScrap.kill();
    // amazonScrap.kill();
    // walmartScrap.kill();
    // ebayScrap.kill();
  }
  let countD;
  const setTimer = () => {
    countD = setTimeout(() => {
      saveToDb(totalProducts, '');
      totalProducts.length = 0;
      totalProducts = [];
    }, 30000);
    console.log('timer is restarted!!!!');
  } 
  setTimer();
  const restartTimer = async (num) => {
    clearTimeout(countD);
    setTimer();
  }
  const saveAllProducts = async () => {
    await killAll();
    await saveToDb(totalProducts, '');
    await restartAll();
  }
  
  etsiScrap.on('message', function (product) {
    totalProducts.push(product)
    restartTimer();
    if (totalProducts.length > 400) {
      saveToDb(totalProducts, '');
      totalProducts.length = 0;
      totalProducts = [];
    }
    console.log(totalProducts.length);
  });

  etsiScrap.on('error', function (product) {
    restartAll();
    totalProducts.length = 0;
  });
  
  
  amazonScrap.on('message', function (product) {
    totalProducts.push(product)
    if (totalProducts.length > 1000) {
      saveToDb(totalProducts, '');
      totalProducts.length = 0;
      totalProducts = [];
    }
    console.log(totalProducts.length);
  });
  
  walmartScrap.on('message', function (product) {
    totalProducts.push(product)
    restartTimer();
    if (totalProducts.length > 1000) {
      saveAllProducts();
      totalProducts.length = 0;
    }
    console.log(totalProducts.length);
  });
  
  
  ebayScrap.on('message', function (product) {
    totalProducts.push(product)
    restartTimer();
    if (totalProducts.length > 1000) {
      saveAllProducts();
      totalProducts.length = 0;
    }
    console.log(totalProducts.length);
  });
  
}
start();

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect(`mongodb://127.0.0.1:27017`, { server: { poolSize: 5 } });
var conn = mongoose.connection;

conn.once('open', function () {

}); 
