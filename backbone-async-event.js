(function(Backbone) {
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

        var args = _.toArray(arguments);
        _.each([events, allEvents], function(events) {

          // trigger success or error event
          args = (type === 'success') ? [model] : args;
          args.splice(0, 0, type);
          events.trigger.apply(events, args);
          
          // trigger the complete event
          args.splice(0, 1, 'complete');
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
      return this._pendingAsyncEvents;
    };
  });
})(Backbone);
