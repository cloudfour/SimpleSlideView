$ = if jQuery? then jQuery else Zepto

defaults =
  # The default view selector. An object will be a
  # jQuery or Zepto object, a string will be used
  # as a selector within the container.
  views: '.view'

  # The view that should be initially active. Can
  # also be an object or string. If 'null', the first
  # view in the container will be used.
  activeView: null

  # If 'true', SimpleSlideView will not activate
  # until the on() method is called.
  deferOn: false

  # The speed of animations. Defaults to the current
  # jQuery or Zepto default.
  duration: $.fx.speeds._default

  # The easing method to use for animations. Defaults
  # to 'ease-out' for Zepto and 'swing' for jQuery.
  easing: if Zepto? then 'ease-out' else 'swing'

  # If true, animations will act on the 'transform'
  # properties rather than 'right' or 'left'. Defaults
  # to 'true' for Zepto.
  useTransformProps: Zepto?

  # When 'true', 3D transforms will be used. Can sometimes
  # improve performance. 'true' by default if Modernizr and
  # the 'csstransforms3d' test are included.
  use3D: Modernizr? and Modernizr.csstransforms3d

  # The CSS prefix to use for the 'transform' property.
  # Defaults to the one the framework is using (if any).
  cssPrefix: if $.fx.cssPrefix? then $.fx.cssPrefix else ''

  # If 'true', the height of the container will be resized
  # to match the height of the active view (both initially
  # and as the views change. You should set to 'false' if
  # your container's height is fixed.
  resizeHeight: true

  # Duration of the height animations when 'resizeHeight'
  # is true. If 'null', the value of the duration option
  # will be used.
  heightDuration: null

  # If 'true', the resizeHeight animation will occur after
  # the rest of the view change has finished. (Having too
  # many CSS animations happening at once sometimes affects
  # performance.) 'true' for Zepto, 'false' otherwise.
  deferHeightChange: Zepto?

  # Scroll to the top of the window or container (see
  # scrollToContainer) when a view change begins. If this is
  # a string, the plugin will try to scroll to the position
  # using a plugin with that name. If 'true', the scroll
  # will snap to that position without animation.
  scrollOnStart: if $.scrollTo? then 'scrollTo' else false

  # If 'true', the scroll will move to the top of the
  # container. If 'false', the top of the window will
  # be used.
  scrollToContainerTop: true

  # The event that the magic data-attribute events will
  # be bound to. If 'false', no events will be bound.
  dataAttrEvent: 'click'

  # The names of the data attributes to use for the magic
  # event bindings.
  dataAttr:
    push: 'pushview'
    pop: 'popview'

  # Class names that get added to the different elements as
  # the plugin does its thing. These have no utility to the
  # plugin, they are merely for styling and convenience.
  classNames:
    container: 'SimpleSlideView-container'
    view: 'SimpleSlideView-view'
    activeView: 'SimpleSlideView-view-active'

  # The names of the events that will trigger on the
  # container when a view change begins or ends.
  eventNames:
    viewChangeStart: 'viewChangeStart'
    viewChangeEnd: 'viewChangeEnd'

resetStyles = (el, styles) ->
  $el = $(el)
  reset = {}
  reset[style] = '' for style in styles
  $el.css reset

outerHeight = (el) ->
  return $(el).outerHeight() if $.fn.outerHeight?
  return $(el).height()

outerWidth = (el) ->
  return $(el).outerWidth() if $.fn.outerWidth?
  return $(el).width()

