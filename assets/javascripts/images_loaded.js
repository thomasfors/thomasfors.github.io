$(window).on("load", function() {

    $( ".loading" ).animate({
       opacity: 0
   }, 500, function() {
      $('html, body').css('overflowY', 'auto');
       $('body').fadeIn(5000);
      document.body.addEventListener('touchmove', function(e){ return true; });
      document.ontouchmove = function(e){ return true; }
     }).remove();
});


document.ontouchmove = function(e){ e.preventDefault(); }
