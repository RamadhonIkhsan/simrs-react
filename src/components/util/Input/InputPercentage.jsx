import { Controller } from 'react-hook-form';
import { InputNumber } from 'antd';

const InputPercentage = ({
    title,
    name,
    register,
    error,
    placeholder,
    maxlength,
    required,
    setReadonly,
    val,
    control,
}) => {
    const setRequired = required ? { required: `Data ${title} Harus di Isi` } : {};
    const setMaxLength = maxlength
        ? {
              maxLength: {
                  value: maxlength,
                  message: `Maksimal ${maxlength} Karakter`,
              },
          }
        : {};

    const validateList = { ...setRequired, ...setMaxLength };

    return (
        <div className={`form-group mb-10 ${error[name]?.message ? 'error' : ''}`}>
            <div className="floating-label-content">
                <Controller
                    name={name}
                    control={control}
                    defaultValue={val}
                    render={({ field }) => (
                        <InputNumber
                            min={0}
                            max={100}
                            formatter={(value) => (value ? `${value}` : '')}
                            parser={(value) => String(value || '').replace('%', '')}
                            readOnly={setReadonly}
                            className="form-control borderInput floating-input"
                            name={name}
                            maxLength={maxlength ? maxlength : 250}
                            placeholder={placeholder ? placeholder : '.'}
                            onChange={(value) => field.onChange(value)}
                            {...register(name, validateList)}
                            {...field}
                        />
                    )}
                />

                <label className="floating-label" htmlFor={name}>
                    {title}
                </label>
                {error[name] && <div className="error-form">{error[name]?.message}</div>}
            </div>
        </div>
    );
};

export default InputPercentage;
