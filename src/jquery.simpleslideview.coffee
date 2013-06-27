# compatible with jQuery or Zepto
$ = if jQuery? then jQuery else Zepto
isZepto = Zepto? and $ is Zepto

# helper to attach to window method
$window = $(this)

# default settings
defaults =
  views: '> div'
  cssSupport: false
  activeView: null
  duration: $.fx.speeds._default
  easing: null
  jsEasing: null
  cssEasing: null
  dataAttrEvent: 'click'
  dataAttr:
    push: 'pushview'
    pop: 'popview'
  enableScrollTo: true

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

# the main plugin class, will get instantiated from $.fn.simpleSlideView
class SimpleSlideView
  constructor: (@element, options) ->
    @options = $.extend true, {}, defaults, options
    @$container = $ @element
    @$views = @$container.find @options.views
    @$activeView = if @options.activeView then @$container.find @options.activeView else @$views.first()
    @$window = $ window
    @animate = if @options.cssSupport then @animateCSS else @animateJS
    @options.easing = @options.cssEasing if @options.cssSupport and @options.cssEasing
    @options.easing = @options.jsEasing if @options.jsEasing unless @options.cssSupport
    @options.easing = 'linear' if @options.cssSupport unless @options.easing

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
    $targetView = $ targetView
    containerWidth = @$container.width()
    @$container.css
      height: @$container.outerHeight()
      overflow: 'hidden'
      position: 'relative'
      width: '100%'
    @animate $targetView, push, containerWidth

  scrollToTop: () ->
    if @options.enableScrollTo and $.fn.scrollTo?
      containerTop = @$container.position().top
      if $window.scrollTop() > containerTop
        $.scrollTo containerTop, @options.duration

  animateJS: ($targetView, push, containerWidth) ->
    resetCSS =
      left: ''
      position: ''
      top: ''
      width: ''
    baseCSS = $.extend {}, resetCSS,
      position: 'absolute'
      top: 0
      width: containerWidth
    @$activeView.css $.extend {}, baseCSS,
      left: 0
    @$activeView.animate
      left: if push then containerWidth * -1 else containerWidth
      @options.duration
      @options.easing
      () -> $(@).css(resetCSS).hide()
    $targetView.show().css $.extend {}, baseCSS,
      left: if push then containerWidth else containerWidth * -1
    $targetView.animate
      left: 0
      @options.duration
      @options.easing
      () -> $(@).css(resetCSS)
    @$container.animate height: $targetView.outerHeight()
    @scrollToTop()
    @$activeView = $targetView

  animateCSS: ($targetView, push, containerWidth) ->
    distance = if push then containerWidth * -1 else containerWidth

    @$container.css backfaceVisibility, 'hidden'

    baseCSS =
      position: 'absolute'
      top: 0
      width: '100%'
    baseCSS[backfaceVisibility] = 'hidden'
    baseCSS[transition] = transform + ' ' + @options.duration + 'ms ' + @options.easing

    preCSS = {}
    preCSS[transform] = 'translateX(' + (distance * -1) + 'px)'
    inCSS = {}
    inCSS[transform] = 'translateX(' + 0 + 'px)'

    resetCSS =
      display: ''
      position: ''
      top: ''
      width: ''
    resetCSS[backfaceVisibility] = ''
    resetCSS[transition] = ''
    resetCSS[transform] = ''

    $targetView.one transitionEnd, () =>
      @$activeView.add($targetView).css resetCSS
      @$activeView.hide()
      @$activeView = $targetView
      @$container.css transition, 'height ' + (@options.duration / 2) + 'ms ' + @options.easing
      @$container.css 'height', $targetView.outerHeight()
      @scrollToTop()

    $targetView.css(preCSS).show 0, () =>
      @$activeView.add($targetView).css baseCSS
      @$activeView.css transform, 'translateX(' + distance + 'px)'
      $targetView.css transform, 'translateX(' + 0 + 'px)'

  pushView: (targetView) ->
    @slideView targetView, true

  popView: (targetView) ->
    @slideView targetView


$.fn.simpleSlideView = (options = {}, args...) ->
  options = { views: options } if typeof options isnt 'object'
  for arg in args when typeof arg is 'object'
    $.extend options, arg
  return new SimpleSlideView @, options