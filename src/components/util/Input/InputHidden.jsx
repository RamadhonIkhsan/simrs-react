const InputHidden = ({
    title,
    name,
    register,
    error,
    placeholder,
    maxlength,
    required,
    setReadonly
}) => {
    let setRequired = (required) ? { required: `Data ${title} Harus di Isi` } : {}
    let setMaxLength = (maxlength) ? { maxLength: { value: maxlength, message: `Maksimal ${maxlength} Karakter` } } : {}

    let validateList = { ...setRequired, ...setMaxLength }

    return (
        <>
            <div className={`form-group mb-10 ${(error[name]?.message) ? 'error' : ''}`}>
                <div className="floating-label-content">
                    <input
                        type="hidden"
                        readOnly={setReadonly}
                        {...register(name, validateList)}
                        className="form-control borderInput floating-input"
                        name={name}
                        maxLength={maxlength ? maxlength : 250}
                        placeholder={placeholder ? placeholder : `.`}
                    />
                    {error[name] && <div className="error-form">{error[name]?.message}</div>}
                </div>

            </div>
        </>
    );
};

export default InputHidden;
