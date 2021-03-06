'use strict';

// Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const cors = require('cors');
const methodOverride = require('method-override');

// Environment variables
require('dotenv').config();

// Application Setup
const app = express();
app.use(cors());

//allows us to look inside request.body (usually we can not it returns undefined)
app.use(express.urlencoded({extended:true}));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
const PORT = process.env.PORT || 3000;

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect().then(() => {
// Make sure the server is listening for requests
  app.listen(PORT, () => console.log(`Listening on ${PORT}`));
})
client.on('error', err => console.error(err));

app.use(methodOverride((req, res) => {
  if(req.body && typeof req.body === 'object' && '_method' in req.body){
    let method = req.body._method;
    delete req.body._method;
    return method;
  }
}))


// Routes
app.get('/', homePage);
app.get('/search', openSearch);
app.get('/books/:id', singleBook);
app.post('/add', addBook);
app.post('/searches', searchForBooks);
app.put('/update/:id', updateBook);
app.delete('/delete/:id', deleteBook);
app.use('*', notFound);
app.use(errorHandler);

// total: results.rows.pop()
///////////////////////////////////////////////////////////////////////
//HomePage
function homePage(req, res){
  let SQL = `SELECT * FROM books;`;
  client.query(SQL).then(results => {
    res.render('pages/index', { bookInst:  results.rows});
  });
}
///////////////////////////////////////////////////////////////////////
//Open the search page
function openSearch(req, res){
  res.render('pages/searches/new');
}
///////////////////////////////////////////////////////////////////////
//Add a book to db
function addBook(req, res) {
  let SQL = 'INSERT INTO books(author, title, isbn, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6);';
  let values = [req.body.select[1], req.body.select[0], req.body.select[2], req.body.image_url, req.body.description, req.body.select[3]];

  client.query(SQL, values).catch(error => errorHandler(error, req, res));

  let sql = 'SELECT * FROM books WHERE isbn=$1;';
  let id = [req.body.select[2]];
  client.query(sql,id).then(result => {
    res.status(200).redirect(`/books/${result.rows[0].id}`);
  }).catch(error => errorHandler(error, req, res));
}
///////////////////////////////////////////////////////////////////////
//Not Found
function notFound(req, res) {
  res.status(404).send('Not Found');
}
///////////////////////////////////////////////////////////////////////
//Error Handler
function errorHandler(error, req, res) {
  console.error(error);
  res.status(500).render('pages/error');
}
///////////////////////////////////////////////////////////////////////
//Single book detail page
function singleBook(req, res){
  let SQL = `SELECT * FROM books WHERE id=$1;`;
  let safeValue = [req.params.id];
  client.query(SQL,safeValue).then(data => {
    let sql = `SELECT DISTINCT bookshelf FROM books;`;
    client.query(sql).then(results => {
      res.status(200).render('pages/books/show', { bookInst: data.rows, bookID: req.params.id, lib: results.rows });
    }).catch(error => errorHandler(error, req, res));
  }).catch(error => errorHandler(error, req, res));
}
///////////////////////////////////////////////////////////////////////
//Update book detail page
function updateBook(req, res){
  let SQL = 'UPDATE books SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5, bookshelf=$6 WHERE id=$7;';
  let safeValues = [req.body.title, req.body.author, req.body.isbn, req.body.image_url, req.body.description, req.body.bookshelf, req.params.id];

  client.query(SQL, safeValues).then(result => {
    res.status(200).redirect(`/books/${req.params.id}`);
  }).catch(error => errorHandler(error, req, res));
}
//////////////////////////////////////////////////////////////////////
//Delete book from DB
function deleteBook(req, res){
  let SQL = 'DELETE FROM books WHERE id=$1;';
  let safeValue = [req.params.id];
  client.query(SQL, safeValue).then(result => {
    res.status(200).redirect('/');
  }).catch(error => errorHandler(error, req, res));
}

//USER FORM EVENT HANDLER/////////////////////////////////////////

function searchForBooks(req, res){
  const booksSearched = req.body.search[0];
  const typeOfSearch = req.body.search[1];
  let url =  `https://www.googleapis.com/books/v1/volumes?q=`;

  if (typeOfSearch === 'title') {
    url += `+intitle:${booksSearched}`;
  }
  if (typeOfSearch === 'author'){
    url += `inauthor:${booksSearched}`;
  }
  superagent.get(url)
    .then(results => {
      let resArr = results.body.items.map(value => {
        return new Book(value);
      });
      // res.status(200).send(resArr); functional--
      res.status(200).render('pages/searches/show', { bookInst: resArr, });
    }).catch(error => errorHandler(error, req, res));
}




app.post('/contact', (request, response) => {
  response.render('pages/index.ejs');
});

//////////////////////////////////////////////////////////////////////
//Book Constructor
function Book(data){
  this.bookImg = `https://books.google.com/books/content?id=${data.id}&printsec=frontcover&img=1&zoom=5&edge=curl&source=gbs_api`;
  this.title = data.volumeInfo.title;
  this.author = data.volumeInfo.authors;
  this.description = data.volumeInfo.description;
  this.ISBN = data.volumeInfo.industryIdentifiers[0].identifier;
  if(typeof data.volumeInfo.categories === 'object'){
    this.category = data.volumeInfo.categories[0];
  } else{
    this.category = data.volumeInfo.categories;
  }
}

