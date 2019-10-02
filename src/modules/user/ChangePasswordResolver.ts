import { Resolver, Mutation, Arg, Ctx } from "type-graphql";
import { User } from "../../entity/User";
import { ChangePasswordInput } from "./forgotPassword/ChangePasswordInput";
import { redis } from "../../redis";
import { UserConfirmationPrefixes } from "./shared/userConfirmationPrefixes";
import { hash } from "bcryptjs";
import { MyContext } from "../../types/MyContext";

@Resolver()
export class ChangePasswordResolver {
    @Mutation(() => User, { nullable: true })
    async changePassword(
        @Arg("input")
        { token, password }: ChangePasswordInput,
        @Ctx() ctx: MyContext
    ): Promise<User> {
        const userId = await redis.get(
            UserConfirmationPrefixes.forgotPassword + token
        );

        if (!userId) {
            throw new Error("Invalid token.");
        }

        await redis.del(UserConfirmationPrefixes.forgotPassword + token);

        const user = await User.findOne(userId);

        if (!user) {
            throw new Error("There is not user associated by the given id.");
        }

        user.password = await hash(password, 12);

        await user.save();

        ctx.req.session!.userId = user.id;

        return user;
    }
}
