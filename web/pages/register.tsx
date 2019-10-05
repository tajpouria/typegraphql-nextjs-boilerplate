import * as React from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Layout from "../components/Layout";
import { useRegisterMutation } from "../generated/graphql";
import { withApollo } from "../lib/apollo";
import { InputField } from "../components/fields/InputField";

const RegisterPage: React.FC = () => {
    const [register] = useRegisterMutation();

    const handleSubmit = React.useCallback(
        async (values, { setErrors, setSubmitting }) => {
            setSubmitting(true);
            try {
                await register({ variables: { input: values } });
                setSubmitting(false);
            } catch (err) {
                const errors: { [key: string]: string } = {};
                err.graphQLErrors[0].extensions.exception.validationErrors.forEach(
                    ({
                        property,
                        constraints
                    }: {
                        property: string;
                        constraints: { [key: string]: string };
                    }) => {
                        errors[property] = Object.values(constraints)[0];
                    }
                );

                setErrors(errors);
                setSubmitting(false);
            }
        },
        []
    );

    return (
        <Formik
            initialValues={{
                firstName: "",
                lastName: "",
                email: "",
                password: ""
            }}
            onSubmit={handleSubmit}
            validationSchema={Yup.object().shape({
                firstName: Yup.string()
                    .min(3)
                    .max(50)
                    .required(),
                lastName: Yup.string()
                    .min(3)
                    .max(50)
                    .required(),
                email: Yup.string()
                    .email()
                    .required(),
                password: Yup.string()
                    .min(3)
                    .required()
            })}
        >
            {({ isSubmitting }) => (
                <Layout title="Register">
                    <Form>
                        <div>
                            <Field
                                name="firstName"
                                placeholder="firstName"
                                component={InputField}
                            />
                        </div>
                        <div>
                            <Field
                                name="lastName"
                                placeholder="lastName"
                                component={InputField}
                            />
                        </div>
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
                        <button disabled={isSubmitting} type="submit">
                            Submit
                        </button>
                    </Form>
                </Layout>
            )}
        </Formik>
    );
};

export default withApollo(RegisterPage);
