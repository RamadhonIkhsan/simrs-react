const InputNumber = ({
                         title,
                         name,
                         register,
                         error,
                         placeholder,
                         maxlength,
                         minlength,
                         required,
                         setReadonly,
                         satuanInput,
                         maxNominal,
                         minNominal
                     }) => {

    let setRequired = (required) ? {required: `Data ${title} Harus di Isi`} : {}
    let setMaxLength = (maxlength) ? {maxLength: {value: maxlength, message: `Maksimal ${maxlength} Karakter`}} : {}
    let setMinLength = (minlength) ? {minLength: {value: minlength, message: `Minimal ${minlength} Karakter`}} : {}
    let setMaxNominal = (maxNominal) ? {max: {value: maxNominal, message: `Maksimal ${maxNominal} ${satuanInput ?? ''}`}} : {}
    let setMinNominal = (minNominal) ? {min: {value: minNominal, message: `Minimal ${minNominal} ${satuanInput ?? ''}`}} : {}

    let validateList = {...setRequired, ...setMaxLength, ...setMinLength, ...setMaxNominal,...setMinNominal}

    const handleInput = (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    };
    return (
        <>
            <div className={`form-group mb-10 ${(error[name]?.message) ? 'error' : ''}`}>
                <div className="floating-label-content">
                    {(satuanInput) ? <div className={"satuanInput"}>{satuanInput}</div>:''}
                    <input
                        type="input"
                        readOnly={setReadonly}
                        {...register(name, validateList)}
                        className="form-control borderInput floating-input"
                        name={name}
                        id={name}
                        maxLength={maxlength ? maxlength : 250}
                        minLength={minlength ? minlength : 0}
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

export default InputNumber;
  