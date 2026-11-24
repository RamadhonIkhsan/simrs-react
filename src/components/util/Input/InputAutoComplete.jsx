import { AutoComplete } from 'antd';

const InputAutoComplete = ({
    title,
    name,
    register,
    error,
    placeholder,
    required,
    options,
    setValue,
    setReadonly,
    setDisabled,
    val,
    onSearch,
    getDataOnChange,
    notFoundContent = false
}) => {
    
    let setRequired = (required) ? { required: `Data ${title} Harus di Isi` } : {}
    let validateList = { ...setRequired };

    const onChange = (value) => {
        let arrFilter = options?.find(item => item.value === value);
        setValue(name, arrFilter || value, { shouldValidate: true });
        if (getDataOnChange) getDataOnChange(arrFilter || value, setValue);
    };
        
    return (
        <>
            <div className={`form-group mb-10 ${error[name]?.message ? "error" : ""}`}>
                <div className="floating-label-content">
                    <AutoComplete
                        disabled={setReadonly || setDisabled}
                        {...register(name, validateList)}
                        name={name}
                        id={name}
                        value={val?.label}
                        allowClear
                        onChange={onChange}
                        // filterOption={filterOption}
                        options={options}
                        style={{ width: '100%' }}
                        placeholder={placeholder}
                        className="form-control borderInput floating-input"
                        popupClassName="certain-category-search"
                        onSearch={onSearch}
                        notFoundContent={notFoundContent}
                    />
                    <label className="floating-label" htmlFor={name}>
                        {title} {(required) ? <span className={"fw-7 text-danger"}>*</span> : ''}
                    </label>
                    {error[name] && <div className="error-form">{error[name]?.message}</div>}
                </div>
            </div>
        </>
    );
};

export default InputAutoComplete;
