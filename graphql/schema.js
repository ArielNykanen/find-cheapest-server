const graphql = require('graphql');
const Product = require('../models/product');
const Symbol = require('../models/Symbol');
const AffProduct = require('../models/affiliate-product');
const User = require('../models/user');
const Order = require('../models/order');
const Category = require('../models/categroy').category;
const SubCategory = require('../models/categroy').subCategory;
const jwt = require('jsonwebtoken');
const datetime = require('node-datetime');
const MainPage = require('../models/main-page');
const Visits = require('../models/visit-tracker');
const ProductTracker = require('../models/product-tracker');
const io = require('../socket');
const puppeteer = require('puppeteer');
const request = require('request');
const chalk = require('chalk')
var cheerio = require('cheerio');
var adfly = require("adf.ly")("21311553", "cbab19b3e2d40f7e05b12be8150032a8"); // You will find your API key in adf.ly Tools section.
// var adfly=require("adf.ly")(); still works but you won't earn money


const Pusher = require('pusher');
var pusher = new Pusher({
  appId: '723276',
  key: 'e5313f59887bb2912aac',
  secret: '9c917628577c16b2729b',
  cluster: 'ap2',
  encrypted: true
});
// ! pusher.trigger('my-channel', 'my-event', {
//   "message": "User named " + user.name + " added product named " + product.title + " to cart."
// });

const bcrypt = require('bcryptjs');



const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLSchema,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInputObjectType,
} = graphql;
const ProductMoreInfoInput = new GraphQLInputObjectType({
  name: 'ProductMoreInfo',
  fields: () => ({
    title: { type: GraphQLString },
    info: { type: GraphQLString },
  })
});

const ProductMoreInfoType = new GraphQLObjectType({
  name: 'MoreInfo',
  fields: () => ({
    title: { type: GraphQLString },
    info: { type: GraphQLString },
  })
});

const symbolsType = new GraphQLObjectType({
  name: 'Symbols',
  fields: () => ({
    title: { type: GraphQLString },
    logoSvg: { type: GraphQLString },
  })
});

const MainPageDataType = new GraphQLObjectType({
  name: 'MainPageData',
  fields: () => ({
    id: { type: GraphQLID },
    supportNum: { type: GraphQLString },
    firstHeader: { type: GraphQLString },
    topBanner: { type: GraphQLString },
    secondHeader: { type: GraphQLString },
    thirdHeader: { type: GraphQLString },
  })
});

const MessageType = new GraphQLObjectType({
  name: 'Message',
  fields: () => ({
    valid: { type: GraphQLBoolean },
    message: { type: GraphQLString },
  })
});

const ProductType = new GraphQLObjectType({
  name: 'Product',
  fields: () => ({
    id: { type: GraphQLString },
    title: { type: GraphQLString },
    price: { type: GraphQLString },
    quantity: { type: GraphQLString },
    category: { type: GraphQLString },
    image: { type: GraphQLString },
    affiliateLink: { type: GraphQLString },
    logo: { type: GraphQLString },
    productClickRate: { type: GraphQLInt },
    rating: { type: GraphQLString },
    relatedKeyWords: { type: GraphQLString },
    attachedInformation: {
      type: new GraphQLList(ProductMoreInfoType)
    },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  })
});


const CategoryType = new GraphQLObjectType({
  name: 'Category',
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    image: { type: GraphQLString },
    oldImagePath: { type: GraphQLString },
    subcategories: { type: new GraphQLList(GraphQLID) },
    relatedProducts: {
      type: new GraphQLList(GraphQLID)
    },
    relatedCategories: {
      type: new GraphQLList(SubCategoryType),
      resolve: async (parent, args) => {
        const relatedSubCategories = await SubCategory.find({ _id: parent.subCategories });
        return relatedSubCategories;
      }
    },
    getRelatedProducts: {
      type: new GraphQLList(ProductType),
      resolve: async (parent, args, req) => {
        const relatedProducts = await Product.find({ _id: parent.relatedProducts }).limit(4);
        return relatedProducts;

      }
    },
  })
})

