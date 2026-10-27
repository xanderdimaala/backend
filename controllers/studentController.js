import * as studentService from '../services/studentService.js';

export const fetchAllstudent = async(req, res) =>{
    const student = await studentService.fetchAllstudent();
    res.status(200).json(student);
}   

export const Createstudent = async (req, res) =>{
    console.log(req);
     const {name, srCode, program} = req.body;
    const student = {name, srCode, program};

    try{
        const studentId = await studentService.Createstudent(student);
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