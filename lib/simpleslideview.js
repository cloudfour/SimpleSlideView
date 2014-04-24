/* global jQuery */
'use strict';
(function($, window) {
  var Modernizr,
      SimpleSlideView,
      defaults,
      pushOrPop,
      resetStyles,
      uniqueId;

  defaults = {
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
      push:   'slideview-push',
      pop:    'slideview-pop',
      change: 'slideview-change'
    },
    classNames: {
      container:  'SimpleSlideView-container',
      view:       'SimpleSlideView-view',
      activeView: 'SimpleSlideView-view-active'
    }
  };

  Modernizr = (typeof window.Modernizr !== 'undefined') ? window.Modernizr : null;

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

  resetStyles = function(el, styles) {
    var i,
        len   = styles.length,
        reset = {};

    for (i = 0; i < len; i++) {
      reset[styles[i]] = '';
    }
    return $(el).css(reset);
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
      }
      return $el.id;
    };
  })();

  SimpleSlideView = function(element, options) {
    var $activeView,
        $container,
        $views,
        activeTransition,
        isActive = false,
        isSliding = false,
        lastViewportHeight = 0,
        queue    = [],

    init = function(activate) {
      queue = [];
      isActive  = activate;
      isSliding = false;

      $container.toggleClass(this.options.classNames.container, activate);
      $views.toggleClass(this.options.classNames.view, activate);
      $activeView.toggleClass(this.options.classNames.activeView, activate);
    },
    beforeChangeEnd = function() {
      var changeEnd = $.proxy(onChangeEnd, this),
          $targetView = activeTransition[0];
      if (this.options.resizeHeight) {
        if (this.options.maintainViewportHeight && 
          window.innerHeight > lastViewportHeight) {
          lastViewportHeight = window.innerHeight;
          // TODO top is undefined
          $('html').css('min-height', (lastViewportHeight + top) + 'px');
        }
        return $container.animate({
            height: $targetView.outerHeight()
        }, this.options.heightDuration, this.options.easing, changeEnd);
      } else {
        return changeEnd();
      }
    },
    changeAction = function(transitionCSS) {
      return function() {
        var $targetView = activeTransition[0];

        $container.css(transitionCSS.containerCSS);
        $activeView.add($targetView).css(transitionCSS.bothCSS);
        $activeView.css(transitionCSS.activeCSS);
        $targetView.css(transitionCSS.targetCSS);

        $targetView.show();

        $activeView.animate(
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
              beforeChangeEnd.call(this);
            }
          }, this)
        );
        if (this.options.concurrentHeightChange) { 
          return beforeChangeEnd.call(this);
        }
      };
    },
    onChangeEnd = function() {
      var $targetView = activeTransition[0];
      resetStyles($container, ['height', 'overflow', 'position', 'width']);
      $activeView.removeClass(this.options.classNames.activeView);
      $targetView.addClass(this.options.classNames.activeView);
      $activeView = $targetView;
      if (this.options.scrollCallback && this.options.scrollOn === 'end') {
        return this.scrollToTop($.proxy(onScrollEnd, this));
      } else {
        return onScrollEnd.call(this);
      }
    },
    onScrollEnd = function() {
      var $targetView = activeTransition[0],
          action      = activeTransition[1];
      isSliding = false;
      $container.trigger('viewChangeEnd.' + this.namespace, $targetView, action);
      if (queue.length) {
        return this.changeView.apply(this, queue.shift());
      }
    },
    prepareTransition = function() {
      var transformProp, translateBefore, translateAfter,
          action = activeTransition[1],
          containerWidth = $container.outerWidth(),

      transitionCSS = {
        activeCSS: {},
        bothCSS: {
          position:   'absolute',
          top:        0,
          width:      containerWidth
        },
        containerCSS: {
          height:     $container.outerHeight(),
          overflow:   'hidden',
          position:   'relative',
          width:      '100%'
       },
        inAnimProps:    {},
        outAnimProps:   {},
        resetProps:     ['left', 'position', 'top', 'width'],
        targetCSS:      {}
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
      return transitionCSS;
    };

    this.on = function() {
      if (isActive) { return; }

      $container.trigger('slideViewBeforeOn.' + this.namespace);
      init.call(this, true);
      $views.not($activeView).css('display', 'none');

      if (this.options.maintainViewportHeight) {
        lastViewportHeight = window.innerHeight;
      }
      // Bind events
      if (this.options.dataAttrEvent !== null) {
        $container.on(this.options.dataAttrEvent + '.' + this.namespace, 
          '[data-' + this.options.dataAttr.change + ']', 
          $.proxy(this.changeView, this));

        $container.on(this.options.dataAttrEvent + '.' + this.namespace, 
          '[data-' + this.options.dataAttr.push + ']', 
          $.proxy(this.changeView, this));
      
        $container.on(this.options.dataAttrEvent + '.' + this.namespace, 
          '[data-' + this.options.dataAttr.pop + ']', 
          $.proxy(this.changeView, this));
      }
      $container.trigger('slideViewOn.' + this.namespace);
    };

    this.off = function() {
      if (!isActive) { return; }
      $container.trigger('slideViewBeforeOff.' + this.namespace);
      init.call(this, false);

      resetStyles(this.$views, ['display', 'min-height']);

      if (this.options.dataAttrEvent !== null) {
        $container.off(this.options.dataAttrEvent + '.' + this.namespace, '[data-' + this.options.dataAttr.push + ']');
        $container.off(this.options.dataAttrEvent + '.' + this.namespace, '[data-' + this.options.dataAttr.pop + ']');
        $container.off(this.options.dataAttrEvent + '.' + this.namespace, '[data-' + this.options.dataAttr.change + ']');
      }
      $container.trigger('slideViewOff.' + this.namespace);
    };

    this.toggle = function(activate) {
      activate = (activate === null) ? !isActive : activate;
      if (activate) {
        this.on();
      } else {
        this.off();
      }
    };

    this.changeView = function(target, action) {
      var $targetView,
        $triggerEl,
        actionData,
        doAction,
        currentItem,
        transitionCSS;

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

      if (!$targetView.length || $targetView[0] === $activeView[0]) { return; }

      if (action === null || action === 'change') {
        action = ($views.index($activeView) > $views.index($targetView)) ? 'pop' : 'push';
      }

      currentItem = [$targetView, action];
      // If we're already busy, push this onto the queue.
      if (isSliding || queue.length) {
        return queue.push(currentItem);
      } else {
        activeTransition = currentItem;
      }

      isSliding = true;

      $container.trigger('viewChangeStart.' + this.namespace, [$targetView, action]);

      transitionCSS = prepareTransition.call(this);

      doAction = $.proxy(changeAction(transitionCSS), this);

      if (this.options.scrollCallback && this.options.scrollOn === 'start') {
        if (this.options.concurrentScroll) {
          this.scrollToTop();
        } else {
          return this.scrollToTop(doAction);
        }
      }
      return doAction();

    };

    this.pushView = function(targetView) {
      return this.changeView(targetView, 'push');
    };

    this.popView = function(targetView) {
      return this.changeView(targetView, 'pop');
    };

    this.scrollToTop = function(callback) {
      var top = this.options.scrollToContainerTop ? $container.position().top : 0;
      if ($(window).scrollTop() > top) {
        return this.options.scrollCallback(top, this.options.scrollDuration, callback);
      } else if (callback !== undefined) {
        return callback();
      }
    };

    this.options = $.extend(true, {}, defaults, options);

    if (this.options.heightDuration === null) {
      this.options.heightDuration = this.options.duration;
    }
    if (this.options.scrollDuration === null) {
      this.options.scrollDuration = this.options.duration;
    }

    if (this.options.maintainViewportHeight === null) {
      this.options.maintainViewportHeight = this.options.resizeHeight &&
        this.options.scrollOnStart && window.innerHeight !== null;
    }

    $container = $(element);
    $views     = typeof this.options.views === 'string' ? $container.find(this.options.views) : $(this.options.views);
    $activeView = this.options.activeView !== null ? $(this.options.activeView) : $views.first();

    this.namespace = uniqueId($container);

    if (!!this.options.deferOn) {
      $container.trigger('slideViewDeferred.' + this.namespace);
    } else {
      this.on();
    }

  };

  $.fn.simpleSlideView = function(options, extras) {
    options = options || {};
    if (typeof options !== 'object') {
      options = {
        views: options
      };
    } else {
      $.extend(options, extras);
    }
    return new SimpleSlideView(this, options);
  };

})(jQuery, this);