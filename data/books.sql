DROP TABLE IF EXISTS books;

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    author VARCHAR(255),
    title VARCHAR(255),
    isbn VARCHAR(255),
    image_url VARCHAR(255),
    description TEXT,
    bookshelf VARCHAR(255)
);

-- INSERT INTO books (author, title, isbn, image_url, description, bookshelf)
-- VALUES('sample author', 'sample author', 123456789 , 'https://sample.url', 'sample description goes here', 'sample bookshelf');