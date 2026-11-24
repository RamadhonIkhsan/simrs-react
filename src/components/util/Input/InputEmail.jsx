const InputEmail = ({
                        title,
                        name,
                        register,
                        error,
                        placeholder,
                        maxlength,
                        required,
                        setReadonly
                    }) => {
    let setRequired = (required) ? {required: "Data must be filled in"} : {}
    let setMaxLength = (maxlength) ? {maxLength: {value: maxlength, message: `Maksimal ${maxlength} Karakter`}} : {}
    let setEmail = {
        pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Format E-Mail Salah',
        }
    }

    let validateList = {...setRequired, ...setMaxLength, ...setEmail}

    const handleInput = (e) => {
        e.target.value = e.target.value.replace(/[^a-zA-Z0-9_!@#$-%+.=&]/g, "");
    };
    return (
        <>
            <div className={`form-group mb-10 ${(error[name]?.message) ? 'error' : ''}`}>
                <div className="floating-label-content">
                    <input
                        type="input"
                        readOnly={setReadonly}
                        {...register(name, validateList)}
                        className="form-control borderInput floating-input"
                        name={name}
                        id={name}
                        maxLength={maxlength ? maxlength : 250}
                        placeholder={placeholder ? placeholder : `.`}
                        onInput={handleInput}
                    />
                    <label className="floating-label" htmlFor={name}>
                        {title} {(required) ? <span className={"fw-7 text-danger"}>*</span>:''}
                    </label>
                    {error[name] && <div className="error-form">{error[name]?.message}</div>}
                </div>

            </div>
        </>
    );
};

export default InputEmail;
  