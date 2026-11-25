const InputMoney = ({
    title,
    name,
    register,
    error,
    placeholder,
    maxlength,
    required,
    setReadonly,
    satuanInput,
    allowDecimal,
    type,
    value,
    onChange,
}) => {
    const setRequired = required ? { required: `Data ${title} Harus di Isi` } : {};
    const setMaxLength = maxlength
        ? { maxLength: { value: maxlength, message: `Maksimal ${maxlength} Karakter` } }
        : {};

    const validateList = { ...setRequired, ...setMaxLength };

    const handleInput = (e) => {
        const separator = '.';
        const a = e.target.value;
        const b = a.replace(/[^\d]/g, '');
        let c = '';
        const panjang = b.length;
        let j = 0;
        for (let i = panjang; i > 0; i--) {
            j = j + 1;
            if (j % 3 === 1 && j !== 1) {
                c = b.substr(i - 1, 1) + separator + c;
            } else {
                c = b.substr(i - 1, 1) + c;
            }
        }
        e.target.value = c;
    };

    const handleInputDecimal = (event) => {
        const inputField = event.target;
        let value = inputField.value;

        value = value.replace(/[^\d,]/g, '');

        const commaIndex = value.indexOf(',');
        if (commaIndex !== -1) {
            const beforeComma = value.slice(0, commaIndex);
            const afterComma = value.slice(commaIndex + 1).replace(/,/g, '');
            value = beforeComma + ',' + afterComma;
        }

        const parts = value.split(',');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        if (parts.length > 1) {
            parts[1] = parts[1].slice(0, 2);
        }

        value = parts.join(',');
        event.target.value = value;
    };

    const setStyle = satuanInput ? { textAlign: 'right', paddingRight: '40px' } : {};
    const registerProps = register ? register(name, validateList) : {};

    return (
        <div className={`form-group mb-10 ${error?.[name]?.message ? 'error' : ''}`}>
            <div
                className="floating-label-content"
                style={type === 'filter' ? { marginBottom: 0 } : undefined}
            >
                {satuanInput ? <div className="satuanInput">{satuanInput}</div> : ''}
                <input
                    type="input"
                    readOnly={setReadonly}
                    {...registerProps}
                    {...(value !== undefined ? { value } : {})}
                    {...(onChange ? { onChange } : {})}
                    className="form-control borderInput floating-input"
                    style={setStyle}
                    name={name}
                    id={name}
                    maxLength={maxlength ? maxlength : 250}
                    placeholder={placeholder ? placeholder : '.'}
                    onInput={allowDecimal ? handleInputDecimal : handleInput}
                />
                <label className="floating-label" htmlFor={name}>
                    {title} {required ? <span className="fw-7 text-danger">*</span> : ''}
                </label>
                {error?.[name] && <div className="error-form">{error[name]?.message}</div>}
            </div>
        </div>
    );
};

export default InputMoney;
