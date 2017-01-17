$(window).on("load", function() {
var height = "innerHeight" in window
               ? window.innerHeight
               : document.documentElement.offsetHeight;



$('.section--first,.section-backgroundImage').height(height)
height = height - ($('.block').height() /2 +40)
$('.section--frontpage').height(height)
$('.textLogo--frontpage').css('line-height',height+"px");
console.log()
})
