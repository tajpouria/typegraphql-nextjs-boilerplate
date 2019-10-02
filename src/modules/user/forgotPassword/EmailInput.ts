import { InputType, Field } from "type-graphql";
import { IsEmail } from "class-validator";

@InputType()
export class EmailInput {
    @Field()
    @IsEmail()
    email: string;
}
