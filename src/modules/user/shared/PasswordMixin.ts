import { ClassType, InputType, Field } from "type-graphql";
import { MinLength } from "class-validator";

export const PasswordMixin = <T extends ClassType>(BaseClass: T) => {
    @InputType({ isAbstract: true })
    class PasswordInput extends BaseClass {
        @Field()
        @MinLength(3)
        password: string;
    }

    return PasswordInput;
};
