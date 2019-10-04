import MyLayout from "../components/MyLayout";
import Link from "next/link";
import fetch from "isomorphic-unfetch";
import Markdown from "react-markdown";

const PostLink = props => {
    return (
        <Link href="/p/[id]" as={`/p/${props.id}`}>
            <>
                <a>{props.children}</a>
                <style jsx>
                    {`
                        a {
                            text-decoration: none;
                            color: blue;
                        }

                        a:hover {
                            opacity: 0.6;
                            cursor: pointer;
                        }
                    `}
                </style>
            </>
        </Link>
    );
};

const Index = ({ shows }) => {
    return (
        <MyLayout>
            <div className="markdown">
                <Markdown source="## Batman TV Show" />
            </div>
            <ul>
                {shows.length &&
                    shows.map(s => (
                        <li key={s.id}>
                            <PostLink id={s.id}>{s.name}</PostLink>
                        </li>
                    ))}
            </ul>
            <style jsx>{`
                h1,
                a {
                    font-family: "Arial";
                }

                ul {
                    padding: 0;
                }

                li {
                    list-style: none;
                    margin: 5px 0;
                }

                .markdown {
                    font-family: "Arial";
                }

                .markdown h2 {
                    margin: 0;
                    text-transform: uppercase;
                }
            `}</style>
        </MyLayout>
    );
};

Index.getInitialProps = async function() {
    const res = await fetch("https://api.tvmaze.com/search/shows?q=batman");
    const data = await res.json();

    return {
        shows: data.map(entry => entry.show)
    };
};

export default Index;
