import * as React from "react";
import { useProtectedHelloQuery } from "../generated/graphql";
import { withApollo } from "../lib/apollo";
import Layout from "../components/Layout";

export default withApollo(() => {
    const { data } = useProtectedHelloQuery({
        fetchPolicy: "network-only"
    });
    return (
        <Layout title="Protected Hello">
            <div>{data && data.hello ? data.hello : "Loading..."}</div>
        </Layout>
    );
});