const SubCategoryType = new GraphQLObjectType({
  name: 'SubCategory',
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    image: { type: GraphQLString },
    category: { type: GraphQLID },
    parentCategory: {
      type: CategoryType,
      resolve: async (parent, args) => {
        const category = await Category.findById(parent.category);
        return category;
      }
    }
  })
})
const GotProductsResultsType = new GraphQLObjectType({
  name: 'GotProductsResults',
  fields: () => ({
    products: { type: new GraphQLList(ProductType) },
    popularProducts: { type: new GraphQLList(ProductType) },
    totalProducts: { type: GraphQLInt }
  })
})
const CartItemType = new GraphQLObjectType({
  name: 'CartItem',
  fields: () => ({
    productId: {
      type: GraphQLID
    },
    quantity: {
      type: GraphQLInt,
    },
    title: { type: GraphQLString },
    price: { type: GraphQLString },
    image: { type: GraphQLString },
    productInStock: {
      type: GraphQLInt,
      resolve: async (parent, args, req) => {
        const product = await Product.findById(parent.productId);
        if (product) {
          const user = await User.findById(req.userId);
          const updatedProductInCartIndex = user.cart.findIndex(item => {
            return parent.productId.toString() === item.productId.toString();
          });
          if (updatedProductInCartIndex >= 0 && product.quantity < parent.productInStock) {
            user.cart[updatedProductInCartIndex].productInStock = product.quantity;
          }
          await user.save();
          return product.quantity;
        }
      },
    },
  })
});



const OrderType = new GraphQLObjectType({
  name: 'Order',
  fields: () => ({
    userId: { type: GraphQLID },
    orderStatus: { type: GraphQLString },
    items: { type: new GraphQLList(CartItemType) },
    price: { type: GraphQLString },
    taxes: { type: GraphQLString },
    totalPrice: { type: GraphQLString },
    getItems: {
      type: new GraphQLList(ProductType),
      resolve: async (parent, args) => {
        const productsInOrder = await Product.find({ id: parent.items });
        return productsInOrder;
      }
    },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  })
});

const ProductTrackerType = new GraphQLObjectType({
  name: 'ProductTracker',
  fields: () => ({
    title: { type: GraphQLString },
    productId: { type: GraphQLID },
    infoClicks: { type: GraphQLInt },
    addedToCart: { type: GraphQLInt },
    ordered: { type: GraphQLInt },
    votes: { type: new GraphQLList(GraphQLInt) }
  })
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLID },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
    name: { type: GraphQLString },
    lastname: { type: GraphQLString },
    phone: { type: GraphQLString },
    city: { type: GraphQLString },
    address: { type: GraphQLString },
    zipCode: { type: GraphQLString },
    customerType: { type: GraphQLString },
    cart: {
      type: new GraphQLList(CartItemType),
      resolve: async (parent, args, req) => {
        const user = await User.findById(req.userId);
        const changedCart = user.cart;
        if (!changedCart) {
          for (let i = 0; i < changedCart.length; i++) {
            let product = await Product.findById({ _id: changedCart[i].productId });
            if (product.quantity !== changedCart[i].productInStock) {
              changedCart[i].productInStock = product.quantity;
              if (changedCart[i].quantity > changedCart[i].productInStock) {
                changedCart[i].quantity = changedCart[i].productInStock;
              }
            }
          }
        }
        user.cart = changedCart;
        await user.save();
        return user.cart;
      },
    },
    orders: { type: new GraphQLList(OrderType) },
    canceledOrders: { type: new GraphQLList(OrderType) },
    authToken: { type: GraphQLString },
    anotherPhone: { type: GraphQLString },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  })
});

const ProductRootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: () => ({
    getProdTrackers: {
      type: new GraphQLList(ProductTrackerType),
      resolve: async (parent, args) => {
        const trackers = await ProductTracker.find()
        if (!trackers) {
          throw new Error('No T found');
        }
        return trackers;
      }
    },
    getProduct: {
      type: ProductType,
      args: { id: { type: GraphQLID } },
      resolve: async (parent, args, req) => {
        const product = await Product.findById(args.id);
        if (!req.isAdmin) {
          const productTracker = await ProductTracker.find({ productId: product.id });
          if (productTracker.length <= 0) {
            console.log('not found!!!!!!!!!!!!!!!!!!!!!!!!!');
          } else {
            productTracker[0].infoClicks += 1;
            const te = await productTracker[0].save();
            io.getIo().emit('addedToCart', { action: 'trackersUpdate', tracker: productTracker[0] });
          }
        }

        return product;
      }
    },
    getAllProducts: {
      type: GotProductsResultsType,
      resolve: async (parent, args) => {
        const products = await Product.find();
        // ? for adding productTrackers to all products
        // await Promise.all(products.map(async (prod) => {
        //   const pt = await ProductTracker.find({ productId: prod.id });
        //   if (pt.length <= 0) {
        //     console.log('hello ariel!!!!');
        //     const newTracker = new ProductTracker({
        //       title: prod.title,
        //       productId: prod.id,
        //       infoClicks: 0,
        //       addedToCart: 0,
        //       ordered: 0,
        //       votes: []
        //     });
        //     await newTracker.save(); 
        //   }
        // }));
        const totalProducts = await Product.find().count();
        return { products: products, totalProducts: totalProducts };
      }
    },
    getProducts: {
      type: GotProductsResultsType,
      args: {
        page: { type: GraphQLInt },
        search: { type: GraphQLString },
        categoryId: { type: GraphQLString },
        subCategory: { type: GraphQLID },
        priceLimit: { type: GraphQLInt },
        symbols: { type: GraphQLString },
        rating: { type: GraphQLString },
        priceSorting: { type: GraphQLString },
      },
      resolve: async (parent, args) => {

        if (!args.page) {
          page = 1;
        }

        const perPage = 32;
        if (args.search === ' ') {
          args.search = ``;
        }

        // Start the requestice:
        let secs = 0;
        const timerr = setInterval(() => {
          secs += 10;
        }, 10);
        // const allProds = await AffProduct.find({symbol: 'ebay'});
        // allProds.forEach(prod => {
        //   if (!prod.productClickRate) {
        //     prod.price = prod.price * 3.6;
        //     prod.save();
        //   }
        // })

        console.log('the price is ' + args.priceLimit);

        let upperLimit = args.priceLimit <= 0 ? 100000000 : args.priceLimit;
        if (!args.symbols) {
          args.symbols = await 'ebay,amazon,etsy,walmart';
        }
        let symbolsArr = ['amazon', 'etsy', 'ebay', 'walmart'];
        let sortBy;
        if (args.priceSorting === 'ghp') {
          sortBy = -1;
        } else {
          sortBy = 1;
        }
        if (args.symbols) {
          // symbolsArr = await args.symbols.split(',');
          // symbolsArr.pop();
          symbolsArr = ['amazon', 'etsy', 'ebay', 'walmart'];

        }
        let rating = 0;
        if (args.rating) {
          rating = args.rating.split(' ')[0];
          rating = Number(rating);
        } else {
          rating = 0;
        }


        let qSearch = [
          { relatedKeyWords: args.search },
        ];

        const searchCheck = await AffProduct.find(
          {
            $or: qSearch
          },
          function (err, docs) { }
        ).where('price').lt(upperLimit)
          .where({ 'symbol': symbolsArr })
          .where('rating').gte(rating)
          .sort({ price: sortBy })
          .skip((args.page - 1) * perPage)
          .count();


        // const targetRes = await productCrwaler.getSearchResults.target(args.search, args.page);
        // console.log('Etsy done. res = ' + etsyRes.length);
        scrapProducts = async (productsFound, prods = 16, symbols, page) => {
          return await new Promise(async (resolve, reject) => {
            const fork = require('child_process').fork;
            const path = require('path');
            const program1 = path.resolve('./web-crwalers/etsi_scraping.js');
            const program2 = path.resolve('./web-crwalers/amazon_scraping.js');
            const program3 = path.resolve('./web-crwalers/walmart_scraping.js');
            const program4 = path.resolve('./web-crwalers/ebay_scraping.js');
            const pageLimiter = 3;
            let total = productsFound;
            let engineStopped = 0;
            let totalEngines = +symbols.length;
            // setTimeout(() => {
            //   resolve();
            // }, 2000);
            // if (symbols.indexOf("amazon") > -1) {
            //    productCrwaler.getSearchResults.amazon(args.search, args.page, sortBy, prods, searchMore).catch(e => {
            //     throw new Error('Cant Find Results');
            //   });
            // }
            // if (symbols.indexOf("etsy") > -1) {

            const etsiScrap = fork(program1);
            const amazonScrap = fork(program2);
            const walmartScrap = fork(program3);
            const ebayScrap = fork(program4);
            const maxProds = 60;
            const killAll = () => {
              etsiScrap.kill();
              amazonScrap.kill();
              walmartScrap.kill();
              console.log(chalk.bgRed(`\n  All forks killed! \n`))
            }
            

            if (symbols.indexOf("etsy") > -1) {
              etsiScrap.send({ search: args.search, page: page, sortBy: sortBy, prods: prods, pageLimiter: pageLimiter });
              etsiScrap.on('message', function (response) {
                if (!Number(response)) {
                  engineStopped++;
                  console.log(engineStopped);
                  
                }
                if (engineStopped >= totalEngines) {
                  resolve();
                  killAll();
                } 
              });
            }


            if (symbols.indexOf("amazon") > -1) {
              amazonScrap.send({ search: args.search, page: page, sortBy: sortBy, prods: prods, pageLimiter: pageLimiter });
              amazonScrap.on('message', function (response) {
                if (!Number(response)) {
                  engineStopped++;
                  console.log(engineStopped);
                }
                if (engineStopped >= totalEngines) {
                  resolve();
                  killAll();
                } 
              });
            }

            if (symbols.indexOf("walmart") > -1) {
              walmartScrap.send({ search: args.search, page: page, sortBy: sortBy, prods: prods, pageLimiter: pageLimiter });
              walmartScrap.on('message', function (response) {
                if (!Number(response)) {
                  engineStopped++;
                  console.log(engineStopped);
                }
                if (engineStopped >= totalEngines) {
                  resolve();
                  killAll();
                } 
              });
            }


            if (symbols.indexOf("ebay") > -1) {
              ebayScrap.send({ search: args.search, page: page, sortBy: sortBy, prods: prods, pageLimiter: pageLimiter });
              ebayScrap.on('message', function (response) {
                if (!Number(response)) {
                  engineStopped++;
                  console.log(engineStopped);
                }
                if (engineStopped >= totalEngines) {
                  resolve();
                  killAll();
                } 
              });
            }



          });
        }
        if (searchCheck < perPage + 1) {
          
          await scrapProducts(searchCheck, perPage, symbolsArr, args.page);
        }
        


        console.log('Scraping is done processing data...');


        let counter = 0;
        let retry = 0;
        getFilteredProducts = async () => {
          const res = await AffProduct.find(
            {
              $or: qSearch
            },
            function (err, docs) {
              console.log(err);
            }
          ).where('price')
            .lt(upperLimit)
            .where({ 'symbol': symbolsArr })
            .where('rating').gte(rating)
            .limit(perPage)
            .skip((args.page - 1) * perPage)
            .sort({ price: sortBy })
          return res;
        }




        const searchFiltered = await getFilteredProducts();
        console.log('Filtering products by keywords is done. results = ' + searchFiltered.length);

        const popularProducts = await AffProduct.find(
          {
            $or: qSearch
          },
          function (err, docs) {
            console.log(err);
          }
        ).where('price')
          .lt(upperLimit)
          .where({ 'symbol': symbolsArr })
          .limit(4)
          .sort({ productClickRate: -1 })

        const totalProducts = await AffProduct.find(
          {
            $or: qSearch
          },
          function (err, docs) { }
        ).where('price').lt(upperLimit)
          .where({ 'symbol': symbolsArr })
          .where('rating').gte(rating)
          .sort({ price: sortBy })
          .count();

        console.log('Total results count is done. = ' + totalProducts);
        if (timerr) {
          clearInterval(timerr);
        }
        console.log('Sending the data to client.');
        console.log((secs / 1000).toFixed(2));
        let prodsNextPage = totalProducts - (perPage * args.page);
        console.log('prods on next search in db = ' + prodsNextPage);
        
        if (prodsNextPage < perPage) {
          scrapProducts(prodsNextPage, perPage, symbolsArr, args.page+1);
        }
        return {
          products: searchFiltered,
          popularProducts: popularProducts,
          totalProducts: totalProducts
        };

      },
    },
    getProductsExisting: {
      type: GotProductsResultsType,
      args: {
        page: { type: GraphQLInt },
        search: { type: GraphQLString },
        categoryId: { type: GraphQLString },
        subCategory: { type: GraphQLID }
      },
      resolve: async (parent, args) => {
        console.log('Ok!!');

        if (!args.page) {
          page = 1;
        }
        const perPage = 12;
        if (args.search === ' ') {
          args.search = ``;
        }
        let products = await AffProduct.find(
          {
            $or: [
              { "title": { "$regex": args.search, "$options": "i" } }
            ]
          },
          function (err, docs) { }
        )
          .sort({ createdAt: -1 })
          .skip((args.page - 1) * perPage)
          .limit(perPage);

        return { products: [...products], totalProducts: products.length };
      }
    },
    getSymbols: {
      type: new GraphQLList(symbolsType),
      resolve: async (parent, args) => {
        //   const allSymbols = [
        //     { title: 'amazon', logoSvg: 'amazon-logo.svg' },
        //     { title: 'etsy', logoSvg: 'etsy-logo.svg' },
        //     { title: 'walmart', logoSvg: 'walmart-logo.svg' },
        //     { title: 'ebay', logoSvg: 'ebay-logo.svg' },
        //   ];
        //   allSymbols.forEach(sym => {
        //     const newSym = new Symbol({
        //       title: sym.title,
        //       logoSvg: sym.logoSvg
        //     });
        //     newSym.save();
        //   })
        return await Symbol.find();

      }

    },

    getCategories: {
      type: new GraphQLList(CategoryType),
      resolve: async (parent, args) => {
        const categories = await Category.find();
        return categories;
      }
    },
    getCategorieById: {
      type: CategoryType,
      args: {
        categoryId: { type: GraphQLID }
      },
      resolve: async (parent, args) => {
        const category = await Category.findById(args.categoryId);
        return category;
      }
    },
    getSubCategories: {
      type: new GraphQLList(SubCategoryType),
      resolve: async (parent, args) => {
        const subCategories = await SubCategory.find();
        return subCategories;
      }
    },
    getUser: {
      type: UserType,
      resolve: async (parent, args, req) => {
        if (!req.isAuth) {
          const error = new Error('Not logged in.');
          error.code = 401;
          throw error;
        }

        const user = await User.findById(req.userId);
        return user;
      }
    },
    getUsers: {
      type: new GraphQLList(UserType),
      resolve: async (parent, args, req) => {
        if (!req.isAuth) {
          const error = new Error('Not logged in.');
          error.code = 401;
          throw error;
        }
        if (!req.isAdmin) {
          const error = new Error('Not logged in.');
          error.code = 401;
          throw error;
        }

        const users = await User.find();
        const visits = await Visits.find()
          .sort({ createdAt: 1 });

        const a = io.getIo();
        const registeredUser = users.length;
        const connected = a.engine.clientsCount;
        a.emit('usersInfo', { action: 'totalvisits', visits: visits })
        a.emit('usersInfo', { action: 'totalConnected', connected: connected })
        a.emit('usersInfo', { action: 'totalRegistered', registeredUser: registeredUser });
        return users;
      }
    },
    removeCartItem: {
      type: UserType,
      args: {
        productId: { type: GraphQLID }
      },
      resolve: async (parent, args, req) => {

        if (!req.isAuth) {
          const error = new Error('Not logged in.');
          error.statusCode = 401;
          throw error;
        }
        const user = await User.findById(req.userId);
        if (!user) {
          const error = new Error('User is not logged in or not valid!');
          error.statusCode = 404;
          throw error;
        }
        const updatedCart = user.cart.filter(item => {
          return args.productId.toString() !== item.productId.toString();
        });
        user.cart = updatedCart;
        await user.save();
        return user.cart;
      }
    },
    checkPayment: {
      type: GraphQLBoolean,
      args: {
        token: { type: GraphQLString },
        description: { type: GraphQLString }
      },
      resolve: async (parent, args, req) => {
        if (!req.isAuth) {
          const error = new Error('Not logged in.');
          error.statusCode = 401;
          throw error;
        }
        // Set your secret key: remember to change this to your live secret key in production
        // See your keys here: https://dashboard.stripe.com/account/apikeys
        var stripe = require("stripe")("sk_test_E7aMma1gqguolHpEeHZxbg7m");

        // Token is created using Checkout or Elements!
        // Get the payment token ID submitted by the form:
        const token = args.token; // Using Express

        return await (async () => {
          const charge = await stripe.charges.create({
            amount: 20000,
            currency: 'ils', // ? it can broke
            description: args.description,
            source: token,
          });
          if (!charge) {
            return false;
          }
          return true;
        })();
      }
    },
    loginUser: {
      type: UserType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString }
      },
      resolve: async (parent, args, req) => {
        const user = await User.findOne({ email: args.email });
        const userComparePass = await bcrypt.compare(args.password, user.password);
        if (!userComparePass) {
          const error = new Error('Incorrect password or email!');
          throw error;
        }
        const token = jwt.sign({
          userId: user._id.toString(),
          email: user.email,
          role: user.role || ''
        },
          'secretq12wq12wa',
          { expiresIn: '24h' }
        )
        user.authToken = token;
        await user.save();
        return user;
      }
    },
    checkLoggedState: {
      type: GraphQLBoolean,
      resolve: async (paren, args, req) => {
        if (req.isAuth) {
          return true;
        }
        return false;
      }
    },
    checkIfAdmin: {
      type: GraphQLBoolean,
      resolve: async (paren, args, req) => {
        if (req.isAdmin) {
          return true;
        }
        return false;
      }
    },
    getMainPageData: {
      type: MainPageDataType,
      resolve: async (parent, args, req) => {
        const mainPageData = await MainPage.findOne();
        return mainPageData;
      }
    }
  })
})

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    registerUser: {
      type: UserType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString },
        name: { type: GraphQLString },
        lastname: { type: GraphQLString },
        phone: { type: GraphQLString },
        city: { type: GraphQLString },
        address: { type: GraphQLString },
        zipCode: { type: GraphQLString },
        customerType: { type: GraphQLString },
        role: { type: GraphQLInt },
      },
      resolve: async (parent, args, req) => {
        const hashedPassword = await bcrypt.hash(args.password, 12);
        const newUser = new User({
          email: args.email,
          password: hashedPassword,
          name: args.name,
          lastname: args.lastname,
          phone: args.phone,
          city: args.city,
          address: args.address,
          zipCode: args.zipCode,
          customerType: args.customerType,
          role: args.role | 2,
          cart: [],
          orders: [],
          canceledOrders: []
        });
        await newUser.save();
        const users = await User.find();
        const a = await io.getIo();
        const registeredUser = await users.length || 44444;
        a.emit('usersInfo', { action: 'totalRegistered', registeredUser: registeredUser });
        console.log(23);
        return newUser;
      }
    },
    addProduct: {
      type: ProductType,
      args: {
        title: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: GraphQLString },
        price: { type: GraphQLString },
        quantity: { type: GraphQLString },
        subCategory: { type: GraphQLString },
        category: { type: GraphQLString },
        onSale: { type: GraphQLString },
        onSaleTitle: { type: GraphQLString },
        showDate: { type: GraphQLString },
        lastPrice: { type: GraphQLString },
        saleEndDate: { type: GraphQLString },
        image: { type: GraphQLString },
        imageOldPath: { type: GraphQLString },
        attachedInformation: {
          type: new GraphQLList(ProductMoreInfoInput)
        },
        superHot: { type: GraphQLString },
        id: { type: GraphQLID }
      },
      resolve: async (parent, args, req) => {
        console.log(args.attachedInformation);

        if (!req.isAuth) {
          const error = new Error('Not logged in.');
          error.code = 401;
          throw error;
        }
        if (!req.isAdmin) {
          const error = new Error('Not logged in.');
          error.code = 401;
          throw error;
        }
        const category = await Category.findById(args.category);
        let product;
        let relatedProdIdExists;
        let updatedCategoryProds;
        if (category) {
          updatedCategoryProds = [...category.relatedProducts];
          category.relatedProducts = updatedCategoryProds;
          relatedProdIdExists = await updatedCategoryProds.findIndex(cp => {
            return cp.toString() === args.id;
          });
        }
        if (args.id) {
          product = await Product.findById(args.id);
          if (relatedProdIdExists === -1 && product && category) {
            updatedCategoryProds.push(args.id);
            category.relatedProducts = updatedCategoryProds;
            await category.save();
          }
          await product.update({
            title: args.title,
            description: args.description,
            price: args.price,
            quantity: args.quantity,
            category: args.category,
            subCategory: args.subCategory,
            onSale: args.onSale,
            onSaleTitle: args.onSaleTitle,
            showDate: args.showDate,
            lastPrice: args.lastPrice,
            saleEndDate: args.saleEndDate,
            image: args.image,
            imageOldPath: args.imageOldPath,
            attachedInformation: args.attachedInformation,
            attachedProducts: [],
            superHot: args.superHot,
            userId: req.userId
          })
        } else {
          const prodInfo = [{ title: "מחיר", info: args.price }];
          const prodInfoFinal = prodInfo.concat(args.attachedInformation);
          prodInfo
          product = await new Product({
            title: args.title,
            description: args.description,
            price: args.price,
            quantity: args.quantity,
            category: args.category,
            subCategory: args.subCategory,
            onSale: args.onSale,
            onSaleTitle: args.onSaleTitle,
            showDate: args.showDate,
            lastPrice: args.lastPrice,
            saleEndDate: args.saleEndDate,
            image: args.image,
            imageOldPath: args.imageOldPath,
            attachedInformation: prodInfoFinal,
            attachedProducts: [],
            superHot: args.superHot,
            userId: req.userId
          });
          const newTracker = new ProductTracker({
            productId: product.id,
            infoClicks: 0,
            ordered: 0,
            votes: []
          });
          await newTracker.save();

          if (category) {
            updatedCategoryProds.push(product.id);
            category.relatedProducts = updatedCategoryProds;
            await category.save();
          }
          await product.save();
        }
        return product;
      }
    },
    relateProductsToProd: {
      type: ProductType,
      args: {
        productId: { type: GraphQLID },
        idsArray: { type: new GraphQLList(GraphQLID) }
      },
      resolve: async (parent, args, req) => {
        const product = await Product.findById(args.productId);
        // if (!product) {
        //   const error = new Error('product not found!');
        //   error.statusCode = 404;
        //   throw error;
        // }
        const idsArray = await args.idsArray.toString().split(',');
        console.log(idsArray);
        const updatedRelatedProducts = [...product.attachedProducts];
        await idsArray.forEach(async (prod) => {
          const findIdIndex = await updatedRelatedProducts.findIndex(cp => {
            return cp.toString() === prod.toString();
          });
          if (findIdIndex === -1) {
            updatedRelatedProducts.push(prod);
          }
          console.log(updatedRelatedProducts);
        });
        product.attachedProducts = updatedRelatedProducts;
        await product.save();

        return product;
      }
    },
    addProductToCart: {
      type: CartItemType,
      args: {
        productId: { type: GraphQLID },
        quantity: { type: GraphQLInt },
      },
      resolve: async (parent, args, req) => {
        if (!req.isAuth) {
          const error = new Error('Not logged in.');
          error.statusCode = 401;
          throw error;
        }
        const user = await User.findById(req.userId);
        const product = await Product.findById(args.productId);
        const updatedCartItems = [...user.cart];
        if (!product) {
          throw new Error('No Product found!')
        }
        const cartProductIndex = await user.cart.findIndex(cp => {
          return cp.productId.toString() === product.id.toString();
        });

        if (cartProductIndex >= 0) {
          user.cart[cartProductIndex].quantity = args.quantity;

        } else {
          updatedCartItems.push({
            productId: product._id,
            quantity: args.quantity,
            title: product.title,
            price: product.price,
            image: product.image,
            productInStock: product.quantity,
          });
        }
        user.cart = updatedCartItems;
        await user.save();
        const productTracker = await ProductTracker.find({ productId: product.id });
        if (productTracker.length <= 0) {
          console.log('not found!!!!!!!!!!!!!!!!!!!!!!!!!');
        } else {
          productTracker[0].addedToCart += 1;
          const te = await productTracker[0].save();
          io.getIo().emit('addedToCart', { action: 'trackersUpdate', tracker: productTracker[0] });
        }
        return user;
      }
    },
    createOrder: {
      type: OrderType,
      resolve: async (parent, args, req) => {
        if (!req.isAuth) {
          const error = new Error('Not logged in.');
          error.statusCode = 401;
          throw error;
        }
        const user = await User.findById(req.userId);
        if (!user || user.cart.length <= 0) {
          const error = new Error('Cant create order on empty cart.');
          error.statusCode = 401;
          throw error;
        }
        let totalPrice = 0;
        user.cart.map(item => {
          totalPrice += item.price * +item.quantity;
        });
        const newOrder = new Order({
          userId: req.userId,
          orderStatus: 'ממתין לאישור',
          items: [...user.cart],
          price: (totalPrice + (totalPrice * 0.17)).toFixed(2),
          taxes: (totalPrice * 0.17).toFixed(2),
          totalPrice: totalPrice.toFixed(2)
        });
        const res = await newOrder.save();
        if (!res) {
          const error = new Error('Cant create order please try again.');
          error.statusCode = 401;
          throw error;
        }
        await Promise.all(user.cart.map(async (prod) => {
          const productTracker = await ProductTracker.find({ productId: prod.productId });
          if (productTracker.length <= 0) {
            console.log('not found!!!!!!!!!!!!!!!!!!!!!!!!!');
          } else {
            productTracker[0].ordered += 1;
            const te = await productTracker[0].save();
            io.getIo().emit('addedToCart', { action: 'trackersUpdate', tracker: productTracker[0] });
          }
        }));
        user.cart = [];
        const updatedOrders = [...user.orders];
        updatedOrders.push(newOrder);
        user.orders = updatedOrders;
        await user.save();

        return newOrder;
      }
    },
    addCategory: {
      type: CategoryType,
      args: {
        title: { type: GraphQLString },
        image: { type: GraphQLString }
      },
      resolve: async (parent, args, req) => {
        if (!req.isAuth) {
          const error = new Error('Not logged in.');
          error.code = 401;
          throw error;
        }
        if (!req.isAdmin) {
          const error = new Error('Not logged in.');
          error.code = 401;
          next(error);
        }
        const title = args.title;
        const image = args.image;
        const subCategoriesArr = [];
        const exists = await Category.find({ title: title });
        if (exists.length > 0) {
          const error = new Error('Category exists already!');
          throw error;
        }
        // if (validator.isEmpty(title)) {
        //   const error = new Error('Category title is empty!');
        //   throw error;
        // }
        const newCategory = new Category({
          title: title,
          subCategories: [],
          image: image
        });
        await newCategory.save();
        const allCategories = await Category.find();
        return allCategories;
      }
    },
    checkPaymentDetails: {
      type: MessageType,
      args: {
        description: { type: GraphQLString },
        token: { type: GraphQLString },
      },
      resolve: async (parent, args, req) => {
        if (!req.isAuth) {
          const error = new Error('Not logged in.');
          error.statusCode = 401;
          throw error;
        }
        // Set your secret key: remember to change this to your live secret key in production
        // See your keys here: https://dashboard.stripe.com/account/apikeys
        var stripe = require("stripe")("sk_test_E7aMma1gqguolHpEeHZxbg7m");

        // Token is created using Checkout or Elements!
        // Get the payment token ID submitted by the form:
        const token = args.token; // Using Express

        return await (async () => {
          const charge = await stripe.charges.create({
            amount: 20000,
            currency: 'usd', // ? it can broke
            description: args.description,
            source: token,
          });
        })();
      }
    },
    incProdClickrate: {
      type: GraphQLString,
      args: {
        prodId: { type: GraphQLString },
      },
      resolve: async (parent, args, req) => {
        const product = await AffProduct.findById(args.prodId);
        if (!product) {
          const err = new Error('product not found!');
          err.statusCode = 404;
          throw err;
        }
        product.productClickRate++;
        await product.save();
        return 'incremented!';
      }
    }

  }
})

module.exports = new GraphQLSchema({
  query: ProductRootQuery,
  mutation: Mutation
});