import * as React from "react";
import Link from "next/link";
import Head from "next/head";
import { useMeQuery } from "../generated/graphql";

type Props = {
    title?: string;
};

const Layout: React.FunctionComponent<Props> = ({
    children,
    title = "This is the default title"
}) => {
    const { data, loading } = useMeQuery({ fetchPolicy: "network-only" });

    return (
        <div>
            <Head>
                <title>{title}</title>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="initial-scale=1.0, width=device-width"
                />
            </Head>
            <header>
                <nav>
                    <div>
                        <Link href="/">
                            <a>Home</a>
                        </Link>
                    </div>
                    <div>
                        <Link href="/register">
                            <a>Register</a>
                        </Link>
                    </div>
                    <div>
                        <Link href="/login">
                            <a>Login</a>
                        </Link>
                    </div>
                    <div>
                        <Link href="/hello">
                            <a>Hello</a>
                        </Link>
                    </div>
                    <div>
                        <Link href="/forgotPassword">
                            <a>Forgot Password</a>
                        </Link>
                    </div>
                    {data && data.me && !loading && (
                        <div>
                            <Link href="/logout">
                                <a>Logout</a>
                            </Link>
                        </div>
                    )}
                </nav>
            </header>
            {children}
            <footer>
                <hr />
                <span>I'm here to stay (Footer)</span>
            </footer>
        </div>
    );
};

export default Layout;
