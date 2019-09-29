import {
    Resolver,
    Query,
    Mutation,
    Arg,
    FieldResolver,
    Root
} from "type-graphql";
import { User } from "../entity/User";

@Resolver(User)
export class UserResolver {
    @Query(() => String)
    hello(): string {
        return "hello user";
    }

    @Query(() => [User])
    async users(): Promise<User[]> {
        const users = await User.find();

        return users;
    }

    @FieldResolver(() => String, { nullable: true })
    async fullName(@Root() parent: User) {
        return `${parent.firstName} ${parent.lastName}`;
    }

    @Mutation(() => User)
    async register(
        @Arg("firstName") firstName: string,
        @Arg("lastName") lastName: string,
        @Arg("email") email: string,
        @Arg("password") password: string
    ): Promise<User> {
        const user = await User.create({
            firstName,
            lastName,
            email,
            password
        }).save();

        return user;
    }
}
