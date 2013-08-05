(function() {
  var $, $html, $window, SimpleSlideView, defaults, outerHeight, outerWidth, resetStyles;

  $ = typeof jQuery !== "undefined" && jQuery !== null ? jQuery : Zepto;

  $window = $(window);

  $html = $('html');

  defaults = {
    views: '.view',
    activeView: null,
    deferOn: false,
    duration: $.fx.speeds._default,
    easing: typeof Zepto !== "undefined" && Zepto !== null ? 'ease-out' : 'swing',
    useTransformProps: typeof Zepto !== "undefined" && Zepto !== null,
    use3D: (typeof Modernizr !== "undefined" && Modernizr !== null) && Modernizr.csstransforms3d,
    cssPrefix: $.fx.cssPrefix != null ? $.fx.cssPrefix : '',
    resizeHeight: true,
    heightDuration: null,
    deferHeightChange: typeof Zepto !== "undefined" && Zepto !== null,
    scrollOnStart: $.scrollTo != null ? 'scrollTo' : false,
    scrollToContainerTop: true,
    maintainViewportHeight: null,
    dataAttrEvent: 'click',
    dataAttr: {
      push: 'pushview',
      pop: 'popview'
    },
    classNames: {
      container: 'SimpleSlideView-container',
      view: 'SimpleSlideView-view',
      activeView: 'SimpleSlideView-view-active'
    },
    eventNames: {
      on: 'slideViewOn',
      off: 'slideViewOff',
      beforeOn: 'slideViewBeforeOn',
      beforeOff: 'slideViewBeforeOff',
      deferred: 'slideViewDeferred',
      viewChangeStart: 'viewChangeStart',
      viewChangeEnd: 'viewChangeEnd'
    },
    manipulateHistory: false,
    historyLib: typeof History !== "undefined" && History !== null ? History : {},
    historyChangeEvent: typeof History !== "undefined" && History !== null ? 'statechange' : null
  };

  resetStyles = function(el, styles) {
    var $el, reset, style, _i, _len;
    $el = $(el);
    reset = {};
    for (_i = 0, _len = styles.length; _i < _len; _i++) {
      style = styles[_i];
      reset[style] = '';
    }
    return $el.css(reset);
  };

  outerHeight = function(el) {
    if ($.fn.outerHeight != null) {
      return $(el).outerHeight();
    }
    return $(el).height();
  };

  outerWidth = function(el) {
    if ($.fn.outerWidth != null) {
      return $(el).outerWidth();
    }
    return $(el).width();
  };

  SimpleSlideView = (function() {
    function SimpleSlideView(element, options) {
      this.options = $.extend(true, {}, defaults, options);
      if (this.options.heightDuration == null) {
        this.options.heightDuration = this.options.duration;
      }
      if (this.options.maintainViewportHeight == null) {
        this.options.maintainViewportHeight = this.options.resizeHeight && this.options.scrollOnStart;
      }
      if (window.innerHeight == null) {
        this.options.maintainViewportHeight = false;
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
      var _this = this;
      if (this.isActive) {
        return;
      }
      this.$container.trigger(this.options.eventNames.beforeOn);
      this.queue = [];
      this.isActive = true;
      this.isSliding = false;
      this.$container.addClass(this.options.classNames.container);
      this.$views.addClass(this.options.classNames.view);
      this.$activeView.addClass(this.options.classNames.activeView);
      this.$views.not(this.$activeView).css('display', 'none');
      if (this.options.maintainViewportHeight) {
        this.lastViewportHeight = window.innerHeight;
      }
      if (this.options.dataAttrEvent != null) {
        this.$container.on(this.options.dataAttrEvent, '[data-' + this.options.dataAttr.push + ']', function(event) {
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
        });
        this.$container.on(this.options.dataAttrEvent, '[data-' + this.options.dataAttr.pop + ']', function(event) {
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
        });
      }
      if (this.options.manipulateHistory) {
        this.historyID = 0;
        this.options.historyLib.replaceState({
          id: this.historyID,
          viewIndex: this.$views.index(this.$activeView)
        }, null, '');
        $window.on(this.options.historyChangeEvent, function() {
          var state;
          state = _this.options.historyLib.getState();
          _this.changeView(_this.$views.get(state.data.viewIndex), (state.data.id > _this.historyID ? 'push' : 'pop'), false);
          return _this.historyID = state.data.id;
        });
      }
      return this.$container.trigger(this.options.eventNames.on);
    };

    SimpleSlideView.prototype.off = function() {
      if (!this.isActive) {
        return;
      }
      this.$container.trigger(this.options.eventNames.beforeOff);
      this.queue = [];
      this.isActive = false;
      this.isSliding = false;
      this.$container.removeClass(this.options.classNames.container);
      this.$views.removeClass(this.options.classNames.view + ' ' + this.options.classNames.activeView);
      this.$views.css('display', '');
      if (this.options.maintainViewportHeight) {
        $html.css('min-height', '');
      }
      if (this.options.dataAttrEvent != null) {
        this.$container.off(this.options.dataAttrEvent, '[data-' + this.options.dataAttr.push + ']');
        this.$container.off(this.options.dataAttrEvent, '[data-' + this.options.dataAttr.pop + ']');
      }
      if (this.options.manipulateHistory) {
        $window.off(this.options.historyChangeEvent);
      }
      return this.$container.trigger(this.options.eventNames.off);
    };

    SimpleSlideView.prototype.toggle = function(activate) {
      if (activate == null) {
        activate = !this.isActive;
      }
      if (activate) {
        return this.on();
      }
      return this.off();
    };

    SimpleSlideView.prototype.pushOrPop = function(action, pushResult, popResult) {
      if (pushResult == null) {
        pushResult = true;
      }
      if (popResult == null) {
        popResult = false;
      }
      if (action === 'push') {
        return pushResult;
      } else {
        return popResult;
      }
    };

    SimpleSlideView.prototype.changeView = function(targetView, action, manipulateHistory) {
      var $bothViews, $targetView, animateHeight, args, changeComplete, containerWidth, inAnimProps, outAnimProps, resetProps, top, transformProp, translateAfter, translateBefore,
        _this = this;
      if (action == null) {
        action = 'push';
      }
      if (manipulateHistory == null) {
        manipulateHistory = this.options.manipulateHistory;
      }
      args = arguments;
      if (this.isSliding || this.queue.length) {
        return this.queue.push(args);
      }
      $targetView = $(targetView);
      if ($targetView[0] === this.$activeView[0]) {
        return;
      }
      $bothViews = this.$activeView.add($targetView);
      this.isSliding = true;
      this.$container.trigger(this.options.eventNames.viewChangeStart, args);
      outAnimProps = {};
      inAnimProps = {};
      resetProps = ['left', 'position', 'top', 'width'];
      containerWidth = outerWidth(this.$container);
      top = this.options.scrollOnStart && this.options.scrollToContainerTop ? this.$container.position().top : 0;
      if (this.options.scrollOnStart && $window.scrollTop() > top) {
        if (typeof this.options.scrollOnStart === 'string' && ($[this.options.scrollOnStart] != null)) {
          $[this.options.scrollOnStart](top, this.options.duration);
        } else {
          window.scrollTo(0, top);
        }
      }
      this.$container.css({
        height: outerHeight(this.$container),
        overflow: 'hidden',
        position: 'relative',
        width: '100%'
      });
      $bothViews.css({
        position: 'absolute',
        top: 0,
        width: containerWidth
      });
      if (this.options.useTransformProps) {
        transformProp = this.options.cssPrefix + 'transform';
        translateBefore = this.options.use3D ? 'translate3d(' : 'translateX(';
        translateAfter = this.options.use3D ? ', 0, 0)' : ')';
        resetProps.push(transformProp);
        $bothViews.css('left', 0);
        $targetView.css(transformProp, translateBefore + this.pushOrPop(action, 100, -100) + '%' + translateAfter);
        outAnimProps[transformProp] = translateBefore + this.pushOrPop(action, -100, 100) + '%' + translateAfter;
        inAnimProps[transformProp] = translateBefore + '0' + translateAfter;
      } else {
        this.$activeView.css('left', 0);
        $targetView.css('left', this.pushOrPop(action, containerWidth, containerWidth * -1));
        outAnimProps['left'] = this.pushOrPop(action, containerWidth * -1, containerWidth);
        inAnimProps['left'] = 0;
      }
      changeComplete = function() {
        resetStyles(_this.$container, ['height', 'overflow', 'position', 'width']);
        _this.isSliding = false;
        _this.$container.trigger(_this.options.eventNames.viewChangeEnd, args);
        if (_this.queue.length) {
          return _this.changeView.apply(_this, _this.queue.shift());
        }
      };
      animateHeight = function() {
        if (_this.options.resizeHeight) {
          if (_this.options.maintainViewportHeight && window.innerHeight > _this.lastViewportHeight) {
            _this.lastViewportHeight = window.innerHeight;
            $html.css('min-height', (_this.lastViewportHeight + top) + 'px');
          }
          return _this.$container.animate({
            height: outerHeight($targetView)
          }, _this.options.heightDuration, _this.options.easing, changeComplete);
        } else {
          return changeComplete();
        }
      };
      $targetView.show();
      this.$activeView.animate(outAnimProps, this.options.duration, this.options.easing, function() {
        return resetStyles(this, resetProps).hide();
      });
      $targetView.animate(inAnimProps, this.options.duration, this.options.easing, function() {
        resetStyles($targetView, resetProps);
        if (_this.options.deferHeightChange) {
          return animateHeight();
        }
      });
      if (!this.options.deferHeightChange) {
        animateHeight();
      }
      this.$activeView.removeClass(this.options.classNames.activeView);
      $targetView.addClass(this.options.classNames.activeView);
      this.$activeView = $targetView;
      if (manipulateHistory) {
        this.historyID += 1;
        return this.options.historyLib.pushState({
          id: this.historyID,
          viewIndex: this.$views.index(this.$activeView)
        }, null, '');
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
    if (options == null) {
      options = {};
    }
    if (typeof options !== 'object') {
      options = {
        views: options
      };
    }
    if (typeof extras === 'object') {
      $.extend(options, extras);
    }
    return new SimpleSlideView(this, options);
  };

}).call(this);
