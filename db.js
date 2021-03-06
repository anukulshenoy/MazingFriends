var Sequelize = require('sequelize');
var config = require('./config');
var sequelize;
// if (process.env.DATABASE_URL) {
//   console.log('Inside DATABASE_URL sequelize :');
//   console.log('Here is process.env : ', process.env);
//   console.log('Here is prcoess.env.DATABASE_URL : ', process.env.DATABASE_URL)
//   if ( process.env.DATABASE_URL === 'dj' ) {
//     sequelize = new Sequelize('postgres', 'ehdwn1212', 'kim0243kim0243', {
//       host: 'postgres.cnjizs4c47ml.us-west-1.rds.amazonaws.com',
//       port: 5432,
//       dialect: 'postgres',
//       protocol: 'postgres',
//       logging: true,
//       timestamps: false
//     })
//   } else {
//     // the application is executed on Heroku ... use the postgres database
//     sequelize = new Sequelize(process.env.DATABASE_URL, {
//       dialect:  'postgres'
//     })
//   }
// } else {
//   console.log('Inside local host sequelize');
//   console.log('Here is process : ', process);
//   console.log('Here is process.env : ', process.env);
//   console.log('Here is prcoess.env.DATABASE_URL : ', process.env.DATABASE_URL)
//   // the application is executed on the local machine ... use mysql
//   sequelize = new Sequelize('postgres', 'postgres',  'kim0243', {
//     host: 'localhost',
//     dialect: 'postgres',
//     pool: {
//       max: 5,
//       min: 0,
//       idle: 10000
//     },
//   });
// }

sequelize = new Sequelize('postgres', config.dbUsername, config.dbPassword, {
  host: config.dbHost,
  port: 5432,
  dialect: 'postgres',
  protocol: 'postgres',
  logging: true,
  timestamps: false
})

sequelize
  .authenticate()
  .then(function(err) {
    console.log('Connection has been established successfully.');
  })
  .catch(function (err) {
    console.log('Unable to connect to the database:', err);
  });

var User = sequelize.define('user', {
  username: Sequelize.STRING,
  password: Sequelize.STRING
});

var Leaderboard = sequelize.define('leaderboard', {
  username: Sequelize.STRING,
  friend: Sequelize.STRING,
  time: Sequelize.FLOAT,
  level: Sequelize.INTEGER
}, {freezeTableName:true});

var Gamestate = sequelize.define('gamestate', {
  playerOnePosition: Sequelize.STRING,
  playerTwoPosition: Sequelize.STRING,
  level: Sequelize.INTEGER
});

var Friends = sequelize.define('friends', {
  user: Sequelize.STRING,
  friend: Sequelize.STRING
}, {freezeTableName:true});

// User.sync({force: true}).then( function() {
//   User.create({
//     username: 'DJ',
//     password: 'hey',
//     score: 300
//   });
//   User.create({
//     username: 'Savy',
//     password: 'hey',
//     score: 1000
//   })
//   User.create({
//     username: 'Anukul',
//     password: 'hey',
//     score: 450
//   })
// });

User.sync();
Leaderboard.sync({force: true});
Friends.sync();
// var consoleLater = function() {
//   User.findAll({
//     order: [
//       ['score', 'DESC']
//     ]
//   }).then( function(users) {
//     console.log('After sorting : ');
//     users.forEach( function(user) {
//       console.log(user.dataValues);
//     })
//   })
// };
// setTimeout(consoleLater, 1000);

module.exports = {
  User: User,
  Leaderboard: Leaderboard,
  Gamestate: Gamestate,
  Friends: Friends
}