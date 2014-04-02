var expect = chai.expect;


describe("backbone-async-event", function() {

  function respondSuccess() {
    $.ajax = function(options) {
      options.success && options.success({abc: 123});
    };
  }
  function respondError() {
    $.ajax = function(options) {
      options.error && options.error('foo');
    };
  }

  var AsyncModel = Backbone.Model.extend({
        url: 'foo'
      }),
      model,
      event,
      _ajax = $.ajax;

  beforeEach(function() {
    model = new AsyncModel();
  });
  afterEach(function() {
    $.ajax = _ajax;
  });

  describe("test", function() {
    it("trigger 'all' async event", function() {
      respondSuccess();

      var spy = sinon.spy();
      model.on('async', spy);
      model.fetch();

      expect(spy.args[0][0]).to.eql('read');
      model.set({id: 1});
      model.destroy();
      expect(spy.args[1][0]).to.eql('delete');
      model.save();
      expect(spy.args[2][0]).to.eql('update');
    });

    it("trigger specific async event", function() {
      respondSuccess();

      var spy = sinon.spy();
      model.on('async:read', spy);
      model.fetch();
      // the only param for specific async event will be the "event" object
      expect(_.isFunction(spy.args[0][0].on)).to.eql(true);

      spy = sinon.spy();
      model.on('async:delete', spy);
      model.set({id: 1});
      model.destroy();
      expect(_.isFunction(spy.args[0][0].on)).to.eql(true);

      spy = sinon.spy();
      model.on('async:update', spy);
      model.save();
      expect(_.isFunction(spy.args[0][0].on)).to.eql(true);
    });

    it("obey the 'event' option value", function() {
      respondSuccess();

      var spy = sinon.spy();
      model.on('async:foo', spy);
      model.fetch({event: 'foo'});
      // the only param for specific async event will be the "event" object
      expect(_.isFunction(spy.args[0][0].on)).to.eql(true);
    });

    it("provide an event object for binding to success events", function() {
      respondSuccess();

      var success = 0,
          complete = 0,
          error = 0;
      model.on('async:read', function(events) {
        events.on('success', function(_model) {
          expect(arguments.length).to.eql(1);
          expect(_model).to.eql(model);
          success++;
        });
        events.on('complete', function(_model) {
          expect(arguments.length).to.eql(1);
          expect(_model).to.eql(model);
          complete++;
        });
        events.on('error', function() {
          console.log(arguments);
          error++;
        });
      });

      model.fetch();
      expect(success).to.eql(1);
      expect(complete).to.eql(1);
      expect(error).to.eql(0);
    });

    it("provide an event object for binding to error events", function() {
      respondError();

      var success = 0,
          complete = 0,
          error = 0;
      model.on('async:read', function(events) {
        events.on('success', function(_model) {
          success++;
        });
        events.on('complete', function(value) {
          // params should be proxied staight as we get them
          expect(arguments.length).to.eql(1);
          expect(value).to.eql('foo');
          complete++;
        });
        events.on('error', function(value) {
          // params should be proxied staight as we get them
          expect(arguments.length).to.eql(1);
          expect(value).to.eql('foo');
          error++;
        });
      });

      model.fetch();
      expect(success).to.eql(0);
      expect(complete).to.eql(1);
      expect(error).to.eql(1);
    });

  });
});
