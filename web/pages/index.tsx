import { withApollo } from "../lib/apollo";
import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";

const USERS = gql`
    query {
        users {
            id
            firstName
            lastName
            fullName
            email
            password
            confirmed
        }
    }
`;

const Index: React.FC = () => {
    const { data } = useQuery(USERS);
    console.log(data);

    return <div>hello</div>;
};

export default withApollo(Index);
