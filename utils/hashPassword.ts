import bcrypt from "bcrypt";
import { AppError } from "./AppError";

const saltRounds = 12;

export async function hashPassword(plainPassword: string): Promise<string> {
    try {
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.error(error);
        throw new AppError("Password Hashing failure: " + error)
    }
}

export async function verifyPassword(givenPassword: string, hash: string): Promise<boolean> {
    try {
        const isMatch = await bcrypt.compare(givenPassword, hash);
        return isMatch;
    } catch (error) {
        console.error(error);
        throw new AppError("Password Verification failure: " + error)
    }
}