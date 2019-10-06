import * as React from "react";
import * as Yup from "yup";

import Layout from "../../components/Layout";
import { withApollo } from "../../lib/apollo";
import { Formik, Form, Field } from "formik";
import { InputField } from "../../components/fields/InputField";
import { NextPageContext } from "next";
import Router from "next/router";

import { MyContext } from "../../interfaces/MyContext";
import { useChangePasswordMutation } from "../../generated/graphql";

const ChangePasswordPage = (context: MyContext) => {
    const [changePassword] = useChangePasswordMutation();

    const handleSubmit = React.useCallback(
        async ({ password }, { setSubmitting }) => {
            setSubmitting(true);

            const { token } = context;
            if (token) {
                const response = await changePassword({
                    variables: { token, password }
                });
                if (response.data && response.data.changePassword) {
                    Router.replace("/login");
                }
            }

            setSubmitting(false);
        },
        []
    );

    return (
        <Layout title="Change Password">
            <Formik
                initialValues={{
                    password: ""
                }}
                onSubmit={handleSubmit}
                validationSchema={Yup.object().shape({
                    password: Yup.string()
                        .min(3)
                        .required()
                })}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <Field
                            name="password"
                            type="password"
                            placeholder="new password"
                            component={InputField}
                        />
                        <button disabled={isSubmitting} type="submit">
                            Submit
                        </button>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
};

ChangePasswordPage.getInitialProps = (context: NextPageContext) => {
    const { query } = context;
    if (!query.token) {
        return {};
    }

    return { token: query.token };
};

export default withApollo(ChangePasswordPage);
