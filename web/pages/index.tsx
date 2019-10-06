import { withApollo } from "../lib/apollo";
import Layout from "../components/Layout";

const Index: React.FC = () => {
    return (
        <Layout title="Home">
            <div>HomePage</div>
        </Layout>
    );
};

export default withApollo(Index);
