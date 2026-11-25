const InputText = ({
                       title,
                       name,
                       register,
                       error,
                       placeholder,
                       maxlength,
                       required,
                       setReadonly,
                       type,
                       value,
                       onChange
                   }) => {
    let setRequired = (required) ? {required: `Data ${title} Harus di Isi`} : {}
    let setMaxLength = (maxlength) ? {maxLength: {value: maxlength, message: `Maksimal ${maxlength} Karakter`}} : {}

    let validateList = {...setRequired, ...setMaxLength}

    const handleInput = (e) => {
        if (name === "username") {
            // Hanya huruf, angka, - dan _
            e.target.value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, "");
        } else if (name === "email") {
            // Hanya huruf, angka, titik, @, _ dan -
            e.target.value = e.target.value.replace(/[^a-zA-Z0-9@._-]/g, "");
        } else {
            // Default: huruf, angka, spasi, titik, koma, tanda hubung, kurung, slash, simbol umum medis
            e.target.value = e.target.value.replace(/[^a-zA-Z0-9 .,@/_()+%:-]/g, "");
        }
    };

    const registerProps = register ? register(name, validateList) : {};

    return (
        <>
            <div className={`form-group mb-10 ${(error?.[name]?.message) ? 'error' : ''}`}>
                <div
                    className="floating-label-content"
                    style={type === 'filter' ? { marginBottom: 0 } : undefined}
                >
                    <input
                        type="input"
                        readOnly={setReadonly}
                        {...registerProps}
                        {...(value !== undefined ? { value } : {})}
                        {...(onChange ? { onChange } : {})}
                        className="form-control borderInput floating-input"
                        onInput={handleInput}
                        name={name}
                        id={name}
                        maxLength={maxlength ? maxlength : 250}
                        placeholder={placeholder ? placeholder : `.`}
                    />
                    <label className="floating-label" htmlFor={name}>
                        {title} {(required) ? <span className={"fw-7 text-danger"}>*</span>:''}
                    </label>
                    {error?.[name] && <div className="error-form">{error[name]?.message}</div>}
                </div>

            </div>
        </>
    );
};

export default InputText;
