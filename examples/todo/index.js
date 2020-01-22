const aido = require('../../lib')
const Todo = require('./slash/todo')

// Configure global application
aido.init({
  getSlackProfile: false,
  slash: { todo: Todo },
  tunnel: {
    // If you already have a tunnel setup just uncomment the following line and enter your actual tunnel URL
    // custom: 'https://xxxxxx.ngrok.io',
    // Or you can let aido create one on localtunnel.me for you (and request a custom subdomain !)
    // lt: { subDomain: 'xxxxxx' },
  },
  // appId: 'AXXXXXXX',
  // slackVerificationToken: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
  // appToken: 'xoxp-xxxxxxxxx-xxxxxxxx',
  // botToken: 'xoxb-xxxxxxxxx',
  // legacyToken: 'xoxp-xxxxxxxxx-xxxxxxxx',
})

aido.start(3000)
