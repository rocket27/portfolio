$(window).on('load', function() {
    
    var box = $('.box');
    box.addClass('bounce');

});

$('.certificateLink').fancybox({
    type : 'inline'
});

$('.popup__closeButton').on('click', function(e) {

    e.preventDefault();
    $.fancybox.close();

});