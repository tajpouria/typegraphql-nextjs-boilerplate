import { Form, withFormik, Field } from "formik";
import { object, string } from "yup";

const FormikIntro = ({ values, touched, errors, isSubmitting }) => {
    return (
        <Form>
            {touched.email && errors.email && <p>{errors.email}</p>}
            <Field name="email" type="email" placeholder="email" />
            {touched.password && errors.password && <p>{errors.password}</p>}
            <Field name="password" type="password" placeholder="placeholder=" />
            <label htmlFor="checkBox">
                <Field name="rules" type="checkBox" checked={values.rules} />I
                agree all rules.
            </label>
            <Field name="plan" component="select">
                <option value="free">Free</option>
                <option value="premium">Premium</option>
            </Field>
            <button disabled={isSubmitting} type="submit">
                Submit
            </button>
        </Form>
    );
};

export default withFormik({
    mapPropsToValues() {
        return { email: "", password: "", rules: true, plan: "free" };
    },
    handleSubmit(values, { setError, resetForm, setSubmitting }) {
        console.table(values);
        setTimeout(() => {
            if (email === "givenEmail@gmail.com") {
                setError({ email: "Email is already given" });
            }
            resetForm();
            setSubmitting(false);
        }, 2000);
    },
    validationSchema: object().shape({
        email: string()
            .email("Email not valid")
            .required("Email is required"),
        password: string()
            .min(9, "Password must be 9 character or longer")
            .required("Password is required")
    })
})(FormikIntro);
