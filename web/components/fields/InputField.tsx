import * as React from "react";
import { FieldProps } from "formik";

type InputProps = React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
>;

export const InputField: React.FC<FieldProps & InputProps> = ({
    field,
    form: { errors, touched },
    ...props
}) => {
    const errorMessage = touched[field.name] && errors[field.name];
    return (
        <>
            {errorMessage && <p>{errorMessage}</p>}
            <input {...field} {...props} />
            <style jsx>{`
                p {
                    color: red;
                }
            `}</style>
        </>
    );
};
