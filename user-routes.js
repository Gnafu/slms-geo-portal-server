const express = require('express'),
      _ = require('lodash'),
      config = require('./config'),
      jwt = require('jsonwebtoken');

const app = module.exports = express.Router();

// XXX: This should be a database of users :).
const users = [{
  id: 1,
  username: 'gonzo',
  password: 'gonzo'
}];

function createToken(user) {
  return jwt.sign(_.omit(user, 'password'), config.secret, { expiresIn: 60 * 60 * 5 });
}

function getUserScheme(req) {
  const userSearch = {};
  let username,
      type;

  if (req.body.username) {
    // The POST contains a username and not an email
    username = req.body.username;
    type = 'username';
    userSearch.username = username;
  } else if (req.body.email) {
    // The POST contains an email and not an username
    username = req.body.email;
    type = 'email';
    userSearch.email = username;
  }

  return {
    username: username,
    type: type,
    userSearch: userSearch
  };
}

// app.post('/users', function(req, res) {
//   const userScheme = getUserScheme(req);

//   if (!userScheme.username || !req.body.password) {
//     return res.status(400).send('You must send the username and the password');
//   }

//   if (_.find(users, userScheme.userSearch)) {
//     return res.status(400).send('A user with that username already exists');
//   }

//   const profile = _.pick(req.body, userScheme.type, 'password', 'extra');
//   profile.id = _.max(users, 'id').id + 1;

//   users.push(profile);

//   res.status(201).send({
//     id_token: createToken(profile)
//   });
// });

app.post('/sessions/create', (req, res) => {
  const userScheme = getUserScheme(req);

  if (!userScheme.username || !req.body.password) {
    return res.status(400).send('You must send the username and the password');
  }

  const user = _.find(users, userScheme.userSearch);

  if (!user) {
    return res.status(401).send('The username or password don\'t match');
  }

  if (user.password !== req.body.password) {
    return res.status(401).send('The username or password don\'t match');
  }

  res.status(201).send({
    id_token: createToken(user)
  });
});
