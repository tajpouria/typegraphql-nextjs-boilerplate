import { InputType, Field } from "type-graphql";
import { Length, IsEmail } from "class-validator";
import { IsEmailAlreadyExist } from "./isEmailAlreadyInUser";

@InputType()
export class RegisterInput {
    @Field()
    @Length(3, 255)
    firstName: string;

    @Field()
    @Length(3, 255)
    lastName: string;

    @Field()
    @IsEmail()
    @IsEmailAlreadyExist({ message: "Email already in use." })
    email: string;

    @Field()
    @Length(3, 255)
    password: string;
}