class SimpleSlideView
  constructor: (element, options) ->
    @options = $.extend true, {}, defaults, options
    @options.heightDuration = @options.duration unless @options.heightDuration
    @$container = $ element
    @$views = if typeof @options.views is 'string' then @$container.find(@options.views) else $(@options.views)
    @$activeView =  if @options.activeView? then $(@options.activeView) else @$views.first()
    @isActive = false
    @on() unless @options.deferOn

  on: () ->
    return if @isActive
    @isActive = true
    @$container.addClass @options.classNames.container
    @$views.addClass @options.classNames.view
    @$activeView.addClass @options.classNames.activeView
    @$views.not(@$activeView).css 'display', 'none'
    if @options.dataAttrEvent?
      @$container.on @options.dataAttrEvent, '[data-' + @options.dataAttr.push + ']', (event) =>
        $el = $(event.currentTarget)
        target = $el.data @options.dataAttr.push
        target = $el.attr('href') if !target.length
        if target.length
          event.preventDefault()
          @pushView target
      @$container.on @options.dataAttrEvent, '[data-' + @options.dataAttr.pop + ']', (event) =>
        $el = $(event.currentTarget)
        target = $el.data @options.dataAttr.pop
        target = $el.attr('href') if !target.length
        if target.length
          event.preventDefault()
          @popView target

  off: () ->
    return unless @isActive
    @isActive = false
    @$container.removeClass @options.classNames.container
    @$views.removeClass @options.classNames.view + ' ' + @options.classNames.activeView
    @$views.css 'display', ''
    if @options.dataAttrEvent?
      @$container.off @options.dataAttrEvent, '[data-' + @options.dataAttr.push + ']'
      @$container.off @options.dataAttrEvent, '[data-' + @options.dataAttr.pop + ']'

  changeView: (targetView, action = 'push') ->
    eventArgs = [targetView, action]
    @$container.trigger @options.eventNames.viewChangeStart, eventArgs
    $targetView = $ targetView
    $bothViews = @$activeView.add $targetView
    containerWidth = outerWidth @$container
    outAnimProps = {}
    inAnimProps = {}
    resetProps = ['left', 'position', 'top', 'width']

    if @options.scrollOnStart
      maxTop = if @options.scrollToContainerTop then @$container.position().top else 0
      if $(window).scrollTop() > maxTop
        if typeof @options.scrollOnStart is 'string' and $[@options.scrollOnStart]?
          $[@options.scrollOnStart] maxTop, @options.duration
        else
          window.scrollTo 0, maxTop

    @$container.css
      height: outerHeight @$container
      overflow: 'hidden'
      position: 'relative'
      width: '100%'

    $bothViews.css
      position: 'absolute'
      top: 0
      width: containerWidth

    if @options.useTransformProps
      transformProp = @options.cssPrefix + 'transform'
      translateBefore = if @options.use3D then 'translate3d(' else 'translateX('
      translateAfter = if @options.use3D then ', 0, 0)' else ')'
      resetProps.push transformProp
      $bothViews.css 'left', 0
      $targetView.css transformProp, translateBefore + (if action is 'push' then 100 else -100) + '%' + translateAfter
      outAnimProps[transformProp] = translateBefore + (if action is 'push' then -100 else 100)  + '%' + translateAfter
      inAnimProps[transformProp] = translateBefore + '0' + translateAfter
    else
      @$activeView.css 'left', 0
      $targetView.css 'left', if action is 'push' then containerWidth else containerWidth * -1
      outAnimProps['left'] = if action is 'push' then containerWidth * -1 else containerWidth
      inAnimProps['left'] = 0

    animateHeightCallback = () =>
      resetStyles @$container, ['height', 'overflow', 'position', 'width']
      @$container.trigger @options.eventNames.viewChangeEnd, eventArgs

    animateHeight = () =>
      if @options.resizeHeight
        @$container.animate
          height: outerHeight $targetView
          @options.heightDuration
          @options.easing
          animateHeightCallback
      else
        animateHeightCallback()

    $targetView.show()

    @$activeView.animate outAnimProps, @options.duration, @options.easing, () ->
      resetStyles(@, resetProps).hide()

    $targetView.animate inAnimProps, @options.duration, @options.easing, () =>
      resetStyles($targetView, resetProps)
      animateHeight() if @options.deferHeightChange

    animateHeight() unless @options.deferHeightChange

    @$activeView.removeClass @options.classNames.activeView
    $targetView.addClass @options.classNames.activeView
    @$activeView = $targetView

  pushView: (targetView) -> @changeView targetView, 'push'
  popView: (targetView) -> @changeView targetView, 'pop'

$.fn.simpleSlideView = (options = {}, extras) ->
  options = { views: options } if typeof options isnt 'object'
  if typeof extras is 'object' then $.extend options, extras
  return new SimpleSlideView @, options