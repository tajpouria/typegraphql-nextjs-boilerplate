import { useRouter } from "next/router";
import MyLayout from "../components/MyLayout";

const Post = () => {
    const router = useRouter();
    console.log(router);
    return (
        <MyLayout>
            <h1>{router.query.id}</h1>
            <p>This is the blog post content.</p>
        </MyLayout>
    );
};

export default Post;
