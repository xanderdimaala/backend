import * as bookService from '../services/bookServices.js';

export const fetchAllBooks = async(req, res) =>{
    const bookw = await bookService.fetchAllBooks();
    res.status(200).json(books);
}