import * as bookModel from '../models/bookModel.js';

export const fetchAllbooks = async() =>{
    const books = await bookModel.fetch();
    return books;
}

export const Createbook = async(book) => {
    const bookId = await bookModel.insert(book);
    return bookId
}