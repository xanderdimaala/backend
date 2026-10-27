import * as bookService from '../services/bookServices.js';

export const fetchAllbooks = async(req, res) =>{
    const books = await bookService.fetchAllbooks();
    res.status(200).json(books);
}

export const Createbook = async (req, res) =>{
    console.log(req);
    const book = {name, srCode, program};

    try{
        const studentId = await bookService.Createbook(book);
        res.status(200).jso({
            success: true,
            message: studentId
        })
    }catch(e){
        console.log(e);
        res.status(500).json({
            error: "Internal Service Error"
        });
    }
}