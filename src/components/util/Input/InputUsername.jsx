const InputUsername = ({
    title,
    name,
    register,
    error,
    placeholder,
    maxlength,
    minlength,
    required,
    setReadonly,
}) => {
    const setRequired = required ? { required: `${title} Harus di Isi` } : {};
    const setMaxLength = maxlength
        ? { maxLength: { value: maxlength, message: `Maksimal ${maxlength} Karakter` } }
        : {};
    const setMinLength = minlength
        ? { minLength: { value: minlength, message: `Minimal ${minlength} Karakter` } }
        : {};

    const validateList = { ...setRequired, ...setMaxLength, ...setMinLength };

    const handleInput = (e) => {
        e.target.value = e.target.value.replace(/[^a-zA-Z0-9_!@#$-%+=&]/g, '');
    };

    return (
        <div className={`form-group mb-10 ${error[name]?.message ? 'error' : ''}`}>
            <div className="floating-label-content">
                <input
                    type="input"
                    readOnly={setReadonly}
                    {...register(name, validateList)}
                    className="form-control borderInput floating-input"
                    name={name}
                    id={name}
                    maxLength={maxlength ? maxlength : 250}
                    minLength={minlength ? minlength : 0}
                    placeholder={placeholder ? placeholder : ' '}
                    onInput={handleInput}
                />
                <label className="floating-label" htmlFor={name}>
                    {title}
                </label>
                {error[name] && <div className="error-form">{error[name]?.message}</div>}
            </div>
        </div>
    );
};

export default InputUsername;
