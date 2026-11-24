import { useEffect } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { Helper } from '@/lib/Helper';

const InputDate = ({
    title,
    name,
    register,
    error,
    placeholder,
    maxlength,
    required,
    setValue,
    value,
    minDate,
    setReadonly,
    maxDate,
    disablePastOnly = false,
    customDisabledDate,
    style = 'normal',
    picker = 'default',
    format = picker === 'month' ? 'MMM YYYY' : picker === 'year' ? 'YYYY' : 'DD MMM YYYY',
}) => {
    useEffect(() => {
        if (register && name) {
            const setRequired = required ? { required: `Data ${title} Harus di Isi` } : {};
            const setMaxLength = maxlength
                ? {
                      maxLength: {
                          value: maxlength,
                          message: `Maksimal ${maxlength} Karakter`,
                      },
                  }
                : {};
            register(name, { ...setRequired, ...setMaxLength });
        }
    }, [register, name, required, maxlength, title]);

    const onChange = (_, dateString) => {
        if (dateString) {
            setValue(name, dayjs(dateString, format), { shouldValidate: true });
        } else {
            setValue(name, undefined, { shouldValidate: true });
        }
    };

    const disabledDate = (current) => {
        if (customDisabledDate) {
            return customDisabledDate(current);
        }

        if (disablePastOnly) {
            return current && current >= dayjs().startOf('day');
        }

        return false;
    };

    const newFormat = Helper.setFormatInputDate(picker, format);

    return (
        <div
            className={`form-group ${style === 'header' ? 'mb-0' : 'mb-10'} ${
                error?.[name]?.message ? 'error' : ''
            }`}
        >
            <div className={`floating-label-content ${style === 'header' ? 'mb-0' : ''}`}>
                <DatePicker
                    name={name}
                    id={name}
                    format={newFormat}
                    inputReadOnly={setReadonly}
                    disabled={setReadonly}
                    onChange={onChange}
                    minDate={minDate ? dayjs(minDate, 'YYYY-MM-DD') : null}
                    maxDate={maxDate ? dayjs(maxDate, 'YYYY-MM-DD') : null}
                    value={value ? dayjs(value, 'YYYY-MM-DD') : null}
                    placeholder={placeholder || 'Pilih Tanggal'}
                    disabledDate={disabledDate}
                    picker={picker === 'default' ? undefined : picker}
                    className="form-control borderInput floating-input"
                />
                <label className="floating-label" htmlFor={name}>
                    {title} {required ? <span className="fw-7 text-danger">*</span> : ''}
                </label>
                {error?.[name] && <div className="error-form">{error[name]?.message}</div>}
            </div>
        </div>
    );
};

export default InputDate;
