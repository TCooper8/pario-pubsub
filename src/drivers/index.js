'use strict'

let Match = require('pario-match')

module.exports = Match()
  .type(String)( require )
  .else( val => {
    throw new Error('Expected driver type to be a string, but got ' + val)
  })
  .bind

