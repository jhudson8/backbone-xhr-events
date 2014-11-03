backbone-xhr-events
====================
Do more than what the default [Backbone](http://http://backbonejs.org/) Model/Collection ```request``` event does for you.  The primary benefits are

* Use events to bind to ```success```/```error```/```complete``` events for each request (and an additional ```data``` event)
* Emit type specific XHR events to allow for focused binding
* Give ability to see if a model currently has any pending XHR activity
* Provide a global event bus to bind to all Model/Collection XHR activity
* Allow requests to be intercepted to, for example, return cached content
* Provide an additional ```data``` event to intercept and override response data before it is returned to the Model/Collection
* Provide event forwarding capabilities so other objects can simulate XHR activity to match another Model/Collection
* Make all event names and additional attributes overrideable to meet the needs of your particular project
* Give external entities a way to monitor ajax activity on your Collections and Models


[View the fancydocs](http://jhudson8.github.io/fancydocs/index.html#project/jhudson8/backbone-xhr-events)


Sections
--------
### General Usage Examples
Bind to a model to listen to all XHR activity
```
model.on('xhr', function(method, context) {
  // method is "read", "save", or "delete" or custom (Backbone.sync method)
  // context is a Backbone.Events to bind to XHR lifecycle events

  context.on('complete', function(type, {type specific args}) {
    // type will either be "success" or "error" and the type specific args are the same as what is provided to the respective events
    // this will be called when the XHR succeeds or fails
  });
  context.on('success', function(model) {
    // this will be called after the XHR succeeds
  });
  context.on('error', function(model, xhr, type, error) {
    // this will be called if the XHR fails
  });
});
```

Bind to a model to listen to only fetches
```
model.on('xhr:read', function(context) {
  ...
});
```

Override the XHR payload or cache it
```
model.on('xhr', function(method, context) {
  context.on('data', function(data, status, xhr, context) {
    // wrap the response as a "response" attribute
    context.response = { response: data };
    // cache the response
    if (method === 'read') {
      _cacheFetchResponse(JSON.stringify(data));
    }
  });
});
```

Intercept a request and return a cached payload
```
Backbone.xhrEvents.on('xhr', function(method, model, context) {
  var url = context.options.url;
  if (context.method === 'read') {
    var cachedResult = _getFetchCache(url);
    if (cachedResult) {
      context.intercept = function(options) {
        options.success(JSON.parse(cachedResult), 'success');
      }  
    }
  }
});
```

Make a successful XHR look like a failure
```
model.on('xhr', function(method, context) {
  context.on('data', function(data, status, xhr, context) {
    if (!context.preventDefault) {
      // we don't want to call success/error callback more than once
      context.preventDefault = true;

      // provide the parameters that you would have wanted coming back directly from the $.ajax callback
      context.options.error(...);
    }
  });
});
```

Set a default timeout on all XHR activity
```
Backbone.xhrEvents.on('xhr', function(method, model, context) {
  context.options.timeout = 3000;
});
```

Determine fetch status of a model
```
model.fetch();
!!model.xhrActivity === true;

// model fetch complete now
!!model.xhrActivity === false;

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

// forward events for a specific Backbone.sync method
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

In addition, the following read only attributes are applicable

* ***options***: the Backbone.ajax options
* ***xhr***: the actual XMLHttpRequest
* ***method***: the Backbone.sync method
* ***model***: the associated model

These attributes can be set on the context to alter lifecycle behavior

* ***intercept***: set this value with a callback function(options) which will prevent further execution and execute the callback
* ***preventDefault***: set this value as true when binding to the 'data' event if you want to alter success/error behavior (you must call options.success or options.error manually)

### Overrides
Almost all event names and model/global attributes can be overridden to suit your needs.

* ***Backbone.xhrCompleteEventName***: the event triggered on a model/collection when all XHR activity has completed (default: ```xhr:complete```)
* ***Backbone.xhrModelLoadingAttribute***: the model attribute which can be used to return an array of all current XHR request events and determind if the model/collection has current XHR activity (default: ```xhrActivity```)
* ***Backbone.xhrEventName***: the event triggered on models/collection and the global bus to signal an XHR request (default: ```xhr```)
* ***Backbone.xhrGlobalAttribute***: global event handler attribute name (on Backbone) used to subscribe to all model xhr events (default: ```xhrEvents```)


API: Events
-----------
### Model / Collection events

#### "xhr" (method, context)
* ***method***: the Backbone sync method (by default, "read", "update", or "delete")
* ***context***: the request context (see "Request Context" section)

Emitted when any XHR activity occurs

```
model.on('xhr', function(method, context) {
  // method is "read", "save", or "delete" or custom (Backbone.sync method)
  // context is a Backbone.Events to bind to XHR lifecycle events

  context.on('complete', function(type, {type specific args}) {
    // type will either be "success" or "error" and the type specific args are the same as what is provided to the respective events
    // this will be called when the XHR succeeds or fails
  });
  context.on('success', function(model) {
    // this will be called after the XHR succeeds
  });
  context.on('error', function(model, xhr, type, error) {
    // this will be called if the XHR fails
  });
});
```

#### "xhr:{method}" (context)
* ***method***: the Backbone sync method (by default, "read", "update", or "delete")
* ***context***: the request context (see "Request Context" section)

Emitted when only XHR activity matching the method in the event name occurs

```
model.on('xhr:read', function(method, context) {
  ...
});
```

#### "xhr:complete" ()

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


API
-----------
### Backbone.Model / Backbone.Collection

#### whenFetched (successCallback, errorCallback)
* ***successCallback***: function to be called when the model/collection has been fetched
* ***errorCallback***: function to be called when if model/collection fetch failed

Initiate a fetch if not already fetching or fetched.  Once the model/collection has been fetch, execute the appropriate callback.


### Backbone

#### forwardXhrEvents (sourceModel, destModel[, method]) or (sourceModel, destModel, autoStopFunc)
* ***sourceModel***: the originator model of the XHR events
* ***destModel***: the receiver or proxy of the source model XHR events
* ***method***: the optional Backbone.sync method to filter the forwarded events
* ***autoStopFunc***: callback function that, if provided, will stop the forwarding after the function completes execution

Forward XHR events that originate in ```sourceModel``` to ```destModel```.  These events will also be emitted in ```sourceModel``` as well.

This can be useful if you have a composite model containing sub-models and want to aggregate xhr activity to the composite model.

```
var CompositeModel = Backbone.Model.extend({
  initialize: function() {
    // when model1 or model2 have xhr activity, "this" will expose the same xhr events
    Backbone.Model.prototype.initialize.apply(this, arguments);
    this.model1 = new Backbone.Model();
    Backbone.forwardXhrEvents(this.model1, this);
    this.model2 = new Backbone.Model();
    Backbone.forwardXhrEvents(this.model2, this);
  }
});
```

#### stopXhrForwarding (sourceModel, destModel[, method])
* ***sourceModel***: the originator model of the XHR events
* ***destModel***: the receiver or proxy of the source model XHR events
* ***method***: the optional Backbone.sync method to filter the forwarded events

Stop forwarding XHR events.  This must match a previous ```forwardXhrEvents``` call.
