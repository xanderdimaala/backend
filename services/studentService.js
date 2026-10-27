import * as studentModel from '../models/studentModel.js';

export const fetchAllstudent = async() =>{
    const student = await studentModel.fetch();
    return student;
}

export const Createstudent = async(student) =>{
    const studentId = await studentModel.insert(student);
    return studentId
}