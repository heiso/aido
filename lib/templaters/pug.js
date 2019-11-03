const pug = require('pug')

/**
 * Renders a pug view and converts it with html2slack
 * @param {Object}   view           - An aido view
 * @param {String}   view.name      - The name of the view
 * @param {Boolean}  view.modal     - True if the view should be rendered as a Slack Dialog
 * @param {String}   view.template  - The view template in Pug
 * @param {Object}   locals         - The current Slash instance is used as context for rendering the view
 * @param {Object}   locals.state   - The state of the session with the current user
 * @param {Function} next           - This simply sends the templated HTML through html2slack
 * @returns {Object}
 */
async function template(view, locals, next) {
  const templatedHtml = pug.render(view.template ,locals)
  return next(templatedHtml)
}

module.exports = template
