$(document).ready(function() {

    var width = "innerWidth" in window ? window.innerWidth : document.documentElement.offsetWidth;
    var height = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;

    $('#slideshow img:gt(0)').hide();

    $('#previous').click(function() {
        $('#slideshow img:first').fadeOut(0);
        $('#slideshow img:last').fadeIn(1000).prependTo('#slideshow p');


        if ($('#slideshow p img').height() > window.innerHeight ) {

            $('#slideshow p img').css("height", "100%")
            $('#slideshow p img').css("width", "auto")
            var padding = (width - $('#slideshow p img').width()) / 2
            $('#slideshow').css("padding-left",padding)
            $('#slideshow').css("padding-top","0")
        } else {
            $('#slideshow p img').css("height", "auto")
            $('#slideshow p img').css("width", "100%")
            var padding = (height - $('#slideshow p img').height()) / 2
            $('#slideshow').css("padding-top",padding)
            $('#slideshow').css("padding-left","0")
        }
    });


    $('#next').click(function() {
        $('#slideshow img:first').fadeOut(00).next().fadeIn(1000).end().appendTo('#slideshow p');

        if ($('#slideshow p img').height() > window.innerHeight ) {

            $('#slideshow p img').css("height", "100%")
            $('#slideshow p img').css("width", "auto")
            var padding = (width - $('#slideshow p img').width()) / 2
            $('#slideshow').css("padding-left",padding)
            $('#slideshow').css("padding-top","0")
        } else {
            $('#slideshow p img').css("height", "auto")
            $('#slideshow p img').css("width", "100%")
            var padding = (height - $('#slideshow p img').height()) / 2
            $('#slideshow').css("padding-top",padding)
            $('#slideshow').css("padding-left","0")
        }

    });
});
