const InputTextarea = ({
    title,
    name,
    register,
    error,
    maxlength,
    required,
    setReadonly,
    className = '',
    ...props
}) => {
    const setRequired = required ? { required: ` ${title} Harus di Isi` } : {};
    const setMaxLength = maxlength
        ? { maxLength: { value: maxlength, message: `Maksimal ${maxlength} Karakter` } }
        : {};

    const validateList = { ...setRequired, ...setMaxLength };

    return (
        <div className={`form-group mb-10 ${error[name]?.message ? 'error' : ''}`}>
            <div className="floating-label-content">
                <textarea
                    readOnly={setReadonly}
                    style={{ width: '100%' }}
                    {...props}
                    className={`form-control borderInput floating-input ${className}`}
                    {...register(name, validateList)}
                    name={name}
                    id={name}
                    maxLength={maxlength ? maxlength : 250}
                    placeholder="."
                    cols="30"
                    rows="10"
                />
                <label className="floating-label" htmlFor={name}>
                    {title} {required ? <span className="fw-7 text-danger">*</span> : ''}
                </label>
                {error[name] && <div className="error-form">{error[name]?.message}</div>}
            </div>
        </div>
    );
};

export default InputTextarea;
