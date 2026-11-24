import { useEffect } from 'react';
import { TimePicker } from 'antd';
import dayjs from 'dayjs';

const InputTime = ({
    title,
    name,
    register,
    error,
    placeholder,
    required,
    setReadonly,
    setValue,
    value,
}) => {
    const format = 'HH:mm';

    useEffect(() => {
        if (register && name) {
            register(name, required ? { required: `Data ${title} Harus di Isi` } : {});
        }
    }, [register, name, required, title]);

    const onChange = (time) => {
        if (time) {
            setValue(name, time.format('HH:mm') + ':00', { shouldValidate: true });
        } else {
            setValue(name, undefined, { shouldValidate: true });
        }
    };

    const parsedValue = value
        ? dayjs(String(value).length === 5 ? `${value}:00` : String(value), 'HH:mm:ss')
        : null;

    return (
        <div className={`form-group mb-10 ${error?.[name]?.message ? 'error' : ''}`}>
            <div className="floating-label-content">
                <TimePicker
                    disabled={setReadonly}
                    className="form-control borderInput floating-input"
                    placeholder={placeholder || 'Pilih Jam'}
                    format={format}
                    onChange={onChange}
                    value={parsedValue && parsedValue.isValid() ? parsedValue : null}
                />

                <label className="floating-label" htmlFor={name}>
                    {title} {required && <span className="fw-7 text-danger">*</span>}
                </label>

                {error?.[name] && <div className="error-form">{error[name]?.message}</div>}
            </div>
        </div>
    );
};

export default InputTime;
