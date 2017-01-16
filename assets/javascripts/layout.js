$(window).on("load", function() {
var height = "innerHeight" in window
               ? window.innerHeight
               : document.documentElement.offsetHeight;

$('.section--first,.section-backgroundImage').height(height)
$('.section--frontpage').height("15rem")
})
