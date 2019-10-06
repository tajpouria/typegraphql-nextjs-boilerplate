import * as React from "react";
import * as Yup from "yup";
import Router from "next/router";

import { withApollo } from "../lib/apollo";
import Layout from "../components/Layout";
import { Form, Formik, Field } from "formik";
import { InputField } from "../components/fields/InputField";
import { useForgotPasswordMutation } from "../generated/graphql";

export default withApollo(() => {
    const [forgotPassword] = useForgotPasswordMutation();

    const handleSubmit = React.useCallback(
        async ({ email }, { setSubmitting }) => {
            setSubmitting(true);
            await forgotPassword({ variables: { email } });
            Router.replace("/check-email");
        },
        []
    );

    return (
        <Layout title="Forgot Password">
            <Formik
                initialValues={{
                    email: ""
                }}
                onSubmit={handleSubmit}
                validationSchema={Yup.object().shape({
                    email: Yup.string()
                        .email()
                        .required()
                })}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <Field
                            name="email"
                            type="email"
                            placeholder="email"
                            component={InputField}
                        ></Field>
                        <button disabled={isSubmitting} type="submit">
                            Submit
                        </button>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
});
