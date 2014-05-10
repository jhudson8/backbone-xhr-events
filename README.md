backbone-async-event
====================

Simple backbone plugin that emits specific events when ajax requests are made.  This is meaningful to allow external sources to plug in to the model asynchronous operations.

Installation
------------
* Browser: backbone-async-event.js/backbone-async-event.min.js; *after* [backbone.js](http://backbonejs.org/)
* CommonJS: ```require('backbone-async-event');```

Usage
-----
Any time ajax requests are made using Backbone.sync (all of the backbone ajax requests are), a ```sync``` event and a scoped ```sync:{event name}``` event will be triggered on the model that initiated the ajax requests.

Events
------
* ```sync```: function({event name}, {lifecycle events});
* ```sync:{event name}```: function({lifecycle events})

The ```lifecycle events``` is a [Backbone.Events](http://backbonejs.org/#Events).  The follwing events may be triggered:
* success(model, options): triggered when/if the ajax request was successful
* error(model, errorType, thrownError, options): triggered when/if the ajax request failed
* complete({"error"|"success"}, model[, errorType, thrownError], options); triggered on either success or error

Examples
--------
```
var model = new MyModel();

// bind to *all* async events
model.on('async', function(eventName, lifecycleEvents) {
  lifecycleEvents.on('success', function(model, options) {
    // the operation was successful and the updated model is provided as a parameter
  });
  lifecycleEvents.on('error', function(model, errorType, error, options) {
    // the operation failed and the parameters are proxied straight from the $.ajax error call
  });
  lifecycleEvents.on('complete', function(type, model) {
    // the operation was successful or errored and the payload will either look like a success or error payload
    // type is either "success" or "error"
  });
});

// bind to a single async event
model.on('async:read', function(lifecycleEvents) {
  // notice that the event name is not provided to this function
});

```

Event Names
-----------
The async event name can be overridden by setting the ```event``` attribute on the request options but otherwise it will be:
 * fetch: ```read```
 * save: ```update```
 * destroy: ```delete```

To override the event name, use the ```event``` fetch option.
```
model.fetch({event: 'foo'})
```
or call Backbone.sync directly
```
Backbone.sync(asyncEventName, model, options);
```
