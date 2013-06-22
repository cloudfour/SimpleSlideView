$.SimpleSlideView = (container, views, active) ->
  $container = $(container)
  $views = $(views, $container)
  $active = if active then $(active) else $views.first()
  isActive = false

  actions = {
    slideView: (target, push) ->
      $target = $(target)
      containerWidth = $container.width()

      $container.css
        height: $container.outerHeight()
        overflow: "hidden"
        position: "relative"
        width: "100%"

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
      $container.animate
        height: $target.outerHeight()
        () ->
          $(@).css
            height: ""
            overflow: ""
            position: ""
            width: ""
      if $(window).scrollTop() > $container.position().top
        $.scrollTo $container, 200
      $active = $target

    on: () ->
      if isActive then return
      isActive = true
      $views.not($active).css "display", "none"
      $container.on "click", "[data-pushview]", (event) ->
        event.preventDefault()
        actions.pushView $(@).data("pushview")
      .on "click", "[data-popview]", (event) ->
        event.preventDefault()
        actions.popView $(@).data("popview")
    
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
      $container.off "click", "[data-pushview]"
      $container.off "click", "[data-popview]"
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
