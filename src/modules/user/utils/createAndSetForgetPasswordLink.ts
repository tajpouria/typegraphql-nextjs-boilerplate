import { v4 } from "uuid";

import { redis } from "../../../redis";
import { UserConfirmationPrefixes } from "../shared/userConfirmationPrefixes";

export const createAndSetForgetPasswordLink = async (userId: number) => {
    const token = v4();
    await redis.set(
        UserConfirmationPrefixes.forgotPassword + token,
        userId,
        "ex",
        60 * 60 * 24 // 1 day
    );

    return `change-password/${token}`;
};
