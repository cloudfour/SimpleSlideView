$ = if jQuery? then jQuery else Zepto

defaults =
  views: '.view'
  activeView: null
  duration: $.fx.speeds._default
  easing: null
  useTransformProps: Zepto?
  use3D: Modernizr? and Modernizr.csstransforms3d
  cssPrefix: if $.fx.cssPrefix? then $.fx.cssPrefix else ''
  resizeHeight: true
  heightDuration: null
  deferHeightChange: Zepto?
  dataAttrEvent: 'click'
  dataAttr:
    push: 'pushview'
    pop: 'popview'
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
    @$views = @$container.find @options.views
    @$activeView =  if @options.activeView? then $(@options.activeView) else @$views.first()

  on: () ->
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
    @$views.css 'display', ''
    if @options.dataAttrEvent?
      @$container.off @options.dataAttrEvent, '[data-' + @options.dataAttr.push + ']'
      @$container.off @options.dataAttrEvent, '[data-' + @options.dataAttr.pop + ']'

  changeView: (targetView, push) ->
    @$container.trigger @options.eventNames.viewChangeStart
    $targetView = $ targetView
    $bothViews = @$activeView.add $targetView
    containerWidth = outerWidth @$container
    outAnimProps = {}
    inAnimProps = {}
    resetProps = ['left', 'position', 'top', 'width']

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
      $targetView.css transformProp, translateBefore + (if push then 100 else -100) + '%' + translateAfter
      outAnimProps[transformProp] = translateBefore + (if push then -100 else 100)  + '%' + translateAfter
      inAnimProps[transformProp] = translateBefore + '0' + translateAfter
    else
      @$activeView.css 'left', 0
      $targetView.css 'left', if push then containerWidth else containerWidth * -1
      outAnimProps['left'] = if push then containerWidth * -1 else containerWidth
      inAnimProps['left'] = 0

    animateHeightCallback = () =>
      resetStyles @$container, ['height', 'overflow', 'position', 'width']
      @$container.trigger @options.eventNames.viewChangeEnd

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

    @$activeView = $targetView

  pushView: (targetView) -> @changeView targetView, true
  popView: (targetView) -> @changeView targetView

$.fn.simpleSlideView = (options = {}, extras) ->
  options = { views: options } if typeof options isnt 'object'
  if typeof extras is 'object' then $.extend options, extras
  return new SimpleSlideView @, options