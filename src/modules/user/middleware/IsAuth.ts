import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../../../types/MyContext";

export const IsAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
    if (!context.req.session!.userId) {
        throw new Error("not authenticated");
    }
    return next();
};
