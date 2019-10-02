import { Resolver, Mutation, Arg } from "type-graphql";
import { EmailInput } from "./forgotPassword/EmailInput";
import { User } from "../../entity/User";
import { createAndSetForgetPasswordLink } from "./utils/createAndSetForgetPasswordLink";
import { sendEmail } from "./utils/sendEmail";

@Resolver()
export class ForgotPasswordResolver {
    @Mutation(() => Boolean)
    async forgotPassword(@Arg("input") { email }: EmailInput): Promise<
        boolean
    > {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return true;
        }

        const token = await createAndSetForgetPasswordLink(user.id);
        await sendEmail(user.email, token);

        return true;
    }
}
