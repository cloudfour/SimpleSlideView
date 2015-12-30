(function() {
  var $, SimpleSlideView, defaults, outerHeight, outerWidth, pushOrPop, resetStyles, scrollCallback;

  $ = typeof jQuery !== "undefined" && jQuery !== null ? jQuery : Zepto;

  scrollCallback = ($.scrollTo != null) && (typeof jQuery !== "undefined" && jQuery !== null) ? function(top, duration, callback) {
    return $.scrollTo(top, duration, {
      'axis': 'y',
      'onAfter': callback
    });
  } : $.scrollTo != null ? $.scrollTo : function(top, duration, callback) {
    window.scrollTo(0, top);
    if (callback) {
      return callback();
    }
  };

  defaults = {
    views: '.view',
    activeView: null,
    deferOn: false,
    duration: ($.fx != null) && ($.fx.cssPrefix != null) ? $.fx.speeds._default : 400,
    easing: typeof Zepto !== "undefined" && Zepto !== null ? 'ease-out' : 'swing',
    useTransformProps: typeof Zepto !== "undefined" && Zepto !== null,
    use3D: (typeof Modernizr !== "undefined" && Modernizr !== null) && Modernizr.csstransforms3d,
    cssPrefix: ($.fx != null) && ($.fx.cssPrefix != null) ? $.fx.cssPrefix : '',
    resizeHeight: true,
    heightDuration: null,
    concurrentHeightChange: typeof Zepto === "undefined" || Zepto === null,
    scrollOn: 'start',
    scrollCallback: scrollCallback,
    scrollDuration: null,
    scrollToContainerTop: true,
    concurrentScroll: typeof Zepto === "undefined" || Zepto === null,
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
    }
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

  pushOrPop = function(action, pushResult, popResult) {
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

  SimpleSlideView = (function() {
    function SimpleSlideView(element, options) {
      this.options = $.extend(true, {}, defaults, options);
      if (this.options.heightDuration == null) {
        this.options.heightDuration = this.options.duration;
      }
      if (this.options.scrollDuration == null) {
        this.options.scrollDuration = this.options.duration;
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
        $('html').css('min-height', '');
      }
      if (this.options.dataAttrEvent != null) {
        this.$container.off(this.options.dataAttrEvent, '[data-' + this.options.dataAttr.push + ']');
        this.$container.off(this.options.dataAttrEvent, '[data-' + this.options.dataAttr.pop + ']');
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

    SimpleSlideView.prototype.changeView = function(targetView, action) {
      var $bothViews, $targetView, activeCSS, args, beforeChangeEnd, bothCSS, changeAction, containerCSS, containerWidth, inAnimProps, onChangeEnd, onScrollEnd, outAnimProps, resetProps, targetCSS, transformProp, translateAfter, translateBefore,
        _this = this;
      if (!this.isActive) {
        return;
      }
      $targetView = $(targetView);
      if (!$targetView.length || $targetView[0] === this.$activeView[0]) {
        return;
      }
      args = arguments;
      if (this.isSliding || this.queue.length) {
        return this.queue.push(args);
      }
      this.isSliding = true;
      this.$container.trigger(this.options.eventNames.viewChangeStart, args);
      $bothViews = this.$activeView.add($targetView);
      outAnimProps = {};
      inAnimProps = {};
      resetProps = ['left', 'position', 'top', 'width'];
      containerWidth = outerWidth(this.$container);
      containerCSS = {
        height: outerHeight(this.$container),
        overflow: 'hidden',
        position: 'relative',
        width: '100%'
      };
      activeCSS = {};
      targetCSS = {};
      bothCSS = {
        position: 'absolute',
        top: 0,
        width: containerWidth
      };
      if (this.options.useTransformProps) {
        transformProp = this.options.cssPrefix + 'transform';
        translateBefore = this.options.use3D ? 'translate3d(' : 'translateX(';
        translateAfter = this.options.use3D ? ', 0, 0)' : ')';
        resetProps.push(transformProp);
        bothCSS['left'] = 0;
        targetCSS[transformProp] = translateBefore + pushOrPop(action, 100, -100) + '%' + translateAfter;
        outAnimProps[transformProp] = translateBefore + pushOrPop(action, -100, 100) + '%' + translateAfter;
        inAnimProps[transformProp] = translateBefore + '0' + translateAfter;
      } else {
        activeCSS['left'] = 0;
        targetCSS['left'] = pushOrPop(action, containerWidth, containerWidth * -1);
        outAnimProps['left'] = pushOrPop(action, containerWidth * -1, containerWidth);
        inAnimProps['left'] = 0;
      }
      onScrollEnd = function() {
        _this.isSliding = false;
        _this.$container.trigger(_this.options.eventNames.viewChangeEnd, args);
        if (_this.queue.length) {
          return _this.changeView.apply(_this, _this.queue.shift());
        }
      };
      onChangeEnd = function() {
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
      beforeChangeEnd = function() {
        if (_this.options.resizeHeight) {
          if (_this.options.maintainViewportHeight && window.innerHeight > _this.lastViewportHeight) {
            _this.lastViewportHeight = window.innerHeight;
            $html.css('min-height', (_this.lastViewportHeight + top) + 'px');
          }
          return _this.$container.animate({
            height: outerHeight($targetView)
          }, _this.options.heightDuration, _this.options.easing, onChangeEnd);
        } else {
          return onChangeEnd();
        }
      };
      changeAction = function() {
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
      var top;
      top = this.options.scrollToContainerTop ? this.$container.position().top : 0;
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
