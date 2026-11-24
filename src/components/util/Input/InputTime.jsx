import { TimePicker } from "antd";
import dayjs from "dayjs";

const InputTime = ({
    title,
    name,
    error,
    placeholder,
    required,
    setReadonly,
    setValue,
    value
}) => {
    const format = "HH:mm";

    const onChange = (time) => {
        if (time) {
            setValue(name, time.format("HH:mm") + ':00', { shouldValidate: true });
        } else {
            setValue(name, undefined, { shouldValidate: true });
        }
    };

    return (
        <div className={`form-group mb-10 ${error[name]?.message ? "error" : ""}`}>
            <div className="floating-label-content">
                <TimePicker
                    disabled={setReadonly}
                    className="form-control borderInput floating-input"
                    placeholder={placeholder || "Select Time"}
                    format={format}
                    onChange={onChange}
                    value={value ? dayjs(value, "HH:mm:ss") : null}
                />

                <label className="floating-label" htmlFor={name}>
                    {title}
                    {required && (
                        <span className="fw-7 text-danger">*</span>
                    )}
                </label>

                {error[name] && (
                    <div className="error-form">
                        {error[name]?.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InputTime;
