$ = if jQuery? then jQuery else Zepto

scrollCallback =
  if $.scrollTo? and jQuery?
    (top, duration, callback) ->
      $.scrollTo top, duration, { 'axis':'y', 'onAfter': callback }
  else if $.scrollTo?
    $.scrollTo
  else
    (top, duration, callback) ->
      window.scrollTo 0, top
      if callback
        callback()

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
  duration: if $.fx? and $.fx.cssPrefix? then $.fx.speeds._default else 400

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
  cssPrefix: if $.fx? and $.fx.cssPrefix? then $.fx.cssPrefix else ''

  # If 'true', the height of the container will be resized
  # to match the height of the active view (both initially
  # and as the views change. You should set to 'false' if
  # your container's height is fixed.
  resizeHeight: true

  # Duration of the height animations when 'resizeHeight'
  # is true. If 'null', the value of the duration option
  # will be used.
  heightDuration: null

  # If 'true', the height change will not wait for the
  # slide to complete before resizing. This can feel
  # snappier but may affect performance.
  concurrentHeightChange: ! Zepto?

  # If 'start', the scrollCallback will happen before
  # the rest of the slide. If 'end', it will happen
  # after. If false, scrolling will be disabled.
  scrollOn: 'start'

  # The callback to use for scrolling when the view
  # change completes. Supports jQuery scrollTo,
  # ZeptoScroll and no scroll plugin, but you can
  # define your own. The callback should expect to
  # receive three arguments: a Y-coordinate for the
  # intended scroll position, a duration for the
  # animation (if supported), and an optional callback
  # when the action completes.
  scrollCallback: scrollCallback

  # Duration of the scroll animation if the callback
  # supports it. If 'null', the value of the duration
  # option will be used.
  scrollDuration: null

  # If 'true', the scroll will move to the top of the
  # container. If 'false', the top of the window will
  # be used.
  scrollToContainerTop: true

  # If scrollOn is 'start' and this is 'true', the
  # slide will not wait for the scroll to complete
  # before triggering other events. This can feel
  # snappier but may affect performance.
  concurrentScroll: ! Zepto?

  # If 'true', the height of the viewport will never
  # lower. If 'null', the value will be based on whether
  # or not resizeHeight and scrollOnStart are both truthy.
  # This is useful for avoiding odd animation in browsers
  # that resize the viewport as they scroll, such as
  # iOS Safari.
  maintainViewportHeight: null

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

  # Names of events that will get triggered. See the
  # README for more info.
  eventNames:
    on: 'slideViewOn'
    off: 'slideViewOff'
    beforeOn: 'slideViewBeforeOn'
    beforeOff: 'slideViewBeforeOff'
    deferred: 'slideViewDeferred'
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

pushOrPop = (action, pushResult = true, popResult = false) ->
  if action is 'push' then pushResult else popResult

