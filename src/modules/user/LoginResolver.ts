import { Resolver, Mutation, Arg, Ctx } from "type-graphql";
import { User } from "../../entity/User";
import { LoginInput } from "./login/LoginInput";
import { compare } from "bcryptjs";

import { MyContext } from "../../types/MyContext";

@Resolver()
export class LoginResolver {
    @Mutation(() => User, { nullable: true })
    async login(
        @Arg("input")
        { email, password }: LoginInput,
        @Ctx() ctx: MyContext 
    ): Promise<User | null> {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.error("User not found");
            return null;
        }

        if (!user.confirmed) {
            console.error("User not confirmed");
            return null;
        }

        const isValid = await compare(password, user.password);

        if (!isValid) {
            console.error("invalid password");
            return null;
        }

        ctx.req.session!.userId = user.id;

        return user;
    }
}
