$(window).on("load", function() {
    $( ".loading" ).animate({
       opacity: 0
   }, 500, function() {
      $('html, body').css('overflowY', 'auto');
      document.body.addEventListener('touchmove', function(e){ return true; });
      document.ontouchmove = function(e){ return true; }
     }).remove();
});


document.ontouchmove = function(e){ e.preventDefault(); }
