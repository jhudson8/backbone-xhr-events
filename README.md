backbone-async-event
====================

***Problem:*** There is no way to tell if a model or collection is currently performing an ajax operation.  And, depending on the operation, there is no way to tell when that operation has been completed.

***Solution:*** Trigger an event on the model or collection to indicate that ajax activity has begun.  Provide as a parameter to this event a Backbone.Events object so that the lifecycle of that specific ajax request can be monitored.

***To see an example app using this (and other react plugins working together), [check this out](https://github.com/jhudson8/react-plugins-united-example)***


Installation
------------
* Browser: backbone-async-event.js/backbone-async-event.min.js; *after* [backbone.js](http://backbonejs.org/)
* CommonJS: ```require('backbone-async-event')(require('backbone'));```


Usage
-----
Any time ajax requests are made using Backbone.sync (all of the backbone ajax requests are), a ```sync``` event and a scoped ```sync:{event name}``` event will be triggered on the model that initiated the ajax requests.


Events
------
* ```sync```: function({event name}, {lifecycle events}, options);
* ```sync:{event name}```: function({lifecycle events}, options)

The ```lifecycle events``` is a [Backbone.Events](http://backbonejs.org/#Events).  The follwing events may be triggered:
* success(model, options): triggered when/if the ajax request was successful
* error(model, errorType, thrownError, options): triggered when/if the ajax request failed
* complete({"error"|"success"}, model[, errorType, thrownError], options); triggered on either success or error


Global Event Handler
--------------------
Aside from async events being triggered on the model, a global event handler can be used to capture all async events for all models.  The event signature is the same for the model async events except that the first parameter is the model that the async event is associated with.
```
Backbone.asyncHandler = myGlobalAsyncHandler;
// capture all async events for all models
myGlobalAsyncHandler.on('async', function(asyncEventName, model, lifecycleEvents, options) {
  ...
});
// capture only "read" async events for all models
myGlobalAsyncHandler.on('async:read', function(model, lifecycleEvents, options) {
  ...
});
```

Alternatively, ```Backbone.async``` is already available and will fire all events that a global event handler would.
```
Backbone.async.on('async:read', function(model, lifecycleEvents, options) {
  ...
});
```

Additional Model/Collection behavior
--------------------
A couple helper methods have been included to Backbone.Model and Backbone.Collection.

* ```isLoading()```: return a truthy (array of async events) if the Model/Collection has any current async activity
* ```hasBeenFetched```: true if the Model/Collection has previously been fetched (and the fetch response occured)
* ```hadFetchError```: true if the Model/Collection has a fetch error and no successful fetch after


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


Ajax Response Interception
----------------------
To incercept the ajax request and override the response (for example to incorporate a client response cache), the ```intercept``` attribute can be set on the sync options data with a function which is expected to either call options.success or options.error with a simulated response.
```
App.on('async', function(event, model, lifecycle, options) {
  options.intercept = function() {
    options.success(...);
  }
});
```
