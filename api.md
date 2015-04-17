backbone-xhr-events
====================
Do more than what the default [Backbone](http://http://backbonejs.org/) Model/Collection ```request``` event does for you.  The primary benefits are

* Provide robust lifecycle events (```before-send```, ```after-send```, ```success```, ```error```, ```complete```)
* Emit type specific XHR events to allow for focused binding
* Give ability to see if a model currently has any pending XHR activity
* Provide a global event bus to bind to all Model/Collection XHR activity
* Allow requests to be intercepted to, for example, return cached content
* Add ability to intercept and override response data before it is returned to the Model/Collection
* Provide event forwarding capabilities so other objects can simulate XHR activity to match another Model/Collection
* Make all event names and additional attributes overrideable to meet the needs of your particular project
* Give external entities a way to observe ajax activity on your Collections and Models


Installation
--------------

Browser:

```
    <script src=".../underscore[-min].js"></script>
    <script src=".../backbone[-min].js"></script>
    <script src=".../backbone-xhr-events[-min].js"></script>
```

CommonJS

```javascript
    require('backbone-xhr-events');
```

AMD

```javascript
    require(
      ['backbone-xhr-events'], function() {
      // don't do do anything with it... it's initialized now
    });
```


Sections
--------
### General Usage Examples

Listen to all XHR activity

```javascript
    Backbone.xhrEvents.on('xhr', function(context) {
      context.on('success', function() {
        // context.model has been updated
      });
    });
```

Override fetch XHR payload or cache it

```javascript
    Backbone.xhrEvents.on('xhr:read', function(context) {
      context.on('after-send', function(data, status, xhr, responseType) {

        // responseType will either be 'success' or 'error'
        if (responseType === 'success') {

          // wrap the response as a "response" attribute (just to show how to modify it)
          context.data = { response: data };

          // cache the response
          _cacheFetchResponse(JSON.stringify(data), context.xhrSettings.url);
        }
      });
    });
```

Intercept a fetch request and return a cached payload

```javascript
    Backbone.xhrEvents.on('xhr:read', function(context) {

      // use the "before-send" event (rather than just doing it here)
      // so we have access to the XHR settings to get the URL
      context.on('before-send', function(xhr, settings) {

        var cachedResult = _getFetchCache(settings.url);
        if (cachedResult) {
          context.preventDefault().success(JSON.parse(cachedResult), 'success');
        }
      });
    });
```

Make a successful XHR look like a failure

```javascript
    model.on('xhr', function(context) {

      context.on('after-send', function(data, status, xhr, responseType) {
        if (responseType === 'success') {

          // provide the parameters that you would have wanted coming back directly from the $.ajax callback
          context.preventDefault().error(xhr, 'error', 'Not Found');
        }
      });
    });
```

Alter the payload asynchronously after the initial response is returned

```javascript
    Backbone.xhrEvents.on('xhr', function(context) {

      context.on('after-send', function(data, status, xhr) {
        var handler = context.preventDefault();

        yourOwnGetDataAsyncMethod(function(data) {
          handler.success(data, status, xhr);
        });
      });
    });
```

Add simulated 1 second latency

```javascript
    Backbone.xhrEvents.on('xhr', function(context) {

      context.on('after-send', function(p1, p2, p3, responseType) {
        var handler = context.preventDefault();

        setTimeout(function() {
          var successOrErrorMethod = handler[responseType];
          successOrErrorMethod(p1, p2, p3);
        }, 1000);
      });
    });
```

Set a default connection timeout on all XHR activity

```javascript
    Backbone.xhrEvents.on('xhr', function(context) {
      context.options.timeout = 3000;
    });
```

Determine fetch status of a model

```javascript
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

```javascript
    // forward all events
    Backbone.forwardXHREvents(sourceModel, receiverModel);
    // and stop the fowarding
    Backbone.stopXHRForwarding(sourceModel, receiverModel);

    // forward events for a specific Backbone.sync method
    Backbone.forwardXHREvents(sourceModel, receiverModel, 'read');
    // and stop the fowarding
    Backbone.stopXHRForwarding(sourceModel, receiverModel, 'read');

    // forward events *only while the callback function is executed*
    Backbone.forwardXHREvents(sourceModel, receiverModel, function() {
      // any XHR activity that sourceModel executes will be emitted by
      // receiverModel as well
    });
```

Prevent duplicate concurrent submission of any XHR request

```javascript
    Backbone.xhrEvents.on('xhr', function(context) {
      var model = context.model,
          method = context.method;

      context.on('before-send', function(xhr, settings) {

        // see if any current XHR activity matches this request
        var match = _.find(model.xhrActivity, function(_context) {
          return _context.xhrSettings.url === settings.url
              && method === _context.method
              && _.isEqual(_context.xhrSettings.data, settings.data);
        });

        if (match) {
          var handler = context.preventDefault();
          // when the pending request comes back, simulate the same activity on this request
          match.on('success', handler.success);
          match.on('error', handler.error);
        }
      });
    });
```

Prevent the error callback if the request is aborted

```javascript
    Backbone.xhrEvents.on('xhr', function(context) {
      context.on('abort', function() {
        context.preventDefault().complete('abort');
      });
    });
```


### XHR Method Reference

// create, update, patch, delete, read
* ***fetch***: ***read*** method (```xhr:read```)
* ***destroy***: ***delete*** method (```xhr:destroy```)
* ***save*** (new): ***create*** method (```xhr:create```)
* ***save*** (existing): ***update*** (```xhr:update```)
* ***save*** (existing with options {patch: true}): ***patch*** (```xhr:patch```)

Custom Event

```
this.fetch({event: foo}) -> "xhr:foo"
```


### Overrides
Almost all event names and model/global attributes can be overridden to suit your needs.

* ***Backbone.xhrCompleteEventName***: the event triggered on a model/collection when all XHR activity has completed (default: ```xhr:complete```)
* ***Backbone.xhrModelLoadingAttribute***: the model attribute which can be used to return an array of all current XHR request events and determind if the model/collection has current XHR activity (default: ```xhrActivity```)
* ***Backbone.xhrEventName***: the event triggered on models/collection and the global bus to signal an XHR request (default: ```xhr```)
* ***Backbone.xhrGlobalAttribute***: global event handler attribute name (on Backbone) used to subscribe to all model xhr events (default: ```xhrEvents```)


### RequestContext

The RequestContext is the object provided as the only parameter with the ```xhr``` events.  It is the context providing the ability to bind to the request lifecycle events.

```javascript
    model.on('xhr', function(requestContext) { ... });
```

see the [RequestContext events](#project/jhudson8/backbone-xhr-events/api/Events) and [RequestContext functions and attributes](#project/jhudson8/backbone-xhr-events/package/RequestContext)


### RequestHandler

The RequestHandler is the response from [requestContext.preventDefault()](#project/jhudson8/backbone-xhr-events/method/RequestContext/preventDefault).  When ```preventDefault``` is called, the request lifecycle is halted.  When this happens, you *must* either call [success](#project/jhudson8/backbone-xhr-events/method/RequestHandler/success), [error](#project/jhudson8/backbone-xhr-events/method/RequestHandler/error), or [complete](l#project/jhudson8/backbone-xhr-events/method/RequestHandler/complete).



API: Events
-----------

### RequestContext events

#### "before-send" (xhr, settings, requestContext)

* ***xhr***: the XMLHTTPRequest
* ***settings***: the actual jquery settings object sent by Backbone.sync
* ***requestContext***: the same object passed to the ```xhr``` event.  It is provided in case the function does not have access to the closure scope.

Triggered after Backbone.sync has been executed and an XHR object has been created (but before execution).

```javascript
    model.on('xhr', function(requestContext) {
      requestContext.on('before-send', function(xhr, settings, requestContext) {
        ...
      });
    });
```

#### "after-send" ({jquery callback params}, responseType, requestContext)

* ***jqueryParams***: if success ```data, status, xhr```;  if error ```xhr, status, error```; [more details](http://api.jquery.com/jquery.ajax/)
* ***responseType***: if success ```success```;  if error ```error```;
* ***requestContext***: the same object passed to the ```xhr``` event.  It is provided in case the function does not have access to the closure scope.

Triggered after the [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) has completed and before the Backbone.sync callback has been executed.  This can be used to override the response data or alter the default behavior of the response.

```javascript
    model.on('xhr', function(requestContext) {
      requestContext.on('after-send', function(p1, p2, p3, responseType, requestContext) {

        if (responseType === 'success') {
          var data = p1, status = p2, xhr = p3;
          // we can change the response payload using requestContext.data
          requestContext.data = {foo: 'bar'};

        } else if (responseType === 'error') {
          var xhr = p1, status = p2, error = p3;
          // or we can completely change the default behavior and make an error look like a success
          requestContext.preventDefault().success({foo: 'bar'}, 'success', xhr);
        }
      });
    });
```

#### "success" (data, status, xhr, requestContext)

* ***data***: the response payload
* ***status***: the [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) text status
* ***xhr***: the [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
* ***requestContext***: the same object passed to the ```xhr``` event.  It is provided in case the function does not have access to the closure scope.

Triggered after the success callback handler has executed.  This can be used to perform actions after the model has been updated.

```javascript
    model.on('xhr', function(requestContext) {
      requestContext.on('success', function(data, status, xhr, requestContext) {
        // the updated mode/collection is requestContext.model
      });
    });
```

#### "error" (xhr, status, error, requestContext)

* ***xhr***: the [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
* ***status***: the [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) text status
* ***error***: the error thrown
* ***requestContext***: the same object passed to the ```xhr``` event.  It is provided in case the function does not have access to the closure scope.

Triggered after the error callback handler has executed.  This can be used to perform actions when an error scenario has occurred.

```javascript
    model.on('xhr', function(requestContext) {
      requestContext.on('error', function(xhr, status, error, requestContext) {
        ...
      });
    });
```

#### "complete" (responseType, requestContext)

* ***responseType***: if success ```success```; if error ```error```
* ***requestContext***: the same object passed to the ```xhr``` event.  It is provided in case the function does not have access to the closure scope.

```javascript
    model.on('xhr', function(requestContext) {
      requestContext.on('complete', function(type, requestContext) {
        ...
      });
    });
```

#### "abort" ()

Executed when the XHR is aborted using [RequestContext.abort](#project/jhudson8/backbone-xhr-events/method/RequestContext/abort)

```javascript
    model.on('xhr', function(requestContext) {
      requestContext.on('abort', function() {
        // if we wanted to prevent the error callback when we abort
        requestContext.preventDefault().complete('abort');
      });
    });
```


### Backbone.Model, Backbone.Collection & Backbone.xhrEvents

#### "xhr" (requestContext, method)

* ***method***: the Backbone.sync method (by default, ```read```, ```update```, or ```delete```)
* ***requestContext***: the [RequestContext](#section/Request%20Context)

This event is triggered on any model or collection when *any* XHR activity is initiated from that model / collection.  It is also triggered on ```Backbone.xhrEvents``` when XHR activity is initiated from *any* model / collection.

```javascript
    model.on('xhr', function(requestContext, method) {
      // the method is also available as requestContext.method

      // for any fetch operations
      if (method === 'read') {
        ...
      }
    });
```

or, to watch XHR activity from *any* model or collection

```javascript
    Backbone.xhrEvents.on('xhr', function(requestContext, method) {
      var theModel = requestContext.model;
      ...
    });
```

#### "xhr:{method}" (requestContext)

* ***method***: the Backbone sync method (by default, ```read```, ```update```, or ```delete```)
* ***requestContext***: the [request context](#section/Request%20Context)

Emitted when only XHR activity matching the method in the event name occurs

```javascript
    model.on('xhr:read', function(requestContext) {
      // this is only triggered on model.fetch()
    });
```

or, to watch XHR activity from *any* model or collection

```javascript
    Backbone.xhrEvents.on('xhr:read', function(method, model, context) {
      ...
    });
```

#### "xhr:complete" (requestContext)

* ***context***: the context representing the *last* XHR activity (see [RequestContext](#project/jhudson8/backbone-xhr-events/section/RequestContext))

Triggered on a model or collection (not Backbone.xhrActivity) when any XHR activity has completed *and* there is no more concurrent XHR activity



API
-----------
### RequestContext

The RequestContext is the object provided as the only parameter with the ```xhr``` events.  It is the context providing the ability to bind to the request lifecycle events.

```javascript
    model.on('xhr', function(requestContext) { ... });
```

also refer to the [RequestContext events](#project/jhudson8/backbone-xhr-events/package/RequestContext%20events)


#### preventDefault ()

Prevent the default execution of the request lifecycle.  A ResponseHandler is returned and either the ```success```, ```error``` or ```complete``` method *must* be called.

The following example demonstrates preventing an [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) from being created and simulating a success response.

```javascript
    model.on('xhr', function(requestContext) {
      var responseHandler = requestContext.stopPropogation();
      setTimeout(function() {
        // this can be used asynchronously
        responseHandler.success({foo: 'bar'}, 'success');
      }, 100);
    });
```

#### abort ()

Abort the [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) and trigger the ```abort``` event.

```javascript
    model.on('xhr', function(requestContext) {
      // if we need to abort for some reason
      requestContext.abort();
    });
```

#### model

The model or collection that initiated the request

```javascript
    var myModel = ...;
    myModel.on('xhr', function(requestContext) {
      requestContext.model === myModel;
    });
```

#### method

The Backbone.sync method.  This is either ```read```, ```update```, or ```delete``` if the default methods are used.

##### options

The options provided to the Backbone.ajax method.

```javascript
  var myModel = ...;
  myModel.on('xhr', function(requestContext) {
    requestContext.options === {foo: 'bar'};
  });
  myModel.fetch({foo: 'bar'});
```

#### xhr

The [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)

```javascript
  model.on('xhr', function(requestContext) {
    // this is a valid object on or after the "before-send" event
    requestContext.xhr;
  });
```

#### xhrSettings

The [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) settings containing atributes like the request URL.

```javascript
  model.on('xhr', function(requestContext) {
    // this is a valid object on or after the "before-send" event
    var url = requestContext.xhrSettings.url;
  });
```


### RequestHandler

The RequestHandler is the response from [requestContext.preventDefault()](#project/jhudson8/backbone-xhr-events/method/RequestContext/preventDefault).  When ```preventDefault``` is called, the request lifecycle is halted.  When this happens, you *must* either call [success](#project/jhudson8/backbone-xhr-events/method/RequestHandler/success), [error](#project/jhudson8/backbone-xhr-events/method/RequestHandler/error), or [complete](#project/jhudson8/backbone-xhr-events/method/RequestHandler/complete).

#### success (data, status, xhr)

* ***data***: the response payload
* ***status***: the [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) text status
* ***xhr***: the [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)

Initiate a success response if the [preventDefault](#project/jhudson8/backbone-xhr-events/method/RequestContext/preventDefault) method was called.

```javascript
    model.on('xhr', function(requestContext) {
      var requestHandler = requestContext.preventDefault();
      requestHandler.success({foo: 'bar'}, 'success', undefined);
    });
```

#### error (xhr, status, error)

* ***xhr***: the [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
* ***status***: the [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) text status
* ***error***: the error thrown

Initiate an error response if the [preventDefault](#project/jhudson8/backbone-xhr-events/method/RequestContext/preventDefault) method was called.

```javascript
    model.on('xhr', function(requestContext) {
      var requestHandler = requestContext.preventDefault();
      requestHandler.error(undefined, 'error', 'Not Found');
    });
```

#### complete (type)

* ***type***: the completion type; normally ```success``` or ```error``` but can technically be anything.  This will be the value passed to the ```complete``` event triggered from the [RequestContext](#project/jhudson8/backbone-xhr-events/section/RequestContext).

Using this method will bypass any success / error handlers bound to the XHR request but any completion handlers will still be executed.

```javascript
    model.on('xhr', function(requestContext) {
      var requestHandler = requestContext.preventDefault();
      requestHandler.complete('abort');
    });
```


### Backbone.Model / Backbone.Collection

#### whenFetched (successCallback, errorCallback)
* ***successCallback***: function to be called when the model/collection has been fetched
* ***errorCallback***: function to be called when if model/collection fetch failed

Initiate a fetch if not already fetching or fetched.  Once the model/collection has been fetch, execute the appropriate callback.

```javascript
    myModel.whenFetched(function(model) {
        // executed when model is fetched (model and myModel are the same)
      },
      function(model) {
        // executed if the model fetch fails
      }
    );
```

#### xhrActivity

This is a Model or Collection attribute that can be evaluated as a truthy if there is any current XHR activity.

```javascript
    var isCurrentXhrActivity = !!model.xhrActivity;
```

#### hasBeenFetched

This will be true if the Model or Collection has previously been fetched with a sucessful response.  If the Model or Collection is cleared, this value will be reset to undefined.

```javascript
    var isTheModelPopulated = model.hasBeenFetched;
```

#### hadFetchError

This will be true if the Model or Collection encountered an XHR error when performing a fetch.  It will reset to false upon a successful fetch operation.

```javascript
    var wasThereAFetchError = model.hadFetchError;
```


### Backbone

#### forwardXHREvents (sourceModel, destModel[, method]) or (sourceModel, destModel, autoStopFunc)

* ***sourceModel***: the originator model of the XHR events
* ***destModel***: the receiver or proxy of the source model XHR events
* ***method***: the optional Backbone.sync method to filter the forwarded events
* ***autoStopFunc***: callback function that, if provided, will stop the forwarding after the function completes execution

Forward XHR events that originate in ```sourceModel``` to ```destModel```.  These events will also be emitted in ```sourceModel``` as well.

This can be useful if you have a composite model containing sub-models and want to aggregate xhr activity to the composite model.

```javascript
    var CompositeModel = Backbone.Model.extend({
      initialize: function() {
        Backbone.Model.prototype.initialize.apply(this, arguments);

        // when model1 or model2 have xhr activity, "this" will expose the same xhr events
        this.model1 = new Backbone.Model();
        Backbone.forwardXHREvents(this.model1, this);

        this.model2 = new Backbone.Model();
        Backbone.forwardXHREvents(this.model2, this);
      }
    });
```

#### stopXHRForwarding (sourceModel, destModel[, method])
* ***sourceModel***: the originator model of the XHR events
* ***destModel***: the receiver or proxy of the source model XHR events
* ***method***: ***optional*** Backbone.sync method to filter the forwarded events

Stop forwarding XHR events.  This must match a previous ```forwardXHREvents``` call.

```javascript
    Backbone.forwardXHREvents(sourceModel, destModel, 'read');
```