class SimpleSlideView
  constructor: (element, options) ->
    @options = $.extend true, {}, defaults, options
    @options.heightDuration = @options.duration unless @options.heightDuration?
    @options.scrollDuration = @options.duration unless @options.scrollDuration?
    @options.maintainViewportHeight = @options.resizeHeight and @options.scrollOnStart unless @options.maintainViewportHeight?
    @options.maintainViewportHeight = false unless window.innerHeight?
    @$container = $ element
    @$views = if typeof @options.views is 'string' then @$container.find(@options.views) else $(@options.views)
    @$activeView =  if @options.activeView? then $(@options.activeView) else @$views.first()
    @isActive = false
    if @options.deferOn
      @$container.trigger @options.eventNames.deferred
    else
      @on()

  on: () ->
    return if @isActive
    @$container.trigger @options.eventNames.beforeOn
    @queue = []
    @isActive = true
    @isSliding = false
    @$container.addClass @options.classNames.container
    @$views.addClass @options.classNames.view
    @$activeView.addClass @options.classNames.activeView
    @$views.not(@$activeView).css 'display', 'none'
    if @options.maintainViewportHeight
      @lastViewportHeight = window.innerHeight
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
    @$container.trigger @options.eventNames.on

  off: () ->
    return unless @isActive
    @$container.trigger @options.eventNames.beforeOff
    @queue = []
    @isActive = false
    @isSliding = false
    @$container.removeClass @options.classNames.container
    @$views.removeClass @options.classNames.view + ' ' + @options.classNames.activeView
    @$views.css 'display', ''
    if @options.maintainViewportHeight
      $('html').css 'min-height', ''
    if @options.dataAttrEvent?
      @$container.off @options.dataAttrEvent, '[data-' + @options.dataAttr.push + ']'
      @$container.off @options.dataAttrEvent, '[data-' + @options.dataAttr.pop + ']'
    @$container.trigger @options.eventNames.off

  toggle: (activate = !@isActive) ->
    return @on() if activate
    return @off()

  changeView: (targetView, action) ->
    # do not continue if the plugin is not currently active
    return if !@isActive

    # do not continue if target view is nonexistent or the same
    # as the currently active view
    $targetView = $ targetView
    return if !$targetView.length or $targetView[0] is @$activeView[0]

    # do not continue if a slide is already occurring or there
    # are existing items in the queue
    args = arguments
    return @queue.push args if @isSliding or @queue.length

    # otherwise, trigger the start of the change events
    @isSliding = true
    @$container.trigger @options.eventNames.viewChangeStart, args

    # determine relevant properties, styles, etc. prior to
    # the view change beginning in earnest

    $bothViews = @$activeView.add $targetView
    outAnimProps = {}
    inAnimProps = {}
    resetProps = ['left', 'position', 'top', 'width']

    containerWidth = outerWidth @$container

    containerCSS =
      height: outerHeight @$container
      overflow: 'hidden'
      position: 'relative'
      width: '100%'

    activeCSS = {}
    targetCSS = {}

    bothCSS =
      position: 'absolute'
      top: 0
      width: containerWidth

    if @options.useTransformProps
      transformProp = @options.cssPrefix + 'transform'
      translateBefore = if @options.use3D then 'translate3d(' else 'translateX('
      translateAfter = if @options.use3D then ', 0, 0)' else ')'
      resetProps.push transformProp
      bothCSS['left'] = 0
      targetCSS[transformProp] = translateBefore + pushOrPop(action, 100, -100) + '%' + translateAfter
      outAnimProps[transformProp] = translateBefore + pushOrPop(action, -100, 100)  + '%' + translateAfter
      inAnimProps[transformProp] = translateBefore + '0' + translateAfter
    else
      activeCSS['left'] = 0
      targetCSS['left'] = pushOrPop(action, containerWidth, containerWidth * -1)
      outAnimProps['left'] = pushOrPop(action, containerWidth * -1, containerWidth)
      inAnimProps['left'] = 0

    # build anonymous functions for carrying out these specific actions

    # after the scroll (if the scroll happens at the end)
    onScrollEnd = () =>
      @isSliding = false
      @$container.trigger @options.eventNames.viewChangeEnd, args
      @changeView.apply @, @queue.shift() if @queue.length

    # after the change
    onChangeEnd = () =>
      resetStyles @$container, ['height', 'overflow', 'position', 'width']
      @$activeView.removeClass @options.classNames.activeView
      $targetView.addClass @options.classNames.activeView
      @$activeView = $targetView
      if @options.scrollCallback and @options.scrollOn is 'end'
        @_scrollToTop(onScrollEnd)
      else
        onScrollEnd()

    # just before the change
    beforeChangeEnd = () =>
      if @options.resizeHeight
        if @options.maintainViewportHeight and window.innerHeight > @lastViewportHeight
          @lastViewportHeight = window.innerHeight
          $html.css 'min-height', (@lastViewportHeight + top) + 'px'
        @$container.animate
          height: outerHeight $targetView
          @options.heightDuration
          @options.easing
          onChangeEnd
      else
        onChangeEnd()

    # the main action
    changeAction = () =>
      @$container.css containerCSS
      $bothViews.css bothCSS
      @$activeView.css activeCSS
      $targetView.css targetCSS
      $targetView.show()
      @$activeView.animate outAnimProps, @options.duration, @options.easing, () -> resetStyles(@, resetProps).hide()
      $targetView.animate inAnimProps, @options.duration, @options.easing, () =>
        resetStyles $targetView, resetProps
        beforeChangeEnd() unless @options.concurrentHeightChange
      beforeChangeEnd() if @options.concurrentHeightChange

    # if scrolling should happen at the start, fire the change
    # action after the scroll action
    if @options.scrollCallback and @options.scrollOn is 'start'
      if @options.concurrentScroll
        @_scrollToTop()
      else
        return @_scrollToTop(changeAction)

    # otherwise, fire it up!
    changeAction()

  _scrollToTop: (callback) ->
    top = if @options.scrollToContainerTop then @$container.position().top else 0
    if $(window).scrollTop() > top
      @options.scrollCallback top, @options.scrollDuration, callback
    else if callback?
      callback()

  pushView: (targetView) -> @changeView targetView, 'push'
  popView: (targetView) -> @changeView targetView, 'pop'

$.fn.simpleSlideView = (options = {}, extras) ->
  options = { views: options } if typeof options isnt 'object'
  if typeof extras is 'object' then $.extend options, extras
  return new SimpleSlideView @, options
