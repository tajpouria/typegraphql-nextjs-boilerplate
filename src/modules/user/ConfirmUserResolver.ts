import { Resolver, Mutation, Arg } from "type-graphql";
import { redis } from "../../redis";
import { User } from "../../entity/User";

@Resolver()
export class ConfirmUserResolver {
    @Mutation(() => Boolean)
    async confirm(@Arg("token") token: string): Promise<boolean> {
        const userId = await redis.get(token);

        if (!userId) {
            return false;
        }

        await redis.del(token);
        await User.update(userId, { confirmed: true });

        return true;
    }
}
