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

[View the installation and API docs](http://jhudson8.github.io/fancydocs/index.html#project/jhudson8/backbone-xhr-events) for a better docs experience
