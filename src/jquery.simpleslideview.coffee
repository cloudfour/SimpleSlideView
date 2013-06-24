$ = jQuery
$.SimpleSlideView = (options) ->
  settings =
    container: ".views"
    views: ".view"
    active: false
    duration: 500
  settings = $.extend settings, options

  $container = $(settings.container)
  $views = $(settings.views, $container)
  $active = if settings.active then $(active) else $views.first()

  isActive = false
  cssSupport = (Modernizr? and Modernizr.csstransforms and Modernizr.csstransitions)
  transEndEventNames =
    'WebkitTransition': 'webkitTransitionEnd'
    'MozTransition': 'transitionend'
    'OTransition': 'oTransitionEnd otransitionend'
    'msTransition': 'MSTransitionEnd'
    'transition': 'transitionend'
  if cssSupport
    transformPrefix = Modernizr.prefixed('transform').replace(/([A-Z])/g, (str,m1) -> return '-' + m1.toLowerCase()).replace(/^ms-/,'-ms-')
    transEndEventName = transEndEventNames[Modernizr.prefixed 'transition']

  actions = {
    slideView: (target, push) ->
      $target = $(target)
      containerWidth = $container.width()
      $container.css
        height: $container.outerHeight()
        overflow: "hidden"
        position: "relative"
        width: "100%"
      if cssSupport
        actions.animateCSS $target, push, containerWidth
      else
        actions.animateJS $target, push, containerWidth

    animateCSS: ($target, push, containerWidth) ->
      distance = if push then containerWidth * -1 else containerWidth
      $target.show 0, () ->
        $active.css
          transition: transformPrefix + " " + settings.duration + "ms ease"
          transform: "translateX(" + distance + "px)"
        $target.css
          transition: transformPrefix + " " + settings.duration + "ms ease"
          transform: "translateX(" + distance + "px)"
        $container.css
          transition: "height " + settings.duration + "ms linear"
          height: $target.outerHeight() + "px"
        if $(window).scrollTop() > $container.position().top
          $.scrollTo $container, settings.duration
      .css
        left: if push then containerWidth else containerWidth * -1
        position: "absolute"
        top: 0
        width: containerWidth
      $(window).on transEndEventName, () ->
        $target.attr "style", ""
        $active.attr("style", "").hide()
        $(window).off transEndEventName
        $active = $target

    animateJS: ($target, push, containerWidth) ->
      $active.css
        left: 0
        position: "absolute"
        top: 0
        width: containerWidth
      .animate
        left: if push then containerWidth * -1 else containerWidth
        () ->
          $(@).attr("style", "").hide()
      $target.show().css
        left: if push then containerWidth else containerWidth * -1
        position: "absolute"
        top: 0
        width: containerWidth
      .animate
        left: 0
        () ->
          $(@).attr("style", "")
      $container.animate height: $target.outerHeight()
      if $(window).scrollTop() > $container.position().top
        $.scrollTo $container, settings.duration
      $active = $target

    on: () ->
      if isActive then return
      isActive = true
      $views.not($active).css "display", "none"
      $container.on "touchstart mousedown", "[data-pushview]", (event) ->
        event.preventDefault()
        actions.pushView $(@).data "pushview"
      $container.on "touchstart mousedown", "[data-popview]", (event) ->
        event.preventDefault()
        actions.popView $(@).data("popview")
      $container.on "click", "[data-pushview]", (e) -> e.preventDefault()
      $container.on "click", "[data-popview]", (e) -> e.preventDefault()
    
    off: () ->
      unless isActive then return
      isActive = false
      $container.add($views).stop()
      $container.css
        height: ""
        overflow: ""
        position: ""
        width: ""
      $views.css
        left: ""
        position: ""
        top: ""
        width: ""
      $container.off "touchstart mousedown click", "[data-pushview]"
      $container.off "touchstart mousedown click", "[data-popview]"
      $views.css "display", ""

    pushView: (target) ->
      actions.slideView target, true

    popView: (target) ->
      actions.slideView target
  }

  on: actions.on
  off: actions.off
  pushView: actions.pushView
  popView: actions.popView

