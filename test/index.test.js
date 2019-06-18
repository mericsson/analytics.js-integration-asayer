'use strict'

var Analytics = require('@segment/analytics.js-core').constructor
var sandbox = require('@segment/clear-env')
var tester = require('@segment/analytics.js-integration-tester')
var Asayer = require('../lib/')

describe('asayer', function () {
  var analytics
  var asayer

  beforeEach(function () {
    analytics = new Analytics()
    analytics.use(tester)
  })

  afterEach(function () {
    analytics.restore()
    analytics.reset()
    asayer.reset()
    sandbox()
  })

  describe('before loading', function () {
    it('should call #load', function () {
      asayer = new Asayer({ 'sid': '1234' })
      analytics.use(Asayer)
      analytics.add(asayer)
      analytics.stub(asayer, 'load')
      analytics.initialize()
      analytics.called(asayer.load)
    })

    it('should not call #load for wrong sid', function () {
      asayer = new Asayer({ 'sid': 'wrong' })
      analytics.use(Asayer)
      analytics.add(asayer)
      analytics.stub(asayer, 'load')
      analytics.initialize()
      analytics.didNotCall(asayer.load)
    })
  })

  describe('after loading', function () {
    beforeEach(function (done) {
      asayer = new Asayer({ 'sid': '1234' })
      analytics.use(Asayer)
      analytics.add(asayer)
      analytics.once('ready', done)
      analytics.initialize()
    })

    describe('#identify', function () {
      beforeEach(function () {
        analytics.stub(window.asayer, 'vars')
      })

      it('should send anonymousId', function () {
        analytics.identify()
        analytics.called(window.asayer.vars)
        var vars = window.asayer.vars.args[0][0]
        analytics.assert(vars && vars.segment_anonymous_id)
      })

      it('should send userId', function () {
        analytics.identify('1')
        analytics.called(window.asayer.vars, 'segment_user_id', '1')
      })

      it('should send only safe traits', function () {
        analytics.identify('1', { 'email': 'hello@asayer.io', title: { hide: 'me' }, phone: true, unknown: 'custom' })
        var vars = window.asayer.vars.args[1][0]
        analytics.assert(vars && vars.segment_email === 'hello@asayer.io' && !vars.segment_title && !vars.segment_phone && !vars.unknown)
      })
    })

    describe('#track', function () {
      beforeEach(function () {
        analytics.stub(window.asayer, 'event')
      })

      it('should send event properties', function () {
        analytics.track('segment', { test: 'success' })
        analytics.called(window.asayer.event, 'segment', { test: 'success' })
      })

      it('should not send non-object properties', function () {
        analytics.track('segment', [1, 2, 3])
        analytics.didNotCall(window.asayer.event)
      })
    })
  })
})
