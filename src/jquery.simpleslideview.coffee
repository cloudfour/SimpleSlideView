$ = jQuery

# helper to attach to window method
$window = $(window)

# default settings
defaults =
  views: '> div'
  activeView: null
  cssSupport: Modernizr? and Modernizr.csstransforms and Modernizr.csstransitions
  duration: $.fx.speeds._default
  jsEasing: 'swing'
  cssEasing: 'ease-out'
  dataAttrEvent: 'click'
  dataAttr:
    push: 'pushview'
    pop: 'popview'
  eventNames:
    viewChangeStart: 'viewChangeStart'
    viewChangeEnd: 'viewChangeEnd'

# helpers for new or experimental CSS features
prefix = ''
vendors =
  Webkit: 'webkit'
  Moz: ''
  O: 'o'
  ms: 'MS'
testEl = document.createElement('div')

# determine prefix(es) to use
for vendor, event of vendors when testEl.style[vendor + 'TransitionProperty']?
  prefix = '-' + vendor.toLowerCase() + '-'
  eventPrefix = event
  break

# possibly prefixed property and event names
transform = prefix + 'transform'
transition = prefix + 'transition'
backfaceVisibility = prefix + 'backface-visibility'
transitionEnd = if eventPrefix? then eventPrefix + 'TransitionEnd' else 'transitionend'

# helper function for resetting styles
resetStyles = (el, styles) ->
  $el = $(el)
  reset = {}
  for style in styles
    reset[style] = ''
  $el.css reset

# the main plugin class, will get instantiated from $.fn.simpleSlideView
class SimpleSlideView
  constructor: (@element, options) ->
    @options = $.extend true, {}, defaults, options
    @$container = $ @element
    @$views = @$container.find @options.views
    @$activeView = if @options.activeView? then @options.activeView else @$views.first()
    @animate = if @options.cssSupport then @animateCSS else @animateJS

  on: () ->
    @$views.not(@$activeView).hide()
    if @options.dataAttrEvent?
      @$container.on @options.dataAttrEvent, '[data-' + @options.dataAttr.push + ']', (event) =>
        event.preventDefault()
        @pushView $(event.target).data @options.dataAttr.push
      @$container.on @options.dataAttrEvent, '[data-' + @options.dataAttr.pop + ']', (event) =>
        event.preventDefault()
        @popView $(event.target).data @options.dataAttr.pop

  off: () ->
    @$views.show()
    if @options.dataAttrEvent?
      @$container.off @options.dataAttrEvent, '[data-' + @options.dataAttr.push + ']'
      @$container.off @options.dataAttrEvent, '[data-' + @options.dataAttr.pop + ']'

  slideView: (targetView, push) ->
    @$container.trigger @options.eventNames.viewChangeStart
    $targetView = $ targetView
    containerWidth = @$container.outerWidth()
    @$container.css
      height: @$container.outerHeight()
      overflow: 'hidden'
      position: 'relative'
      width: '100%'
    @animate $targetView, push, containerWidth

  animateJS: ($targetView, push, containerWidth) ->
    baseCSS =
      position: 'absolute'
      top: 0
      width: containerWidth
    @$activeView.css $.extend {}, baseCSS,
      left: 0
    @$activeView.animate
      left: if push then containerWidth * -1 else containerWidth
      @options.duration
      @options.jsEasing
      () -> resetStyles(@, ['left', 'position', 'top', 'width']).hide()
    $targetView.show().css $.extend {}, baseCSS,
      left: if push then containerWidth else containerWidth * -1
    $targetView.animate
      left: 0
      @options.duration
      @options.jsEasing
      () -> resetStyles @, ['left', 'position', 'top', 'width']
    @$container.animate height: $targetView.outerHeight(), () =>
      resetStyles @$container, ['height', 'overflow', 'position', 'width']
      @$container.trigger @options.eventNames.viewChangeEnd
    @$activeView = $targetView

  animateCSS: ($targetView, push, containerWidth) ->
    distance = if push then containerWidth * -1 else containerWidth
    @$container.css backfaceVisibility, 'hidden'
    baseCSS =
      position: 'absolute'
      top: 0
      width: '100%'
    baseCSS[backfaceVisibility] = 'hidden'
    baseCSS[transition] = transform + ' ' + @options.duration + 'ms ' + @options.cssEasing

    $window.on transitionEnd, (event) =>
      if event.target is $targetView[0]
        resetStyles @$activeView.add($targetView), [
          'display', 'position', 'top', 'width'
          backfaceVisibility, transition, transform
        ]
        @$activeView.hide()
        @$activeView = $targetView
        @$container.css transition, 'height ' + (@options.duration / 2) + 'ms ' + @options.cssEasing
        @$container.css 'height', $targetView.outerHeight()
      else if event.target is @$container[0]
        resetStyles @$container, [
          'height'
          'overflow'
          'position'
          'width'
          backfaceVisibility
          transition
        ]
        $window.off transitionEnd
        @$container.trigger @options.eventNames.viewChangeEnd
      else return

    $targetView.css(transform, 'translateX(' + (distance * -1) + 'px)').show 0, () =>
      @$activeView.add($targetView).css baseCSS
      @$activeView.css transform, 'translateX(' + distance + 'px)'
      $targetView.css transform, 'translateX(' + 0 + 'px)'

  pushView: (targetView) -> @slideView targetView, true

  popView: (targetView) -> @slideView targetView


$.fn.simpleSlideView = (options = {}, args...) ->
  options = { views: options } if typeof options isnt 'object'
  for arg in args when typeof arg is 'object'
    $.extend options, arg
  return new SimpleSlideView @, options