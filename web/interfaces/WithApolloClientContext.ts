import { NextPageContext } from "next";
import { ApolloClient } from "apollo-client";
import { NormalizedCacheObject } from "apollo-cache-inmemory";

export interface WithApolloClientContext extends NextPageContext {
    apolloClient: ApolloClient<NormalizedCacheObject>;
}
