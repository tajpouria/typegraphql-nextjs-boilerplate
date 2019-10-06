import * as React from "react";
import Link from "next/link";
import Head from "next/head";

type Props = {
    title?: string;
};

const Layout: React.FunctionComponent<Props> = ({
    children,
    title = "This is the default title"
}) => (
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
                        <a>login</a>
                    </Link>
                </div>
                <div>
                    <Link href="/hello">
                        <a>Hello</a>
                    </Link>
                </div>
            </nav>
        </header>
        {children}
        <footer>
            <hr />
            <span>I'm here to stay (Footer)</span>
        </footer>
    </div>
);

export default Layout;
