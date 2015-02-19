/*global it, require, describe, beforeEach, afterEach */

var chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  expect = chai.expect,
  Backbone = require('backbone'),
  _ = require('underscore'),
  $ = {
    options: [],
    ajax: function (options) {
      var xhr = {
        abort: sinon.spy()
      };
      options.xhr = xhr;
      var doContinue = options.beforeSend('xhr', options);
      if (doContinue === false) {
        return;
      }
      this.options.push(options);
      return xhr;
    },
    success: function () {
      if (this.options.length) {
        var _options = this.options.splice(0, 1)[0];
        if (_options.xhr.abort.callCount === 0) {
          _options.success.apply(this, arguments);
        }
      } else {
        throw new Error('no available options');
      }
    },
    error: function () {
      var options = this.options.pop();
      if (options.error) {
        options.error.apply(options, arguments);
      }
    }
  };
require('../index')(Backbone, _);
chai.use(sinonChai);
Backbone.$ = $;

describe("backbone-xhr-events", function () {
  var XhrModel = Backbone.Model.extend({
      url: 'foo'
    }),
    clock,
    model;

  beforeEach(function () {
    model = new XhrModel();
    clock = sinon.useFakeTimers();
  });
  afterEach(function () {
    $.options = [];
    clock.restore();
  });



  describe("examples", function () {
    describe('Prevent duplicate concurrent submission of any XHR request', function() {

      function onXhr(context, method) {
        context.on('before-send', function(xhr, settings) {
          var options = context.options;
          // see if any current XHR activity matches this request
          var match = _.find(model.xhrActivity, function(_context) {
            return options.url === _context.options.url &&
              method === _context.method &&
              _.isEqual(settings.data, _context.settings.data);
          });
          if (match) {
            var handler = context.preventDefault();
            match.on('success', function() {
              handler.success.apply(handler, arguments);
            });
            match.on('error', function() {
              handler.error.apply(handler, arguments);
            });
          }
        });
      }

      beforeEach(function() {
        sinon.spy($, 'ajax');
        sinon.spy(Backbone.Model.prototype, 'parse');
        model.url = function() {
          return 'foo/' + this.attributes.a;
        };
        Backbone.xhrEvents.on('xhr', onXhr);
      });
      afterEach(function() {
        $.ajax.restore();
        Backbone.Model.prototype.parse.restore();
        Backbone.xhrEvents.off('xhr', onXhr);
      });

      it('should bypass the 2nd request and allow the model to parse correctly', function() {
        var spy1 = sinon.spy(),
            spy2 = sinon.spy();
        model.fetch({success: spy1});
        expect($.options.length).to.eql(1);
        model.fetch({success: spy2});
        expect($.options.length).to.eql(1);

        $.success({foo: 'bar'});
        expect($.options.length).to.eql(0);
        expect(model.parse.callCount).to.eql(2);
        expect(spy1.callCount).to.eql(1);
        expect(spy2.callCount).to.eql(1);
        expect(model.attributes.foo).to.eql('bar');
      });

      it('should not bypass the 2nd fetch if url is different', function() {
        var spy1 = sinon.spy(),
            spy2 = sinon.spy();
        model.fetch({success: spy1});
        expect($.ajax.callCount).to.eql(1);
        model.set({a: 'b'});
        model.fetch({success: spy2});
        expect($.ajax.callCount).to.eql(2);

        $.success({r: 1});
        expect(model.parse.callCount).to.eql(1);
        expect($.options.length).to.eql(1);
        expect(model.attributes.r).to.eql(1);

        $.success({r: 2});
        expect(model.parse.callCount).to.eql(2);
        expect($.options.length).to.eql(0);
        expect(model.attributes.r).to.eql(2);
      });

      it('should not execute a 2nd destroy call with the same data', function() {
        var spy1 = sinon.spy(),
            spy2 = sinon.spy(),
            destroySpy = sinon.spy();

        model.set({id: 1});
        model.on('destroy', destroySpy);
        model.destroy({success: spy1});

        expect($.options.length).to.eql(1);
        model.destroy({success: spy2});
        expect($.options.length).to.eql(1);
        $.success({});
        expect(destroySpy.callCount).to.eql(2);
        expect(spy1.callCount).to.eql(1);
        expect(spy2.callCount).to.eql(1);

      });

      it('should not execute a 2nd destroy call with the same data', function() {
        var spy1 = sinon.spy(),
            spy2 = sinon.spy(),
            spy3 = sinon.spy();

        model.set({id: 1});
        model.save({c: 'd'}, {success: spy1});
        expect($.options.length).to.eql(1);
        model.save({c: 'd'}, {success: spy2});
        expect($.options.length).to.eql(1);
        model.save({e: 'f'}, {success: spy3});
        expect($.options.length).to.eql(2);
        $.success({});
        expect(spy1.callCount).to.eql(1);
        expect(spy2.callCount).to.eql(1);
        expect(spy3.callCount).to.eql(0);
        $.success({});
        expect(spy3.callCount).to.eql(1);
      });

    });

  });



  describe("whenFetched", function () {
    it("should return callback directly if already fetched", function () {
      var spy = sinon.spy();
      model.fetch();
      $.success({});
      model.whenFetched(spy);
      expect(spy).to.have.been.calledWith(model);
    });
    it("should initiate a fetch if not already fetched", function () {
      var spy = sinon.spy(),
          onFetch = sinon.spy();
      model.on('xhr:read', onFetch);
      model.whenFetched(spy);
      expect(onFetch.callCount).to.eql(1);
      $.success({});
      expect(spy).to.have.been.calledWith(model);
    });
    it("should initiate a fetch and call error handler when applicable", function () {
      var successSpy = sinon.spy(),
          errorSpy = sinon.spy();
      model.whenFetched(successSpy, errorSpy);
      $.error({});
      expect(errorSpy.callCount).to.eql(1);
      expect(successSpy.callCount).to.eql(0);
    });
    it("should connect to an ongoing fetch and not initiate a new one", function () {
      var spy = sinon.spy(),
          onFetch = sinon.spy();
      model.fetch();
      model.on('xhr:read', onFetch);
      model.whenFetched(spy);
      expect(onFetch.callCount).to.eql(0);
      $.success({});
      expect(spy).to.have.been.calledWith(model);
    });
    it("should connect to an ongoing fetch and fire error callback when applicable", function () {
      var successSpy = sinon.spy(),
          errorSpy = sinon.spy();
      model.fetch();
      model.whenFetched(successSpy, errorSpy);
      $.error({});
      expect(errorSpy.callCount).to.eql(1);
      expect(successSpy.callCount).to.eql(0);
    });
  });

  describe("standard model usage", function () {
    it("trigger 'all' xhr event", function () {
      var spy = sinon.spy();
      model.on('xhr', spy);
      model.fetch();

      expect(spy.callCount).to.eql(1);
      expect(spy.getCall(0).args[1]).to.eql('read');
      model.set({
        id: 1
      });
      model.destroy();
      expect(spy.getCall(1).args[1]).to.eql('delete');
      model.save();
      expect(spy.getCall(2).args[1]).to.eql('update');
    });

    it("trigger specific xhr event", function () {
      var spy = sinon.spy();
      model.on('xhr:read', spy);
      model.fetch();
      // the only param for specific xhr event will be the "event" object
      expect(_.isFunction(spy.getCall(0).args[0].on)).to.eql(true);

      spy = sinon.spy();
      model.on('xhr:delete', spy);
      model.set({
        id: 1
      });
      model.destroy();
      expect(_.isFunction(spy.getCall(0).args[0].on)).to.eql(true);

      spy = sinon.spy();
      model.on('xhr:update', spy);
      model.save();
      expect(_.isFunction(spy.getCall(0).args[0].on)).to.eql(true);
    });

    it("obey the 'event' option value", function () {
      var spy = sinon.spy();
      model.on('xhr:foo', spy);
      model.fetch({
        event: 'foo'
      });
      // the only param for specific xhr event will be the "event" object
      expect(_.isFunction(spy.args[0][0].on)).to.eql(true);
    });

    it("provide correct success and complete event parameters", function () {
      var success = sinon.spy(),
        complete = sinon.spy(),
        error = sinon.spy();
      model.on('xhr:read', function (events) {
        events.on('success', success);
        events.on('error', error);
        events.on('complete', complete);
      });

      var options = {
        foo: 'bar'
      };
      model.fetch(options);
      $.success({});
      expect(success.callCount).to.eql(1);
      expect(success.getCall(0).args[3].options.foo).to.eql('bar');
      expect(error.callCount).to.eql(0);
      expect(complete.callCount).to.eql(1);
      expect(complete.getCall(0).args[0]).to.eql('success');
    });

    it("provide correct error event parameters", function () {
      var success = sinon.spy(),
        complete = sinon.spy(),
        error = sinon.spy();
      model.on('xhr:read', function (events) {
        events.on('success', success);
        events.on('error', error);
        events.on('complete', complete);
      });

      model.fetch({
        foo: 'bar'
      });
      $.error('xhr', 'errorType', 'thrownError');
      expect(error.callCount).to.eql(1);
      expect(error.getCall(0).args[0]).to.eql('xhr');
      expect(error.getCall(0).args[1]).to.eql('errorType');
      expect(error.getCall(0).args[2]).to.eql('thrownError');
      expect(error.getCall(0).args[3].options.foo).to.eql('bar');
      expect(success.callCount).to.eql(0);
      expect(complete.callCount).to.eql(1);
      expect(complete.getCall(0).args[0]).to.eql('error');
    });

    it("use loading to return true if there is any current xhr activity", function () {
      expect(model.xhrActivity).to.eql(undefined);
      model.fetch();
      expect(!!model.xhrActivity).to.eql(true);
      $.success();
      expect(model.xhrActivity).to.eql(undefined);
      model.fetch();
      expect(!!model.xhrActivity).to.eql(true);
      $.error();
      expect(model.xhrActivity).to.eql(undefined);
    });

    it("triggers 'after-send' before 'success'", function () {
      var count = 0,
        origResponseData,
        successId,
        dataId,
        successSpy = function () {
          successId = count++;
        },
        afterSendSpy = function (data, status, xhr, responseType, context) {
          dataId = count++;
          origResponseData = data;
          context.data = {
            abc: "def"
          };
        },
        eventSpy = sinon.spy(function (context) {
          context.on('success', successSpy);
          context.on('after-send', afterSendSpy);
        });

      model.on('xhr', eventSpy);
      model.fetch({});
      expect(eventSpy.callCount).to.eql(1);
      $.success({"foo": "bar"}, 'status', 'xhr');
      expect(origResponseData).to.eql({"foo": "bar"});
      expect(dataId).to.eql(0);
      expect(successId).to.eql(1);
      expect(model.get('abc')).to.eql('def');
    });

    it("should allow 'context.finish' to be called from the 'after-send' event handler", function () {
      var successSpy = sinon.spy(),
        afterSendSpy = function (data, status, xhr, responseType, context) {
          var handler = context.preventDefault();
          setTimeout(function() {
            handler.success(data, status, xhr);
          }, 1);
        },
        eventSpy = sinon.spy(function (context) {
          context.on('success', successSpy);
          context.on('after-send', afterSendSpy);
        });

      model.on('xhr', eventSpy);
      model.fetch();
      $.success({"foo": "bar"}, 'status', 'xhr');
      expect(successSpy.callCount).to.eql(0);
      clock.tick(2);
      expect(successSpy.callCount).to.eql(1);
      expect(model.get('foo')).to.eql('bar');
    });

    it("triggers xhr:complete after all xhr activities have completed", function () {
      var spy = sinon.spy();
      model.on('xhr:complete', spy);
      model.fetch();
      expect(spy.callCount).to.eql(0);
      $.success();
      expect(spy.callCount).to.eql(1);

      // it.skip should not trigger on complete if there are other concurrent loads
      model.fetch();
      model.fetch();
      expect(spy.callCount).to.eql(1);
      $.success();
      expect(spy.callCount).to.eql(1);
      $.error();
      expect(spy.callCount).to.eql(2);
    });

    it("triggers xhr events for a global xhr handler", function () {
      var eventSpy = sinon.spy(),
        allEventsSpy = sinon.spy(),
        globalHandler = Backbone.xhrEvents;
      globalHandler.on('xhr', allEventsSpy);
      globalHandler.on('xhr:read', eventSpy);

      model.fetch({
        foo: 'bar'
      });
      expect(eventSpy.callCount).to.eql(1);
      var args = eventSpy.getCall(0).args;
      expect(!!args[0].trigger).to.eql(true);
      expect(args[0].options.foo).to.eql('bar');

      expect(allEventsSpy.callCount).to.eql(1);
      args = allEventsSpy.getCall(0).args;
      expect(!!args[0].trigger).to.eql(true);
      expect(args[0].options.foo).to.eql('bar');
      expect(args[1]).to.eql('read');
    });
  });

  describe("Context methods", function () {
    describe("abort", function() {
      it('should preventDefault on initial xhr event', function() {
        model.on('xhr:read', function(context) {
          context.abort();
        });
        expect($.options.length).to.eql(0);
      });
      it('should preventDefault on before-send', function() {
        model.on('xhr:read', function(context) {
          context.on('before-send', function() {
            context.abort();
          });
        });
        expect($.options.length).to.eql(0);
      });
      it('should xhr abort on initial xhr event next tick', function() {
        model.on('xhr:read', function(context) {
          _.defer(function() {
            context.abort();
          });
        });
        model.fetch();
        clock.tick(1);
        expect($.options.length).to.eql(1);
        expect($.options[0].xhr.abort.callCount).to.eql(1);
      });
    });
  });

  describe("XHR forwarding", function () {
    it('should forward events and handle fetch success conditions appropriately', function () {
      var successModel,
        successSpy = sinon.spy(function (data, status, xhr, context) {
          successModel = context.model;
        }),
        eventSpy = sinon.spy(function (events) {
          events.on('success', successSpy);
        }),
        sourceCompleteSpy = sinon.spy(),
        receiverCompleteSpy = sinon.spy(),
        source = new XhrModel({test: 'a'}),
        receiver = new Backbone.Model({test: 'b'});

      Backbone.forwardXHREvents(source, receiver);
      receiver.on('xhr:read', eventSpy);
      receiver.on('xhr:complete', receiverCompleteSpy);
      source.on('xhr:complete', sourceCompleteSpy);

      source.fetch();
      expect(eventSpy.callCount).to.eql(1);
      expect(source.hasBeenFetched).to.eql(undefined);
      expect(source.xhrActivity.length).to.eql(1);
      expect(receiver.xhrActivity.length).to.eql(1);
      $.success({});
      expect(successSpy.callCount).to.eql(1);
      expect(successModel).to.eql(source);
      expect(source.hasBeenFetched).to.eql(true);
      expect(receiver.hasBeenFetched).to.eql(undefined);
      expect(receiverCompleteSpy.callCount).to.eql(1);
      expect(sourceCompleteSpy.callCount).to.eql(1);
      expect(source.xhrActivity).to.eql(undefined);
      expect(receiver.xhrActivity).to.eql(undefined);

      // make sure things still work the next time
      source.fetch();
      expect(eventSpy.callCount).to.eql(2);
      expect(source.xhrActivity.length).to.eql(1);
      expect(receiver.xhrActivity.length).to.eql(1);
      $.success({});
      expect(successSpy.callCount).to.eql(2);
      expect(receiverCompleteSpy.callCount).to.eql(2);
      expect(sourceCompleteSpy.callCount).to.eql(2);

      // make sure we can cancel the forwarding
      Backbone.stopXHRForwarding(source, receiver);
      expect(source._eventForwarders).to.eql(undefined);
      source.fetch();
      expect(eventSpy.callCount).to.eql(2);
      expect(source.xhrActivity.length).to.eql(1);
      expect(receiver.xhrActivity).to.eql(undefined);
      $.success({});
      expect(successSpy.callCount).to.eql(2);
      expect(receiverCompleteSpy.callCount).to.eql(2);
      expect(sourceCompleteSpy.callCount).to.eql(3);

    });

    it('should only forward targeted events', function () {
      var successModel,
        successSpy = sinon.spy(function (model) {
          successModel = model;
        }),
        eventSpy = sinon.spy(function (context) {
          context.on('success', successSpy);
        }),
        source = new XhrModel(),
        receiver = new Backbone.Model();

      Backbone.forwardXHREvents(source, receiver, 'delete');
      receiver.on('xhr', eventSpy);
      source.fetch();
      $.success({});
      expect(successSpy.callCount).to.eql(0);

      source.set({
        id: 1
      });
      source.destroy();
      $.success({});
      expect(successSpy.callCount).to.eql(1);
    });

    it('should work with single use callback function', function () {
      var successModel,
        successSpy = sinon.spy(function (model) {
          successModel = model;
        }),
        eventSpy = sinon.spy(function (context) {
          context.on('success', successSpy);
        }),
        source = new XhrModel({
          sender: true
        }),
        receiver = new Backbone.Model({
          receiver: true
        });

      receiver.on('xhr', eventSpy);
      Backbone.forwardXHREvents(source, receiver, function () {
        source.fetch();
      });
      expect(source._eventForwarders).to.eql(undefined);
      // we should not be forwarding anymore
      $.success({});
      // but the success should still be forwarded since the fetch was called during forwarding
      expect(successSpy.callCount).to.eql(1);

      source.fetch();
      $.success({});
      // success should not be called again since we are no longer fowarding
      expect(successSpy.callCount).to.eql(1);
    });

  });

  describe('fetch state flag clearing', function() {
    it('should clear collection flags on reset', function() {
      var collection = new Backbone.Collection();
      collection.hasBeenFetched = true;
      collection.hadFetchError = true;
      collection.reset();
      expect(collection.hasBeenFetched).to.eql(false);
      expect(collection.hadFetchError).to.eql(false);
    });
    it('should clear model flags on clear', function() {
      var model = new Backbone.Model();
      model.hasBeenFetched = true;
      model.hadFetchError = true;
      model.clear();
      expect(model.hasBeenFetched).to.eql(false);
      expect(model.hadFetchError).to.eql(false);
    });
    it('should forward to Backbone.Model/Collection', function() {
      var model = new Backbone.Model();
      var collection = new Backbone.Collection();
      var resetSpy = sinon.spy();
      sinon.stub(model, 'set');
      collection.on('reset', resetSpy);
      model.clear();
      collection.reset();
      expect(model.set.callCount).to.eql(1);
      expect(resetSpy.callCount).to.eql(1);
    });
  });

});
