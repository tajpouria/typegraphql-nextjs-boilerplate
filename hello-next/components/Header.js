import Link from "next/link";

const linkStyle = {
    marginRight: 15
};

const Header = props => {
    return (
        <>
            <Link href="/">
                <a style={linkStyle}>Home Page</a>
            </Link>
            <Link href="/about">
                <a style={linkStyle}>About Page</a>
            </Link>
        </>
    );
};

export default Header;
