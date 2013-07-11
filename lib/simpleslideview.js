(function() {
  var $, SimpleSlideView, defaults, outerHeight, outerWidth, resetStyles;

  $ = typeof jQuery !== "undefined" && jQuery !== null ? jQuery : Zepto;

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

  SimpleSlideView = (function() {
    function SimpleSlideView(element, options) {
      this.options = $.extend(true, {}, defaults, options);
      if (!this.options.heightDuration) {
        this.options.heightDuration = this.options.duration;
      }
      this.$container = $(element);
      this.$views = typeof this.options.views === 'string' ? this.$container.find(this.options.views) : $(this.options.views);
      this.$activeView = this.options.activeView != null ? $(this.options.activeView) : this.$views.first();
      if (!this.options.deferOn) {
        this.on();
      }
    }

    SimpleSlideView.prototype.on = function() {
      var _this = this;
      this.$container.addClass(this.options.classNames.container);
      this.$views.addClass(this.options.classNames.view);
      this.$activeView.addClass(this.options.classNames.activeView);
      this.$views.not(this.$activeView).css('display', 'none');
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
        return this.$container.on(this.options.dataAttrEvent, '[data-' + this.options.dataAttr.pop + ']', function(event) {
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
    };

    SimpleSlideView.prototype.off = function() {
      this.$container.removeClass(this.options.classNames.container);
      this.$views.removeClass(this.options.classNames.view + ' ' + this.options.classNames.activeView);
      this.$views.css('display', '');
      if (this.options.dataAttrEvent != null) {
        this.$container.off(this.options.dataAttrEvent, '[data-' + this.options.dataAttr.push + ']');
        return this.$container.off(this.options.dataAttrEvent, '[data-' + this.options.dataAttr.pop + ']');
      }
    };

    SimpleSlideView.prototype.changeView = function(targetView, push) {
      var $bothViews, $targetView, animateHeight, animateHeightCallback, containerWidth, inAnimProps, maxTop, outAnimProps, resetProps, transformProp, translateAfter, translateBefore,
        _this = this;
      this.$container.trigger(this.options.eventNames.viewChangeStart);
      $targetView = $(targetView);
      $bothViews = this.$activeView.add($targetView);
      containerWidth = outerWidth(this.$container);
      outAnimProps = {};
      inAnimProps = {};
      resetProps = ['left', 'position', 'top', 'width'];
      if (this.options.scrollOnStart) {
        maxTop = this.options.scrollToContainerTop ? this.$container.position().top : 0;
        if ($(window).scrollTop() > maxTop) {
          if (typeof this.options.scrollOnStart === 'string' && ($[this.options.scrollOnStart] != null)) {
            $[this.options.scrollOnStart](maxTop, this.options.duration);
          } else {
            window.scrollTo(0, maxTop);
          }
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
        $targetView.css(transformProp, translateBefore + (push ? 100 : -100) + '%' + translateAfter);
        outAnimProps[transformProp] = translateBefore + (push ? -100 : 100) + '%' + translateAfter;
        inAnimProps[transformProp] = translateBefore + '0' + translateAfter;
      } else {
        this.$activeView.css('left', 0);
        $targetView.css('left', push ? containerWidth : containerWidth * -1);
        outAnimProps['left'] = push ? containerWidth * -1 : containerWidth;
        inAnimProps['left'] = 0;
      }
      animateHeightCallback = function() {
        resetStyles(_this.$container, ['height', 'overflow', 'position', 'width']);
        return _this.$container.trigger(_this.options.eventNames.viewChangeEnd);
      };
      animateHeight = function() {
        if (_this.options.resizeHeight) {
          return _this.$container.animate({
            height: outerHeight($targetView)
          }, _this.options.heightDuration, _this.options.easing, animateHeightCallback);
        } else {
          return animateHeightCallback();
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
      return this.$activeView = $targetView;
    };

    SimpleSlideView.prototype.pushView = function(targetView) {
      return this.changeView(targetView, true);
    };

    SimpleSlideView.prototype.popView = function(targetView) {
      return this.changeView(targetView);
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
