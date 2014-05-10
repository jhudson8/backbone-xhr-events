// commonjs impl for backbone-async-event
module.exports = function(Backbone) {
(function(Backbone, _) {
  // allow backbone to send async events on models
  var _sync = Backbone.sync;
  Backbone.sync = function(method, model, options) {

    options = options || {};
    var loads = model._pendingAsyncEvents = model._pendingAsyncEvents || [],
        eventName = options && options.event || method,
        events = _.extend({}, Backbone.Events),
        allEvents = _.extend({}, Backbone.Events);
    loads.push(allEvents);

    model.trigger('async', eventName, events);
    model.trigger('async:' + eventName, allEvents);

    function onComplete(type) {
      var _type = options[type];
      options[type] = function() {

        // options callback
        var _args = arguments;
        _type && _type.apply(this, _args);

        // remove the load entry
        var index = loads.indexOf(allEvents);
        if (index >= 0) {
          loads.splice(index, 1);
        }

        var _arguments = arguments;
        _.each([events, allEvents], function(events, index) {
          var args = _.toArray(_arguments);

          // trigger success or error event
          args.splice(0, 0, type);
          args.splice(1, 0, model);
          events.trigger.apply(events, args);

          // trigger the complete event
          args.splice(0, 0, 'complete');
          events.trigger.apply(events, args);
        });

        if (loads.length === 0) {
          model.trigger('async:load-complete');
          delete model._pendingAsyncEvents;
        }
      };
    }
    onComplete('success');
    onComplete('error');

    _sync.call(this, method, model, options);
  };

  _.each([Backbone.Model, Backbone.Collection], function(clazz) {
    clazz.prototype.isLoading = function() {
      if (this._pendingAsyncEvents && this._pendingAsyncEvents.length > 0) {
        // if we are loading, return the array of pending events as the truthy
        return this._pendingAsyncEvents;
      }
      return false;
    };
  });
}
)(Backbone, require('underscore'));
};
