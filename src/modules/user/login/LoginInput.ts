import { InputType, Field } from "type-graphql";
import { IsEmail } from "class-validator";
import { PasswordMixin } from "../shared/PasswordMixin";

@InputType()
export class LoginInput extends PasswordMixin(class {}) {
    @Field()
    @IsEmail()
    email: string;
}
