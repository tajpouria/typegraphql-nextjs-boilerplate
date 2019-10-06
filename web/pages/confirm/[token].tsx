import { NextPageContext } from "next";
import { useConfirmMutation } from "../../generated/graphql";
import redirect from "../../lib/redirect";
import { withApollo } from "../../lib/apollo";
import { useEffect } from "react";
import { MyContext } from "../../interfaces/MyContext";



const ConfirmTokenPage = (context: MyContext) => {
    const [confirmUser, { data }] = useConfirmMutation();
    useEffect(() => {
        if (context.token) {
            confirmUser({
                variables: { token: context.token as string }
            })
                .then(() => redirect(context, "/login"))
                .then(() => console.log(data));
        }
    }, []);

    return <div>Loading...</div>;
};

ConfirmTokenPage.getInitialProps = (context: NextPageContext) => {
    const query = context.query;
    if (!query.token) {
        return {};
    }

    return { token: query.token };
};

export default withApollo(ConfirmTokenPage);
