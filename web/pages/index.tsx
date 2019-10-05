import { withApollo } from "../lib/apollo";
import { useUsersQuery } from "../generated/graphql";

const Index: React.FC = () => {
    const { data } = useUsersQuery();
    console.log(data);

    return <div>hello</div>;
};

export default withApollo(Index);
