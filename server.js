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
const app = express();
const MONGODB_URI = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-shard-00-00-4a0ak.mongodb.net:27017,cluster0-shard-00-01-4a0ak.mongodb.net:27017,cluster0-shard-00-02-4a0ak.mongodb.net:27017/${process.env.MONGO_DATABASE}?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true`;
const auth = require('./middleware/auth');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
// const https = require('https');

// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   res.header("Access-Control-Allow-Headers", 'Authorization, Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
//   res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200);
//   }
//   next();
// });
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

var whitelist = ['https://master.d216vg7a62cy6v.amplifyapp.com/', 'http://localhost:4200', 'https://master.d216vg7a62cy6v.amplifyapp.com']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}
app.use(cors(corsOptions))
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
const PORT = process.env.PORT || 3000;
mongoose.connect(MONGODB_URI, { useMongoClient: true })
  .then(result => {
    const server = app.listen(PORT);
    console.log("App is running on port " + PORT);

    // https.createServer({ key: privateKey, cert: certificate }, app).
    const io = require('./socket').init(server);
    io.on('connection', socket => {
      const dt = datetime.create();
      const currentTime = dt.format('Y/m/d');
      Visits.find({ date: currentTime }).then(res => {
        if (res.length <= 0) {
          const newVisits = new Visits({
            visits: 1,
            date: currentTime
          });
          return newVisits.save();
        } else {
          res[0].visits += 1;
          return res[0].save();
        }
      }).then(reuslts => {
        Visits.find().then(res => {
          io.emit('usersInfo', { action: 'totalvisits', visits: res })
          console.log(res);
          console.log('Client connected!');
          socket.on('disconnect', socket => {
            console.log('Client disconnected!');
            const connected = io.engine.clientsCount;
            io.emit('usersInfo', { action: 'totalConnected', connected: connected });
          })
          const connected = io.engine.clientsCount;
          io.emit('usersInfo', { action: 'totalConnected', connected: connected });
        })
      })
    })
  }).catch(err => {
    console.log(err);
  })

