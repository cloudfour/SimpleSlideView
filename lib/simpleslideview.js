/* global Modernizr, jQuery */
'use strict';
(function($, window, Modernizr) {
  var SimpleSlideView, 
      pushOrPop,
      resetStyles,
      uniqueId;

  resetStyles = function(el, styles) {
    var i,
        len   = styles.length,
        reset = {},
        $el   = $(el);

    for (i = 0; i < len; i++) {
      reset[styles[i]] = '';
    }
    return $el.css(reset);
  };

  pushOrPop = function(action, pushResult, popResult) {
    pushResult = (pushResult === null) ? true : pushResult;
    popResult  = (popResult === null) ? false : popResult;
    return (action === 'push') ? pushResult : popResult;
  };

  // Assign a unique ID to the $el if it doesn't have
  // one and return it. Modeled after pattern from
  // jQuery UI (.uniqueId)
  uniqueId = (function() {
    var uuid = 0;
    return function($el) {
      var unique = 'slideView-';
      if (!$el.id) {
        unique += (++uuid);
        $el.id = unique;
        return unique;
      }
      return $el.id;
    };
  })();

  SimpleSlideView = (function() { // This self-invoking function returns the SimpleSlideView ctor
    function SimpleSlideView(element, options) {

      var defaults = {
          views:                  '.view',
          activeView:             null,
          deferOn:                false,
          duration:               ($.fx !== null) && ($.fx.cssPrefix !== null) ? $.fx.speeds._default : 400,
          easing:                 'swing',
          useTransformProps:      false,
          use3D:                  (typeof Modernizr !== 'undefined' && Modernizr !== null) && Modernizr.csstransforms3d,
          cssPrefix:              ($.fx !== null) && ($.fx.cssPrefix !== null) ? $.fx.cssPrefix : '',
          resizeHeight:           true,
          heightDuration:         null,
          concurrentHeightChange: true,
          scrollOn:               'start',
          scrollDuration:         null,
          scrollToContainerTop:   true,
          concurrentScroll:       true,
          maintainViewportHeight: null,
          dataAttrEvent:          'click',
          dataAttr: {
            push:   'pushview',
            pop:    'popview',
            change: 'changeView'
          },
          classNames: {
            container:  'SimpleSlideView-container',
            view:       'SimpleSlideView-view',
            activeView: 'SimpleSlideView-view-active'
          }
        };

        // ScrollCallback gets invoked as a callback by scrollToTop
        defaults.scrollCallback = function(top, duration, callback) {
          if ($.scrollTo !== null) {
            return $.scrollTo(top, duration, {
              'axis':       'y',
              'onAfter':    callback
            });
          } else {
            window.scrollTo(0, top);
            return (callback) ? callback() : true;
          }
        };

      // Manage options
      this.options = $.extend(true, {}, defaults, options);

      // options.heightDuration and scrollDuration are calculated from duration if null
      if (this.options.heightDuration === null) {
        this.options.heightDuration = this.options.duration;
      }
      if (this.options.scrollDuration === null) {
        this.options.scrollDuration = this.options.duration;
      }

      // maintainViewportHeight is calculated from resizeHeight, scrollOnStart 
      // and window.innerHeight if null
      if (this.options.maintainViewportHeight === null) {
        this.options.maintainViewportHeight = this.options.resizeHeight &&
          this.options.scrollOnStart && window.innerHeight !== null;
      }

      this.$container = $(element);
      this.namespace = uniqueId(this.$container);
      this.$views = typeof this.options.views === 'string' ? this.$container.find(this.options.views) : $(this.options.views);
      this.$activeView = this.options.activeView !== null ? $(this.options.activeView) : this.$views.first();
      this.isActive = false;

      if (this.options.deferOn) {
        this.$container.trigger('slideViewDeferred.' + this.namespace);
      } else {
        this.on();
      }
    }

    SimpleSlideView.prototype.init = function(activate) {
      this.queue     = [];
      this.isActive  = activate;
      this.isSliding = false;

      this.$container.toggleClass(this.options.classNames.container, activate);
      this.$views.toggleClass(this.options.classNames.view, activate);
      this.$activeView.toggleClass(this.options.classNames.activeView, activate);
    };

    SimpleSlideView.prototype.on = function() {

      if (this.isActive) { return; }

      this.$container.trigger('slideViewBeforeOn.' + this.namespace);
      this.init(true);

      this.$views.not(this.$activeView).css('display', 'none');
      if (this.options.maintainViewportHeight) {
        this.lastViewportHeight = window.innerHeight;
      }

      // Handle pushing and popping event handling
      if (this.options.dataAttrEvent !== null) {
        this.$container.on(this.options.dataAttrEvent + '.' + this.namespace, 
          '[data-' + this.options.dataAttr.push + ']', 
          $.proxy(this.changeView, this));
      
        this.$container.on(this.options.dataAttrEvent + '.' + this.namespace, 
          '[data-' + this.options.dataAttr.pop + ']', 
          $.proxy(this.changeView, this));
      }
      return this.$container.trigger('slideViewOn.' + this.namespace);
    };

    SimpleSlideView.prototype.off = function() {
      if (!this.isActive) { return; }

      this.$container.trigger('slideViewBeforeOff.' + this.namespace);

      this.init(false);

      resetStyles(this.$views, ['display', 'min-height']);

      if (this.options.dataAttrEvent !== null) {
        // Remove event handling for dataAttrEvent from elements by [data-] selector
        this.$container.off(this.options.dataAttrEvent + '.' + this.namespace, '[data-' + this.options.dataAttr.push + ']');
        this.$container.off(this.options.dataAttrEvent + '.' + this.namespace, '[data-' + this.options.dataAttr.pop + ']');
      }

      return this.$container.trigger('slideViewOff.' + this.namespace);
    };

    // Invoke this.on or this.off based on activate or current state
    SimpleSlideView.prototype.toggle = function(activate) {
      activate = (activate === null) ? !this.isActive : activate;
      return (activate) ? this.on() : this.off();
    };

    SimpleSlideView.prototype.changeView = function(target, action) {
      var $targetView,
          $triggerEl,
          actionData,
          transformProp, translateBefore, translateAfter,
          containerWidth = this.$container.outerWidth(),
          transitionCSS = {},
          beforeChangeEnd,
          changeAction,
          onChangeEnd,
          onScrollEnd;

      // Determine what our $targetView element is and what the action is
      // ('push' or 'pop').
      if (target instanceof $.Event) {
        $triggerEl = $(target.currentTarget);
        if ($triggerEl.prop('tagName') === 'A') { // It's an anchor element
          target.preventDefault();
        }
        for (var actionAttr in this.options.dataAttr) {
          actionData = $triggerEl.data(this.options.dataAttr[actionAttr]);
          if (actionData !== undefined) {
            action = actionAttr;
            $targetView = (actionData) ? $(actionData) : $($triggerEl.attr('href'));
          }
        }
      } else {
        $targetView = $(target);
      }

      // If $targetView ain't a thing, or if it's already active, abort!
      if (!$targetView.length || $targetView[0] === this.$activeView[0]) { return; }

      // If we don't have 'push' or 'pop' yet as an action, figure it out, possibly
      // based on source order.
      if (action === null || action === 'change') {
        if (this.$views.index(this.$activeView) < this.$views.index($targetView)) {
          action = 'push';
        } else {
          action = 'pop';
        }
      }

      // If we're already busy, push this onto the queue.
      if (this.isSliding || this.queue.length) {
        return this.queue.push($targetView, action);
      }

      // State and events
      this.isSliding = true;
      this.$container.trigger('viewChangeStart.' + this.namespace, [$targetView, action]);

      // Setting up CSS
      transitionCSS = {
        activeCSS: {},
        bothCSS: {
          position: 'absolute',
          top: 0,
          width: containerWidth
        },
        containerCSS: {
          height: this.$container.outerHeight(),
          overflow: 'hidden',
          position: 'relative',
          width:    '100%'
       },
        inAnimProps: {},
        outAnimProps: {},
        resetProps: ['left', 'position', 'top', 'width'],
        targetCSS: {}
      };

      if (this.options.useTransformProps) {
        transformProp   = this.options.cssPrefix + 'transform';
        translateBefore = this.options.use3D ? 'translate3d(' : 'translateX(';
        translateAfter  = this.options.use3D ? ', 0, 0)' : ')';

        transitionCSS.bothCSS.left = 0;
        transitionCSS.resetProps.push(transformProp);
        transitionCSS.targetCSS[transformProp]    = translateBefore + pushOrPop(action, 100, -100) + '%' + translateAfter;
        transitionCSS.outAnimProps[transformProp] = translateBefore + pushOrPop(action, -100, 100) + '%' + translateAfter;
        transitionCSS.inAnimProps[transformProp]  = translateBefore + '0' + translateAfter;
      } else {
        transitionCSS.activeCSS.left    = 0;
        transitionCSS.targetCSS.left    = pushOrPop(action, containerWidth, containerWidth * -1);
        transitionCSS.outAnimProps.left = pushOrPop(action, containerWidth * -1, containerWidth);
        transitionCSS.inAnimProps.left  = 0;
      }

      // Callback for scrollEnd, bound to current context
      onScrollEnd = $.proxy(function() {
        this.isSliding = false;
        this.$container.trigger('viewChangeEnd.' + this.namespace, $targetView, action);
        if (this.queue.length) {
          return this.changeView.apply(this, this.queue.shift());
        }
      }, this);

      // Event handler for changeEnd, bound to current context
      onChangeEnd = $.proxy(function() {
        resetStyles(this.$container, ['height', 'overflow', 'position', 'width']);
        this.$activeView.removeClass(this.options.classNames.activeView);
        $targetView.addClass(this.options.classNames.activeView);
        this.$activeView = $targetView;
        if (this.options.scrollCallback && this.options.scrollOn === 'end') {
          return this.scrollToTop(onScrollEnd);
        } else {
          return onScrollEnd();
        }
      }, this);

      // Event handler for beforeChangeEnd, bound to current context
      beforeChangeEnd = $.proxy(function() {
        if (this.options.resizeHeight) {
          if (this.options.maintainViewportHeight && 
               window.innerHeight > this.lastViewportHeight) {
            this.lastViewportHeight = window.innerHeight;
            $('html').css('min-height', (this.lastViewportHeight + top) + 'px');
          }
          return this.$container.animate({
              height: $targetView.outerHeight()
            }, this.options.heightDuration, this.options.easing, onChangeEnd);
          } else {
            return onChangeEnd();
          }
      }, this);

      changeAction = $.proxy(function() {
        this.$container.css(transitionCSS.containerCSS);
        this.$activeView.add($targetView).css(transitionCSS.bothCSS);
        this.$activeView.css(transitionCSS.activeCSS);
        $targetView.css(transitionCSS.targetCSS);

        $targetView.show();

        this.$activeView.animate(
          transitionCSS.outAnimProps,
          this.options.duration,
          this.options.easing, 
          function() {
            return resetStyles(this, transitionCSS.resetProps).hide();
          }
        );
        $targetView.animate(
          transitionCSS.inAnimProps,
          this.options.duration,
          this.options.easing,
          $.proxy(function() {
            resetStyles($targetView, transitionCSS.resetProps);
            if (!this.options.concurrentHeightChange) {
              return beforeChangeEnd();
            }
          }, this)
        );

        if (this.options.concurrentHeightChange) { 
          return beforeChangeEnd();
        }
      }, this);

      if (this.options.scrollCallback && this.options.scrollOn === 'start') {
        if (this.options.concurrentScroll) {
          this.scrollToTop();
        } else {
          return this.scrollToTop(changeAction);
        }
      }
      return changeAction();
    };

    SimpleSlideView.prototype.scrollToTop = function(callback) {
      var top = this.options.scrollToContainerTop ? this.$container.position().top : 0;
      if ($(window).scrollTop() > top) {
        return this.options.scrollCallback(top, this.options.scrollDuration, callback);
      } else if (callback !== undefined) {
        return callback();
      }
    };

    SimpleSlideView.prototype.pushView = function(targetView) {
      return this.changeView(targetView, 'push');
    };

    SimpleSlideView.prototype.popView = function(targetView) {
      return this.changeView(targetView, 'pop');
    };

    return SimpleSlideView;

  })();

  $.fn.simpleSlideView = function(options, extras) {
    var ssv;
    options = options || {};

    if (typeof options !== 'object') {
      options = {
        views: options
      };
    } else {
      $.extend(options, extras);
    }
    ssv = new SimpleSlideView(this, options);
    return this;
  };
})(jQuery, this, Modernizr || null);
