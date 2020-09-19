const books = require("./books.json");
const authors = require("./authors.json");

// const debug = (...params) => console.log(params);

const getBooks = async () => books;

const getBook = async (id) => {
  return books.find((book) => book.id === id);
};

const likeBook = async (id) => {
  const book = await getBook(id);

  if (!book) {
    return false;
  }

  book.likes += 1;

  return true;
};

const getAuthors = async () => authors;

const getAuthor = async (id) => {
  // debug("getAuthor", id);
  return authors.find((author) => author.id === id);
};

const getManyAuthors = async (ids) => {
  return ids.map((id) => getAuthor(id));
};

const getUserByToken = async (token) => {
  if (token !== "giovani") {
    return null;
  }

  return { token };
};

module.exports = {
  getBooks,
  getBook,
  likeBook,
  getAuthors,
  getAuthor,
  getManyAuthors,
  getUserByToken,
};
