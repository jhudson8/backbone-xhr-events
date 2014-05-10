var chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    expect = chai.expect,
    Backbone = require('backbone'),
    _ = require('underscore'),
    $ = {
        options: [],
        ajax: function(options) {
          this.options.push(options);
        },
        success: function() {
          var options = this.options.pop();
          options.success && options.success.apply(options, arguments);
        },
        error: function() {
          var options = this.options.pop();
          options.error && options.error.apply(options, arguments);
        }
      };
require('../backbone-async-event')
chai.use(sinonChai);
Backbone.$ = $;

describe("backbone-async-event", function() {
  var AsyncModel = Backbone.Model.extend({
        url: 'foo'
      }),
      model,
      event;

  beforeEach(function() {
    model = new AsyncModel();
  });
  afterEach(function() {
    $.options = [];
  });

  describe("test", function() {
    it("trigger 'all' async event", function() {
      var spy = sinon.spy();
      model.on('async', spy);
      model.fetch();

      expect(spy.callCount).to.eql(1);
      expect(spy.getCall(0).args[0]).to.eql('read');
      model.set({id: 1});
      model.destroy();
      expect(spy.getCall(1).args[0]).to.eql('delete');
      model.save();
      expect(spy.getCall(2).args[0]).to.eql('update');
    });

    it("trigger specific async event", function() {
      var spy = sinon.spy();
      model.on('async:read', spy);
      model.fetch();
      // the only param for specific async event will be the "event" object
      expect(_.isFunction(spy.getCall(0).args[0].on)).to.eql(true);

      spy = sinon.spy();
      model.on('async:delete', spy);
      model.set({id: 1});
      model.destroy();
      expect(_.isFunction(spy.getCall(0).args[0].on)).to.eql(true);

      spy = sinon.spy();
      model.on('async:update', spy);
      model.save();
      expect(_.isFunction(spy.getCall(0).args[0].on)).to.eql(true);
    });

    it("obey the 'event' option value", function() {
      var spy = sinon.spy();
      model.on('async:foo', spy);
      model.fetch({event: 'foo'});
      // the only param for specific async event will be the "event" object
      expect(_.isFunction(spy.args[0][0].on)).to.eql(true);
    });

    it("provide an event object for binding to success events", function() {
      var success = sinon.spy(),
          complete = sinon.spy(),
          error = sinon.spy();
      model.on('async:read', function(events) {
        events.on('success', success);
        events.on('error', error);
        events.on('complete', complete);
      });

      var options = {foo: 'bar'};
      model.fetch(options);
      $.success({});
      expect(success.callCount).to.eql(1);
      expect(success.getCall(0).args[0]).to.eql(model);
      expect(success.getCall(0).args[1].foo).to.eql('bar');
      expect(error.callCount).to.eql(0);
      expect(complete.callCount).to.eql(1);
      expect(complete.getCall(0).args[0]).to.eql('success');
      expect(complete.getCall(0).args[1]).to.eql(model);
      expect(complete.getCall(0).args[2].foo).to.eql('bar');
      expect(complete.getCall(0).args[1]).to.eql(model);
    });

    it("provide an event object for binding to error events", function() {
      var success = sinon.spy(),
          complete = sinon.spy(),
          error = sinon.spy();
      model.on('async:read', function(events) {
        events.on('success', success);
        events.on('error', error);
        events.on('complete', complete);
      });

      model.fetch({foo: 'bar'});
      $.error('xhr', 'errorType', 'thrownError');
      expect(error.callCount).to.eql(1);
      expect(error.getCall(0).args[0]).to.eql(model);
      expect(error.getCall(0).args[1]).to.eql('errorType');
      expect(error.getCall(0).args[2]).to.eql('thrownError');
      expect(error.getCall(0).args[3].foo).to.eql('bar');
      expect(success.callCount).to.eql(0);
      expect(complete.callCount).to.eql(1);
      expect(complete.getCall(0).args[0]).to.eql('error');
      expect(complete.getCall(0).args[1]).to.eql(model);
      expect(complete.getCall(0).args[2]).to.eql('errorType');
      expect(complete.getCall(0).args[3]).to.eql('thrownError');
      expect(complete.getCall(0).args[4].foo).to.eql('bar');
    });

    it("implements isLoading to return true if there is any current async activity", function() {
      expect(model.isLoading()).to.eql(false);
      model.fetch();
      expect(!!model.isLoading()).to.eql(true);
      $.success();
      expect(model.isLoading()).to.eql(false);
      model.fetch();
      expect(!!model.isLoading()).to.eql(true);
      $.error();
      expect(!!model.isLoading()).to.eql(false);
    });

    it("triggers async:load-complete after all async activities have completed", function() {
      var spy = sinon.spy();
      model.on('async:load-complete', spy);
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
  });
});
