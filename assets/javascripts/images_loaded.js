$(window).on("load", function() {

    $( ".loading" ).animate({
       opacity: 0
   }, 500, function() {
      $('html, body').css('overflowY', 'auto');
       $( "body" ).animate({
           opacity: 1
       }, 5000, function() {
           newQuote("Thomas Fors")
         });

       setInterval(function(){ newQuote("Thomas Fors") }, 6000);
      document.body.addEventListener('touchmove', function(e){ return true; });
      document.ontouchmove = function(e){ return true; }
     }).remove();
});


document.ontouchmove = function(e){ e.preventDefault(); }
