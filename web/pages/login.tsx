import * as React from "react";
import { withApollo } from "../lib/apollo";
import Router from "next/router";
import { Field, Formik, Form } from "formik";
import * as Yup from "yup";

import { InputField } from "../components/fields/InputField";
import { useLoginMutation, MeDocument, MeQuery } from "../generated/graphql";
import Layout from "../components/Layout";

const LoginPage: React.FC = () => {
    const [login] = useLoginMutation();

    const handleSubmit = React.useCallback(
        async ({ email, password }, { setSubmitting, setErrors }) => {
            setSubmitting(true);

            const response = await login({
                variables: { email, password },
                update: (store, { data }) => {
                    if (!data || data.login) return null;

                    store.writeQuery<MeQuery>({
                        query: MeDocument,
                        data: { __typename: "Query", me: data.login }
                    });
                }
            });

            setSubmitting(false);

            if (!response.data || !response.data.login) {
                return setErrors({ email: "Invalid email or password." });
            }

            Router.push("/hello");
        },
        []
    );

    return (
        <Layout title="Login">
            <Formik
                initialValues={{
                    email: "",
                    password: ""
                }}
                onSubmit={handleSubmit}
                validationSchema={Yup.object().shape({
                    email: Yup.string()
                        .email()
                        .required(),
                    password: Yup.string().min(3)
                })}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <div>
                            <Field
                                name="email"
                                type="email"
                                placeholder="email"
                                component={InputField}
                            />
                        </div>
                        <div>
                            <Field
                                name="password"
                                type="password"
                                placeholder="password"
                                component={InputField}
                            />
                        </div>
                        <button type="submit" disabled={isSubmitting}>
                            Login
                        </button>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
};

export default withApollo(LoginPage);
