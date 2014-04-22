(function($, window) {
  var SimpleSlideView, 
      defaults, 
      pushOrPop,
      resetStyles;

  defaults = {
    views:                  '.view',
    activeView:             null,
    deferOn:                false,
    duration:               ($.fx != null) && ($.fx.cssPrefix != null) ? $.fx.speeds._default : 400,
    easing:                 'swing',
    useTransformProps:      false,
    use3D:                  (typeof Modernizr !== "undefined" && Modernizr !== null) && Modernizr.csstransforms3d,
    cssPrefix:              ($.fx != null) && ($.fx.cssPrefix != null) ? $.fx.cssPrefix : '',
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
      pop:    'popview'
    },
    classNames: {
      container:  'SimpleSlideView-container',
      view:       'SimpleSlideView-view',
      activeView: 'SimpleSlideView-view-active'
    },
    eventNames: {
      on:              'slideViewOn',
      off:             'slideViewOff',
      beforeOn:        'slideViewBeforeOn',
      beforeOff:       'slideViewBeforeOff',
      deferred:        'slideViewDeferred',
      viewChangeStart: 'viewChangeStart',
      viewChangeEnd:   'viewChangeEnd'
    }
  };

  defaults.scrollCallback = function(top, duration, callback) {
    if ($.scrollTo != null) {
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
    var style,
        i,
        len   = styles.length,
        reset = {},
        $el   = $(el);

    for (i = 0; i < len; i++) {
      reset[styles[i]] = '';
    }
    return $el.css(reset);
  };

  pushOrPop = function(action, pushResult, popResult) {
    pushResult = (pushResult == null) ? true : pushResult;
    popResult  = (popResult == null) ? false : popResult;
    return (action === 'push') ? pushResult : popResult;
  };

  SimpleSlideView = (function() {
    function SimpleSlideView(element, options) {

      // Manage options
      this.options = $.extend(true, {}, defaults, options);

      // options.heightDuration and scrollDuration are calculated from duration if null
      if (this.options.heightDuration == null) {
        this.options.heightDuration = this.options.duration;
      }
      if (this.options.scrollDuration == null) {
        this.options.scrollDuration = this.options.duration;
      }

      // maintainViewportHeight is calculated from resizeHeight, scrollOnStart 
      // and window.innerHeight if null
      if (this.options.maintainViewportHeight == null) {
        this.options.maintainViewportHeight = this.options.resizeHeight &&
          this.options.scrollOnStart && window.innerHeight != null;
      }

      this.$container = $(element);
      this.$views = typeof this.options.views === 'string' ? this.$container.find(this.options.views) : $(this.options.views);
      this.$activeView = this.options.activeView != null ? $(this.options.activeView) : this.$views.first();
      this.isActive = false;

      if (this.options.deferOn) {
        this.$container.trigger(this.options.eventNames.deferred);
      } else {
        this.on();
      }
    }

    SimpleSlideView.prototype.on = function() {

      if (this.isActive) { return; }

      // Events and init
      this.$container.trigger(this.options.eventNames.beforeOn);
      this.queue     = [];
      this.isActive  = true;
      this.isSliding = false;

      // Elements and styling
      this.$container.addClass(this.options.classNames.container);
      this.$views.addClass(this.options.classNames.view);
      this.$activeView.addClass(this.options.classNames.activeView);
      this.$views.not(this.$activeView).css('display', 'none');

      if (this.options.maintainViewportHeight) {
        this.lastViewportHeight = window.innerHeight;
      }

      // Handle pushing and popping
      if (this.options.dataAttrEvent != null) {
        this.$container.on(this.options.dataAttrEvent, 
          '[data-' + this.options.dataAttr.push + ']', 
          (function(_this) { // Bind to this context (coffee artifact pattern)
            // Figure out what view to push based on the value of the dataAttr
            // (typically `data-pushview`) or `href` attr of the event target
            return function(event) {
              var $el, target;
              $el = $(event.currentTarget);
              target = $el.data(_this.options.dataAttr.push);
              if (!target.length) {
                target = $el.attr('href');
              }
              if (target.length) {
                event.preventDefault();
                return _this.pushView(target);
              }
            };
          })(this));

        this.$container.on(this.options.dataAttrEvent, 
          '[data-' + this.options.dataAttr.pop + ']', 
          (function(_this) { // Bind to current context (coffee artifact)
            return function(event) {
              var $el, target;
              $el = $(event.currentTarget);
              target = $el.data(_this.options.dataAttr.pop);
              if (!target.length) {
                target = $el.attr('href');
              }
              if (target.length) {
                event.preventDefault();
                return _this.popView(target);
              }
            };
          })(this));
      }
      return this.$container.trigger(this.options.eventNames.on);
    };

    // Disable
    SimpleSlideView.prototype.off = function() {
      if (!this.isActive) { return; }

      this.$container.trigger(this.options.eventNames.beforeOff);

      this.queue = [];
      this.isActive = false;
      this.isSliding = false;

      this.$container.removeClass(this.options.classNames.container);
      this.$views.removeClass(this.options.classNames.view + ' ' + this.options.classNames.activeView);

      // TODO REVIEW should these use resetStyles?
      this.$views.css('display', '');
      if (this.options.maintainViewportHeight) {
        $('html').css('min-height', '');
      }

      if (this.options.dataAttrEvent != null) {
        // Remove event handling for dataAttrEvent from elements by [data-] selector
        this.$container.off(this.options.dataAttrEvent, '[data-' + this.options.dataAttr.push + ']');
        this.$container.off(this.options.dataAttrEvent, '[data-' + this.options.dataAttr.pop + ']');
      }

      return this.$container.trigger(this.options.eventNames.off);

    };

    // Invoke this.on or this.off based on activate or current state
    SimpleSlideView.prototype.toggle = function(activate) {
      activate = (activate == null) ? !this.isActive : activate;
      return (activate) ? this.on() : this.off();
    };

    // Push or pop (action) to the targetView from the current $activeView
    SimpleSlideView.prototype.changeView = function(targetView, action) {
      var beforeChangeEnd,
          bothCSS,
          changeAction,
          containerCSS,
          onChangeEnd,
          onScrollEnd,
          resetProps,
          targetCSS,
          transformProp,
          translateAfter,
          translateBefore,
          $targetView    = $(targetView),
          $bothViews     = this.$activeView.add($targetView),
          activeCSS      = {},
          args           = arguments,
          containerWidth = this.$container.outerWidth(),
          inAnimProps    = {},
          outAnimProps   = {},
          resetProps     = ['left', 'position', 'top', 'width'],
          targetCSS      = {};

      // If $targetView ain't a thing, or if it's already active, abort!
      if (!$targetView.length || $targetView[0] === this.$activeView[0]) { return; }

      // If we're already busy, push this onto the queue.
      if (this.isSliding || this.queue.length) {
        return this.queue.push(args);
      }

      // State and events
      this.isSliding = true;
      this.$container.trigger(this.options.eventNames.viewChangeStart, args);

      containerCSS = {
        height: this.$container.outerHeight(),
        overflow: 'hidden',
        position: 'relative',
        width: '100%'
      };
      bothCSS = {
        position: 'absolute',
        top: 0,
        width: containerWidth
      };

      // TODO Refactor into part of an animate/transition method
      if (this.options.useTransformProps) {
        transformProp   = this.options.cssPrefix + 'transform';
        translateBefore = this.options.use3D ? 'translate3d(' : 'translateX(';
        translateAfter  = this.options.use3D ? ', 0, 0)' : ')';
        resetProps.push(transformProp);
        bothCSS['left']             = 0;
        targetCSS[transformProp]    = translateBefore + pushOrPop(action, 100, -100) + '%' + translateAfter;
        outAnimProps[transformProp] = translateBefore + pushOrPop(action, -100, 100) + '%' + translateAfter;
        inAnimProps[transformProp]  = translateBefore + '0' + translateAfter;
      } else {
        activeCSS['left']    = 0;
        targetCSS['left']    = pushOrPop(action, containerWidth, containerWidth * -1);
        outAnimProps['left'] = pushOrPop(action, containerWidth * -1, containerWidth);
        inAnimProps['left']  = 0;
      }

      // Event handler for scrollEnd, bound to current context
      onScrollEnd = (function(_this) {
        return function() {
          _this.isSliding = false;
          _this.$container.trigger(_this.options.eventNames.viewChangeEnd, args);
          if (_this.queue.length) {
            return _this.changeView.apply(_this, _this.queue.shift());
          }
        };
      })(this);

      // Event handler for changeEnd, bound to current context
      onChangeEnd = (function(_this) {
        return function() {
          resetStyles(_this.$container, ['height', 'overflow', 'position', 'width']);
          _this.$activeView.removeClass(_this.options.classNames.activeView);
          $targetView.addClass(_this.options.classNames.activeView);
          _this.$activeView = $targetView;
          if (_this.options.scrollCallback && _this.options.scrollOn === 'end') {
            return _this._scrollToTop(onScrollEnd);
          } else {
            return onScrollEnd();
          }
        };
      })(this);

      // Event handler for beforeChangeEnd, bound to current context
      beforeChangeEnd = (function(_this) {
        return function() {
          if (_this.options.resizeHeight) {
            if (_this.options.maintainViewportHeight && window.innerHeight > _this.lastViewportHeight) {
              _this.lastViewportHeight = window.innerHeight;
              $html.css('min-height', (_this.lastViewportHeight + top) + 'px');
            }
            return _this.$container.animate({
              height: $targetView.outerHeight()
            }, _this.options.heightDuration, _this.options.easing, onChangeEnd);
          } else {
            return onChangeEnd();
          }
        };
      })(this);

      // Event handler for...?

      changeAction = (function(_this) {
        return function() {
          _this.$container.css(containerCSS);
          $bothViews.css(bothCSS);
          _this.$activeView.css(activeCSS);
          $targetView.css(targetCSS);
          $targetView.show();
          _this.$activeView.animate(outAnimProps, _this.options.duration, _this.options.easing, function() {
            return resetStyles(this, resetProps).hide();
          });
          $targetView.animate(inAnimProps, _this.options.duration, _this.options.easing, function() {
            resetStyles($targetView, resetProps);
            if (!_this.options.concurrentHeightChange) {
              return beforeChangeEnd();
            }
          });
          if (_this.options.concurrentHeightChange) {
            return beforeChangeEnd();
          }
        };
      })(this);
      if (this.options.scrollCallback && this.options.scrollOn === 'start') {
        if (this.options.concurrentScroll) {
          this._scrollToTop();
        } else {
          return this._scrollToTop(changeAction);
        }
      }
      return changeAction();
    };

    SimpleSlideView.prototype._scrollToTop = function(callback) {
      var top = this.options.scrollToContainerTop ? this.$container.position().top : 0;
      if ($(window).scrollTop() > top) {
        return this.options.scrollCallback(top, this.options.scrollDuration, callback);
      } else if (callback != null) {
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
})(jQuery, this);
