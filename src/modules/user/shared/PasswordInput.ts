import { InputType, Field } from "type-graphql";
import { MinLength } from "class-validator";

@InputType()
export class PasswordInput {
    @Field()
    @MinLength(3)
    password: string;
}
