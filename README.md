backbone-async-event
====================

Simple backbone plugin that emits specific events when ajax requests are made.  This is meaningful to allow external sources to plug in to the model async operations.

Installation
------------
* Browser: backbone-async-event.js/backbone-async-event.min.js; *after* backbone.js
* CommonJS: ```require('backbone-async-event')(require('backbone'));```

Usage
-----
Any time ajax requests are made using Backbone.sync (all of the backbone ajax requests are), a global ```sync``` event and a scoped ```sync:{method}``` event will be fired.

These events provide a separate event as a parameter to allow connection lifecycle binding.  It is easier explained with an example:

```
var model = new MyModel();

// bind to *all* async events
model.on('async', function(eventName, asyncEvents) {
  asyncEvents.on('success', function(model) {
    // the operation was successful and the updated model is provided as a parameter
  });
  asyncEvents.on('error', function(model, xhr, status, error) {
    // the operation failed and the parameters are proxied straight from the $.ajax error call
  });
  asyncEvents.on('complete', function(type (error|success), model, [xhr, status, error]) {
    // the operation was successful or errored and the payload will either look like a success or error payload
  });
});

// bind to a single async event
model.on('async:read', function(asyncEvents) {
  // notice that the event name is not provided to this function
});

```

Event Names
-----------
The event name can be overridden by setting the ```event``` attribute on the request options but otherwise it will be:
 * fetch: ```read```
 * save: ```update```
 * destroy: ```delete```

To override the event name, use the ```event``` fetch option.
```
model.fetch({event: 'foo'})
```
or call Backbone.sync directly
```
Backbone.sync(asyncEvent, model, options);
```
