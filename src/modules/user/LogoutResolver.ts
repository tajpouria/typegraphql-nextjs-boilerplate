import { Resolver, Mutation, Ctx } from "type-graphql";
import { MyContext } from "../../types/MyContext";

@Resolver()
export class LogoutResolver {
    @Mutation(() => Boolean)
    async logout(@Ctx() ctx: MyContext): Promise<boolean> {
        return new Promise((resolve, reject) => {
            ctx.req.session!.destroy(err => {
                if (err) {
                    console.error(err);
                    reject(false);
                }

                ctx.res.clearCookie("qid");
                resolve(true);
            });
        });
    }
}
