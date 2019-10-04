import { useRouter } from "next/router";
import fetch from "isomorphic-unfetch";
import MyLayout from "../../components/MyLayout";

const Post = ({ show }) => {
    const router = useRouter();
    return (
        <MyLayout>
            <>
                <h1>{show.name}</h1>
                <p>{show.summary.replace(/<[/]?p>/g, "")}</p>
                <img src={show.image.medium} />
            </>
        </MyLayout>
    );
};

Post.getInitialProps = async context => {
    const res = await fetch(
        `https://cors-anywhere.herokuapp.com/https://api.tvmaze.com/shows/${context.query.id}`
    );
    const show = await res.json();

    console.log(`Fetched show: ${show.name}`);

    return { show };
};

export default Post;
