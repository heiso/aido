const koaBody = require('koa-body')
const { set, isFunction } = require('lodash')
const isJson = require('is-json')

const { checkToken } = require('./middleware/checkToken')
const { normalizeBody } = require('./middleware/normalizeBody')
const { initSlash } = require('./middleware/initSlash')
const { emptyResponse } = require('./middleware/emptyResponse')
const customApi = require('./utils/customApi')

/**
 * Initializes the Koa app with the Aido middlewares
 * @param {Object} app - The Koa app
 * @param {Object} router - The Koa router
 */
function applyRoutes(app, router) {
  // Parse request body
  app.use(koaBody({ includeUnparsed: true }))

  router.get('', '/health', (ctx) => { ctx.body = '🍪'})

  // These routes are requests from Slack webhooks
  router.post(
    'slash',
    '/slash',
    checkToken,
    normalizeBody,
    // Identify slash command
    async (ctx, next) => {
      const { command, text, channelId, teamId } = ctx.request.body
      set(ctx, 'trigger.team', teamId)
      set(ctx, 'trigger.slash', command.replace(/\//g, ''))
      set(ctx, 'trigger.text', text)
      set(ctx, 'trigger.channel', channelId)
      await next()
    },
    initSlash,
    // Get user's ID from payload
    async (ctx, next) => {
      const slackId = ctx.request.body.userId
      await next()
      // Once the request has been responded to, load the user profile & session
      await ctx.slash.setUser(slackId)
    },
    emptyResponse,
  )
  
  router.post(
    'action',
    '/action',
    // Decode the JSON payload
    async (ctx, next) => {
      ctx.request.body = {
        ...JSON.parse(ctx.request.body.payload),
        [Symbol.for('unparsedBody')]: ctx.request.body[Symbol.for('unparsedBody')],
      }
      await next()
    },
    checkToken,
    normalizeBody,
    // Identify the slash command and text from the payload
    async (ctx, next) => {
      const sessionId = ctx.request.body.callbackId
      const { team } = ctx.request.body
      const [slash, originator, ...conversationWith] = sessionId.split('-')
      set(ctx, 'trigger.team', team.id)
      set(ctx, 'trigger.channel', ctx.request.body.channel.id)
      set(ctx, 'trigger.slash', slash)
      set(ctx, 'trigger.conversationWith', conversationWith.length > 0 ? conversationWith : null)
      set(ctx, 'trigger.originator', originator)
      set(ctx, 'trigger.sessionId', conversationWith.length > 0 ? sessionId : null)
      set(ctx, 'trigger.text', null)
      await next()
    },
    initSlash,
    // Get user ID from payload
    async (ctx, next) => {
      const slackId = ctx.request.body.user.id
      await next()
      // Once the request has been responded to, load the user profile & session
      await ctx.slash.setUser(slackId)
    },
    // Identify the action
    async (ctx, next) => {
      if (ctx.request.body.type === 'interactive_message') {
        const [action] = ctx.request.body.actions
        const { name, value } =  action
        if (name === 'view') {
          ctx.assert(!!ctx.views[value], 404, `View ${value} is not configured on this server`)
          ctx.slash.setView(value)
        } else {
          set(ctx, 'trigger.action', name)
          set(ctx, 'trigger.args', isJson.strict(value) ? JSON.parse(value) : value)
        }
      }
      if (ctx.request.body.type === 'dialog_submission') {
        const action = ctx.request.body.state
        const args = ctx.request.body.submission
        ctx.assert(
          ctx.slash[action] && isFunction(ctx.slash[action]),
          404, `Action ${action} is not configured on the command ${ctx.slash.command}`,
        )
        set(ctx, 'trigger.action', action)
        set(ctx, 'trigger.args', args)
      }
      await next()
    },
    emptyResponse,
  )

  // This route is the last step of the oauth token exchange
  router.get(
    'authorize',
    '/authorize',
    async (ctx) => {
      const { code } = ctx.request.query
      const res = await customApi('oauth.v2.access', {
        code,
        client_id: ctx.options.clientId,
        client_secret: ctx.options.clientSecret,
      })
      ctx.assert(res.ok, 401, `Installation failed : ${res.error}`)
      const { team, access_token } = res
      await ctx.database.Oauth.query().insert({
        team: team.id,
        token: access_token,
        profile: res,
      })
      ctx.body = 'Congratulations ! Installation was successfull 🎉'
    },
  )

  // This route is the landing page when users install your app from the Slack Apps Directory
  router.get(
    'install',
    '/install',
    async (ctx) => {
      const url = `https://slack.com/oauth/v2/authorize?client_id=${ctx.options.clientId}&scope=chat:write,commands`
      ctx.redirect(url)
    },
  )

  app.use(router.routes())
  return router
}

module.exports = applyRoutes
