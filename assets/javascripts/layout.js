$(window).on("load", function() {

    var width = $(".postWrapper").width();
    var height = "innerHeight" in window  ? window.innerHeight  : document.documentElement.offsetHeight;




    height = height - $('.blockGroup').height()

    $('.section--frontpage').height(height)
    $('.textLogo--frontpage').css('line-height',height+"px");


    var height = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;

    var margin = (height - $('#slideshow img').height()) / 2

    $('#slideshow').css("padding-top",margin)
    $("#slideshow").hide().fadeIn(1000)

    console.log("img height: " + $('#slideshow p img').height())
    console.log("img width: " + $('#slideshow p img').width())

    if ($('#slideshow p img').height() > $('#slideshow p img').width() ) {


        console.log("portrait")

        $('#slideshow p img').css("height", "50%")

        $('#slideshow p img').css("width", "auto")

        var padding = (width - $('#slideshow p img').width()) / 2

        var topPadding = (window.innerHeight - $("#slideshow p img").height()) / 2

        console.log("topPadding: " + topPadding)

        $('#slideshow').css("padding-left",padding)
        $('#slideshow').css("padding-top",topPadding)

    } else {

        console.log("landscape")

        $('#slideshow p img').css("height", "auto")
        $('#slideshow p img').css("width", "100%")


        var padding = (height - $('#slideshow p img').height()) / 2
        $('#slideshow').css("padding-top",padding)
        $('#slideshow').css("padding-left","0")
    }


})
