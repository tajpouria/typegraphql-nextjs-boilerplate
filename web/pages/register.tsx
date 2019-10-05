import * as React from "react";
import { Formik, Form, Field } from "formik";
import Layout from "../components/Layout";
import { useRegisterMutation } from "../generated/graphql";
import { withApollo } from "../lib/apollo";

const RegisterPage: React.FC = () => {
    const [register] = useRegisterMutation();
    const handleSubmit = React.useCallback(async values => {
        const response = await register({ variables: { input: values } });
        console.log(response);
    }, []);

    return (
        <Formik
            initialValues={{
                firstName: "",
                lastName: "",
                email: "",
                password: ""
            }}
            onSubmit={handleSubmit}
        >
            {() => (
                <Layout title="Register">
                    <Form>
                        <div>
                            <Field name="firstName" placeholder="firstName" />
                        </div>
                        <div>
                            <Field name="lastName" placeholder="lastName" />
                        </div>
                        <div>
                            <Field
                                name="email"
                                type="email"
                                placeholder="email"
                            />
                        </div>
                        <div>
                            <Field
                                name="password"
                                type="password"
                                placeholder="password"
                            />
                        </div>
                        <button type="submit">Submit</button>
                    </Form>
                </Layout>
            )}
        </Formik>
    );
};

export default withApollo(RegisterPage);
