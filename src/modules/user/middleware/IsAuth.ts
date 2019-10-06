import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../../../types/MyContext";

export const IsAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
    if (!context.req.session!.userId) {
        console.log(context.req.session);
        throw new Error("not authenticated");
    }
    return next();
};
