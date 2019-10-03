import {
    ClassType,
    Resolver,
    Mutation,
    Arg,
    UseMiddleware
} from "type-graphql";
import { Middleware } from "type-graphql/dist/interfaces/Middleware";

export const createCreateResolver = <T extends ClassType, K extends ClassType>(
    suffix: string,
    ReturnType: T,
    InputType: K,
    Entity: any,
    middleware?: Middleware<any>[]
) => {
    @Resolver()
    class BaseResolver {
        @Mutation(() => ReturnType, { name: `create${suffix}` })
        @UseMiddleware(...(middleware || []))
        async create(@Arg("input", () => InputType) input: any) {
            return await Entity.create(input).save();
        }
    }
    return BaseResolver;
};
