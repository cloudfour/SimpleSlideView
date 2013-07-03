$ = if jQuery? then jQuery else Zepto

defaults =
  views: '.view'
  activeView: null
  duration: $.fx.speeds._default
  easing: if Zepto? and not jQuery? then 'ease-out' else 'swing'
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
    containerWidth = outerWidth(@$container)
    @$container.css
      height: outerHeight(@$container)
      overflow: 'hidden'
      position: 'relative'
      width: '100%'
    # This part used to be in a separate method
    baseCSS =
      position: 'absolute'
      top: 0
      width: containerWidth
    @$activeView.css $.extend {}, baseCSS,
      left: 0
    @$activeView.animate
      left: if push then containerWidth * -1 else containerWidth
      @options.duration
      @options.easing
      () -> resetStyles(@, ['left', 'position', 'top', 'width']).hide()
    $targetView.show().css $.extend {}, baseCSS,
      left: if push then containerWidth else containerWidth * -1
    $targetView.animate
      left: 0
      @options.duration
      @options.easing
      () -> resetStyles @, ['left', 'position', 'top', 'width']
    @$container.animate
      height: outerHeight($targetView)
      @options.duration
      @options.easing
      () =>
        resetStyles @$container, ['height', 'overflow', 'position', 'width']
        @$container.trigger @options.eventNames.viewChangeEnd
    @$activeView = $targetView

  pushView: (targetView) -> @changeView targetView, true
  popView: (targetView) -> @changeView targetView

$.fn.simpleSlideView = (options = {}, extras) ->
  options = { views: options } if typeof options isnt 'object'
  if typeof extras is 'object' then $.extend options, extras
  return new SimpleSlideView @, options