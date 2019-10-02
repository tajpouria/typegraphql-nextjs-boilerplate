import { Resolver, Query, Mutation, Arg, UseMiddleware } from "type-graphql";
import { User } from "../../entity/User";
import { RegisterInput } from "./register/RegisterInput";
import { sendEmail } from "./utils/sendEmail";
import { createAndSetConfirmationLink } from "./utils/createAndSetConfirmationLink";
import { IsAuth } from "./middleware/IsAuth";

@Resolver()
export class UserResolver {
    @Query(() => String)
    @UseMiddleware(IsAuth)
    hello(): string {
        return "hello user";
    }

    @Query(() => [User])
    async users(): Promise<User[]> {
        const users = await User.find();

        return users;
    }

    @Mutation(() => User)
    async register(@Arg("input")
    {
        firstName,
        lastName,
        email,
        password
    }: RegisterInput): Promise<User> {
        const user = await User.create({
            firstName,
            lastName,
            email,
            password
        }).save();

        const confirmationLink = await createAndSetConfirmationLink(user.id);
        await sendEmail(email, confirmationLink);

        return user;
    }
}
