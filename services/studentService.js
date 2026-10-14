import * as studentModel from '../models/studentModel.js';

export const fetchAllstudent = async() =>{
    const student = await studentModel.fetch();
    return student;
}