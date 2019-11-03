const aido = require('../../lib')
const { Slash } = aido

class Simple extends Slash {
  initState() {
    return {
      value: 0,
    }
  }

  increment() {
    this.state.value += 1
  }

  decrement() {
    this.state.value -= 1
  }
}

// Configure global application
aido.init({
  viewsFolder: __dirname,
  slash: { simple: Simple },
  tunnel: {
    // If you already have a tunnel setup just uncomment the following line and enter your actual tunnel URL
    custom: 'https://aido-test.ngrok.io',
    // Or you can let aido create one on localtunnel.me for you (and request a custom subdomain !)
    // lt: { subDomain: 'xxxxxx' },
  },
  appId: 'AH1P0QK9N',
  slackVerificationToken: 'JX3a9iYFTNZHISwP7jHBNLme',
  appToken: 'xoxp-284476586484-284435374338-821565451174-71eee8ba2a892b449e1e47605509e56b',
  botToken: 'xoxb-284476586484-818891585140-XH2IRna3ze4dZOv0IzLOqg2R',
  // legacyToken: 'xoxp-xxxxxxxxx-xxxxxxxx',
})

aido.start()
