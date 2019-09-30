import { InputType, Field } from "type-graphql";
import { IsEmail } from "class-validator";

@InputType()
export class LoginInput {
    @Field()
    @IsEmail()
    email: string;

    @Field()
    password: string;
}
