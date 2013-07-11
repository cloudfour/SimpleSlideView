# SimpleSlideView

A nifty little jQuery or Zepto plugin for the simplest of sliding views.

* [Explanatory blog post]()
* [Check out a demo]()

## Dependencies

SimpleSlideView requires either [jQuery](http://jquery.com/) or [Zepto](http://zeptojs.com/) (the default build should be fine).

<!-- ### Optional: scrollTo

This plugin was designed to work well with non-fixed layouts, which means it can be helpful to scroll to the top of the window or container prior to a view changing. If a `$.scrollTo` plugin is available, SimpleSlideView will attempt to use it for this functionality by default. It has been tested with [jquery.scrollTo](https://github.com/flesler/jquery.scrollTo) and [ZeptoScroll](https://github.com/suprMax/ZeptoScroll/).

This functionality can be mimicked using SimpleSlideView's events if plugins aren't your bag. You can also just set the `scrollOnStart` option to `true` if you don't care about animation... no plugin required. -->

## Getting started

SimpleSlideView requires two types of elements to be present in your markup:

* A container for the views that will be sliding.
* An element for each of the views themselves. These don't have to be _immediate_ children of the container, but they should be nested somewhere inside of it.

A very simple example:

```html
<div class="container"> <!-- the container -->
  <div class="view">...</div> <!-- first view (shown by default) -->
  <div class="view">...</div> <!-- second view -->
  <div class="view">...</div> <!-- and so on... -->
</div>
```

You then call `simpleSlideView` on the containing element:

```javascript
$('.container').simpleSlideView();
```

If you'd like to use a different selector than `.view` for the views, you can specify an argument:

```javascript
$('.container').simpleSlideView('.my-view-selector');
```
[More options]() are available and can be passed as an object.

## Navigating between views

Once the plugin is active, only the active view will be visible, so we probably want some way to navigate to the other views. There are two types of navigation that can occur... a "push" (target view animates in from right) or a "pull" (target view animates in from left).

### With HTML

If you want to specify view navigation in your markup, the `data-popview` and `data-pushview` attributes are the way to go.

If you have a link with an `href` that already resolves to a view, just add one or the other attribute:

```html
<a href="#view-1" data-popview>Backward!</a>
<a href="#view-3" data-pushview>Forward!</a>
```

You can also specify an attribute value. This is useful if you want to use a more complicated selector that would be invalid as an `href`, you want to link to a different destination while the SimpleSlideView is active, or you want to use an element that isn't a link at all:

```html
<div data-pushview=".view.weird:first">To the first weird view!</div>
```

### With JavaScript

The `simpleSlideView` method returns an object with methods you can use to navigate with JavaScript.

```javascript
// Instantiates the SimpleSlideView
var slideView = $('.container').simpleSlideView();
// Pushes the view with an ID of 'my-view-selector'
slideView.pushView('#my-view-selector');
```

See [methods]() for more info.