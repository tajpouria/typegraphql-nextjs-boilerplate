import { Resolver, Mutation, Arg } from "type-graphql";
import { redis } from "../../redis";
import { User } from "../../entity/User";
import { UserConfirmationPrefixes } from "./shared/userConfirmationPrefixes";

@Resolver()
export class ConfirmUserResolver {
    @Mutation(() => Boolean)
    async confirm(@Arg("token") token: string): Promise<boolean> {
        const userId = await redis.get(
            UserConfirmationPrefixes.confirmUser + token
        );

        if (!userId) {
            return false;
        }

        await redis.del(UserConfirmationPrefixes.confirmUser + token);
        await User.update(userId, { confirmed: true });

        return true;
    }
}
