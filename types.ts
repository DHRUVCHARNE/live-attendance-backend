import {z} from "zod";

export const SignupSchema = z.object({
    name:z.string(),
    email:z.email(),
    password:z.string().min(6),
    role: z.enum(["student", "teacher"])
});

export const SigninSchema = z.object({
    email:z.email(),
    password:z.string()
});

export const CreateClassSchema = z.object({
    className:z.string().min(1)
})

export const AddStudentSchema = z.object({
    studentId:z.string().min(1)
})
export const AttendanceStartSchema = z.object({
    classId:z.string()
})
