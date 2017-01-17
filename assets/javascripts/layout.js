$(window).on("load", function() {

var height = "innerHeight" in window  ? window.innerHeight  : document.documentElement.offsetHeight;

    $('.section--frontpage').height((height - $('.blockGroup').height()))
    $('.textLogo--frontpage').css('line-height',height+"px");

    $('#slideshow').width(window.innerWidth)
    $('#slideshow').height(window.innerHeight)

    var height = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
    var margin = (height - $('#slideshow img').height()) / 2
    $('#slideshow').css("padding-top",margin)


})
