/*global it, describe, beforeEach, afterEach */

var chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  expect = chai.expect,
  Backbone = require('backbone'),
  _ = require('underscore'),
  $ = {
    options: [],
    ajax: function (options) {
      this.options.push(options);
    },
    success: function () {
      var options = this.options.pop();
      if (options.success) {
        options.success.apply(options, arguments);
      }
    },
    error: function () {
      var options = this.options.pop();
      if (options.error) {
        options.error.apply(options, arguments);
      }
    }
  };
require('../index')(Backbone);
chai.use(sinonChai);
Backbone.$ = $;

describe("backbone-xhr-events", function () {
  var XhrModel = Backbone.Model.extend({
      url: 'foo'
    }),
    model,
    event;

  beforeEach(function () {
    model = new XhrModel();
  });
  afterEach(function () {
    $.options = [];
  });

  describe("standard model usage", function () {
    it("trigger 'all' xhr event", function () {
      var spy = sinon.spy();
      model.on('xhr', spy);
      model.fetch();

      expect(spy.callCount).to.eql(1);
      expect(spy.getCall(0).args[0]).to.eql('read');
      model.set({
        id: 1
      });
      model.destroy();
      expect(spy.getCall(1).args[0]).to.eql('delete');
      model.save();
      expect(spy.getCall(2).args[0]).to.eql('update');
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
      expect(success.getCall(0).args[0]).to.eql(model);
      expect(success.getCall(0).args[1].options.foo).to.eql('bar');
      expect(error.callCount).to.eql(0);
      expect(complete.callCount).to.eql(1);
      expect(complete.getCall(0).args[0]).to.eql('success');
      expect(complete.getCall(0).args[1]).to.eql(model);
      expect(complete.getCall(0).args[2].options.foo).to.eql('bar');
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
      expect(error.getCall(0).args[0]).to.eql(model);
      expect(error.getCall(0).args[1]).to.eql('xhr');
      expect(error.getCall(0).args[2]).to.eql('errorType');
      expect(error.getCall(0).args[3]).to.eql('thrownError');
      expect(error.getCall(0).args[4].options.foo).to.eql('bar');
      expect(success.callCount).to.eql(0);
      expect(complete.callCount).to.eql(1);
      expect(complete.getCall(0).args[0]).to.eql('error');
      expect(complete.getCall(0).args[1]).to.eql(model);
      expect(complete.getCall(0).args[2]).to.eql('xhr');
      expect(complete.getCall(0).args[3]).to.eql('errorType');
      expect(complete.getCall(0).args[4]).to.eql('thrownError');
      expect(complete.getCall(0).args[5].options.foo).to.eql('bar');
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

    it("triggers 'data' before 'success'", function () {
      var count = 0,
        origResponseData,
        successId,
        dataId,
        successSpy = function () {
          successId = count++;
        },
        dataSpy = function (data, status, xhr, context) {
          dataId = count++;
          origResponseData = data;
          context.response = {
            abc: "def"
          };
        },
        eventSpy = sinon.spy(function (type, events) {
          events.on('success', successSpy);
          events.on('data', dataSpy);
        });

      model.on('xhr', eventSpy);
      model.fetch({});
      expect(eventSpy.callCount).to.eql(1);
      $.success('{"foo": "bar"}', 'status', 'xhr');
      expect(origResponseData).to.eql('{"foo": "bar"}');
      expect(dataId).to.eql(0);
      expect(successId).to.eql(1);
      expect(model.get('abc')).to.eql('def');
    });

    it("triggers xhr:complete after all xhr activities have completed", function () {
      var spy = sinon.spy();
      model.on('xhr:complete', spy);
      model.fetch();
      expect(spy.callCount).to.eql(0);
      $.success();
      expect(spy.callCount).to.eql(1);

      // it should not trigger on complete if there are other concurrent loads
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
      expect(args[0]).to.eql(model);
      expect(!!args[1].trigger).to.eql(true);
      expect(args[1].options.foo).to.eql('bar');

      expect(allEventsSpy.callCount).to.eql(1);
      args = allEventsSpy.getCall(0).args;
      expect(args[0]).to.eql('read');
      expect(args[1]).to.eql(model);
      expect(!!args[2].trigger).to.eql(true);
      expect(args[2].options.foo).to.eql('bar');
    });
  });

  describe("XHR forwarding", function () {
    it('should forward events and handle fetch success conditions appropriately', function () {
      var successModel,
        successSpy = sinon.spy(function (model) {
          successModel = model;
        }),
        eventSpy = sinon.spy(function (events) {
          events.on('success', successSpy);
        }),
        sourceCompleteSpy = sinon.spy(),
        receiverCompleteSpy = sinon.spy(),
        source = new XhrModel(),
        receiver = new Backbone.Model();

      Backbone.forwardXhrEvents(source, receiver);
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
      Backbone.stopXhrForwarding(source, receiver);
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
        eventSpy = sinon.spy(function (type, events) {
          events.on('success', successSpy);
        }),
        sourceCompleteSpy = sinon.spy(),
        receiverCompleteSpy = sinon.spy(),
        source = new XhrModel(),
        receiver = new Backbone.Model();

      Backbone.forwardXhrEvents(source, receiver, 'delete');
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

    it('should work with single use callbak function', function () {
      var successModel,
        successSpy = sinon.spy(function (model) {
          successModel = model;
        }),
        eventSpy = sinon.spy(function (type, events) {
          events.on('success', successSpy);
        }),
        sourceCompleteSpy = sinon.spy(),
        receiverCompleteSpy = sinon.spy(),
        source = new XhrModel(),
        receiver = new Backbone.Model();

      receiver.on('xhr', eventSpy);
      Backbone.forwardXhrEvents(source, receiver, function () {
        source.fetch();
      });
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

});
