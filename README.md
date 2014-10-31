backbone-async-event
====================
Do more than what the default Backbone Model/Collection ```request``` event does for you.  The primary benefits are

* Use events to bind to ```success```/```error```/```complete``` events for each request (and an additional ```data``` event)
* Emit type specific XHR events to allow for focused binding
* Give ability to see if a model currently has any pending XHR activity
* Provide a global event bus to bind to all Model/Collection XHR activity
* Allow requests to be intercepted to, for example, return cached content
* Provide an additional ```data``` event to intercept and override response data before it is returned to the Model/Collection
* Provide event forwarding capabilities so other objects can simulate XHR activity to match another Model/Collection
* Make all event names and additional attributes overrideable to meet the needs of your particular project

Give external entities a way to monitor ajax activity on your [backbone.js](http://backbonejs.org/).Collections and [backbone.js](http://backbonejs.org/).Models.


[View the fancydocs](http://jhudson8.github.io/fancydocs/index.html#project/jhudson8/backbone-async-event) (a friendlier view of the information below)


Sections
--------
### General Usage Examples
Bind to a model to listen to all XHR activity
```
model.on('xhr', function(type, context) {
  // type is (by default) "read", "save", or "delete"
  // context is a Backbone.Events to bind to XHR lifecycle events
  context.on('complete', function() {
    // this will be called when the XHR succeeds or fails
  });
  context.on('success', function(model) {
    // this will be called after the XHR succeeds
  });
});
```

Bind to a model to listen to only fetches
```
model.on('xhr:read', function(context) {
  ...
});
```

Override the XHR result
```
model.on('xhr', function(type, context) {
  context.on('data', function(data, status, xhr, context) {
    // wrap the response as a "response" attribute
    context.response = {response: data};
  });
});
```

Set a default timeout on all XHR activity
```
Backbone.xhrEvents.on('xhr', function(type, model, context) {
  context.options.timeout = 3000;
});
```

Intercept a request and return a cached result
```
Backbone.xhrEvents.on('xhr', function(type, model, context) {
  var url = context.options.url;
  var cachedResult = _cache[url];
  context.intercept = function(options) {
    options.success(cachedResult, 'success');
  }
});
```

Determine fetch status of a model
```
model.fetch();
!!model._xhrLoading === true;

// model fetch complete now
!!model._xhrLoading === false;

// if the model fetch succeeded
model.hasBeenFetched === true;
model.hadFetchError === false;

// if the model fetch has failed...
model.hadFetchError === true;
model.hasBeenFetched === false;
```

Forward xhr events to another model
(source model will continue to emit xhr events as well)
```
// forward all events
Backbone.forwardXhrEvents(sourceModel, receiverModel);
// stop forwarding all events
Backbone.stopXhrForwarding(sourceModel, receiverModel);

// forward events for a specific type
Backbone.forwardXhrEvents(sourceModel, receiverModel, 'read');
// stop forwarding all events
Backbone.stopXhrForwarding(sourceModel, receiverModel, 'read');

// forward events *only while the callback function is executed*
Backbone.forwardXhrEvents(sourceModel, receiverModel, function() {
  // any XHR activity that sourceModel executes will be emitted by
  // receiverModel as well
});
```

### Request Context
All XHR events provide a ```context``` as a parameter.  This is an object extending Backbone.Events and is used to bind to the XHR lifecycle events including
* ***success***: when the XHR has completed sucessfully
* ***error***: when the XHR has failed
* ***complete***: when the XHR has either failed or succeeded
* ***data***: before the model has handled the response

In addition, the following attributes are available
* ***options***: the Backbone.ajax options
* ***intercept***: set this value with a callback function(options) which will prevent further execution and execute the callback
* ***xhr***: the actual XMLHttpRequest
* ***method***: the Backbone.sync method
* ***model***: the associated model


API: Events
-----------
### Model / Collection events

#### "xhr" (method, context)
* ***method***: the Backbone sync method (by default, "read", "update", or "delete")
* ***context***: the request context (see "Request Context" section)

Emitted when any XHR activity occurs

#### "xhr:{method}" (context)
* ***method***: the Backbone sync method (by default, "read", "update", or "delete")
* ***context***: the request context (see "Request Context" section)

Emitted when only XHR activity matching the method in the event name occurs

### "xhr:complete" ()

Emitted when any XHR activity has completed and there is no more concurrent XHR activity


### Backbone.xhrEvents (global events)

#### "xhr" (method, model, context)
* ***method***: the Backbone sync method (by default, "read", "update", or "delete")
* ***model***: the associated model
* ***context***: the request context (see "Request Context" section)

Emitted when any XHR activity occurs

#### "xhr:{method}" (model, context)
* ***model***: the associated model
* ***context***: the request context (see "Request Context" section)

Emitted when only XHR activity matching the method in the event name occurs


### Backbone methods
#### forwardXhrEvents (sourceModel, destModel[, method]) or (sourceModel, destModel, autoStopFunc)
* ***sourceModel***: the originator model of the XHR events
* ***destModel***: the receiver or proxy of the source model XHR events
* ***method***: the optional Backbone.sync method to filter the forwarded events
* ***autoStopFunc***: callback function that, if provided, will stop the forwarding after the function completes execution

Forward XHR events that originate in ```sourceModel``` to ```destModel```.  These events will also be emitted in ```sourceModel``` as well.

#### stopXhrForwarding (sourceModel, destModel[, method])
* ***sourceModel***: the originator model of the XHR events
* ***destModel***: the receiver or proxy of the source model XHR events
* ***method***: the optional Backbone.sync method to filter the forwarded events

Stop forwarding XHR events
