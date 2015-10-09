'use strict'

let Match = require('pario-match')
let Util = require('util')
let _ = require('lodash')

let identity = o => o

let sprintf = Util.format

let failwith = function() {
  return () => {
    let msg = sprintf.apply(this, arguments)
    throw new Error(msg)
  }
}

let getBindings = bindings => context =>
  _.reduce(
    bindings,
    (acc, pair, key) => {
      let matchMsg = pair[1]
      let val = _.get(context, key)
      let match = pair[0](identity)
        .else( failwith(
          'Cannot bind to context, `%s` must be a %s, but got %j',
          key,
          matchMsg,
          val
        ) )

      return _.set(
        acc,
        key,
        match.bind(val)
      )
    }, Object()
  )

let getConfig = context => getBindings({
  'config.get':         [ Match().type(Function), 'function' ],
  'config.getResource': [ Match().type(Function), 'function' ]
})(context)

let getLog = Match()
  .type({ createLogger: Function })( _.spread( identity ))
  .else( val => failwith('Cannot bind to context, `%s` must be a function, but got %j', val)() )
  .bind

let getDriver = Match()
  .get({ driverType: String })( _.spread( driverType =>
    getBindings({
      subscribe:  [ Match().type(Function), 'function' ],
      publish:    [ Match().type(Function), 'function' ],
      on:         [ Match().type(Function), 'function' ],
      connect:    [ Match().type(Function), 'function' ]
    })(require('./drivers')(driverType))
  ))
  .else( val => failwith('Cannot bind to context, `%s` must be a string, but got %j', val)() )
  .bind

module.exports = context => {
  let config = getConfig(context)
  let log = getLog(context)('pubsub')
  let driver = getDriver(context)

  let pubsubConfig = config.getResource(
    config.get('pubsub.resourceType'),
    config.get('pubsub.resourceKey')
  )

  driver.connect(pubsubConfig)
  return driver
}
