'use strict'

//Popups for each book
$('.select-book-button').on('click', function(){
  $(this).siblings('section').toggle();
});

$('.view-details-button').on('click', function(){
  window.location.href = `/books/${this.id}`;
})
$('#nav').on('click', function(){
  $('#nav-buttons').toggle();
})

$('#update-book-button').on('click', function(){
  $('#update-form').toggle();
})

// $('.delete-book-button').on('click', function(){
//   let path = Number(this.id);
//   window.location.href = `/delete/${path}`;
// })

