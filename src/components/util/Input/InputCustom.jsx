const InputCustom = ({
    title,
    name,
    register,
    error,
    placeholder,
    maxlength,
    required,
    setReadonly,
    ...props
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
                <input
                    type="input"
                    readOnly={setReadonly}
                    {...register(name, validateList)}
                    className="form-control borderInput floating-input"
                    name={name}
                    maxLength={maxlength ? maxlength : 250}
                    placeholder={placeholder ? placeholder : '.'}
                    {...props}
                />
                <label className="floating-label" htmlFor={name}>
                    {title}
                </label>
                {error[name] && <div className="error-form">{error[name]?.message}</div>}
            </div>
        </div>
    );
};

export default InputCustom;
