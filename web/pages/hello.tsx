import * as React from "react";
import { useProtectedHelloQuery } from "../generated/graphql";
import { withApollo } from "../lib/apollo";

export default withApollo(() => {
    const { data } = useProtectedHelloQuery({
        fetchPolicy: "network-only"
    });
    return <div>{data && data.hello ? data.hello : "Loading..."}</div>;
});
