$(window).on("load", function() {
    $( ".loading" ).animate({
       opacity: 0
   }, 500, function() {
      $('html, body').css('overflowY', 'auto');
      document.body.addEventListener('touchmove', function(e){  });
     }).remove();
});

document.body.addEventListener('touchmove', function(e){ e.preventDefault(); });
