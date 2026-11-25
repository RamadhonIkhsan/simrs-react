import { useEffect } from 'react';
import { Select } from 'antd';

const InputSelect = ({
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
    setMultiple,
    type,
    val,
    loading,
    withSearch = true,
    getDataOnChange,
}) => {
    useEffect(() => {
        if (register && name) {
            register(name, required ? { required: `Data ${title} Harus di Isi` } : {});
        }
    }, [register, name, required, title]);

    const handleChange = (value) => {
        setValue(name, value, { shouldValidate: true });
        if (getDataOnChange) getDataOnChange(value, setValue);
    };

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    return (
        <>
            <div className={`form-group mb-10 ${error?.[name]?.message ? 'error' : ''}`}>
                <div
                    className="floating-label-content"
                    style={type === 'filter' ? { marginBottom: 0 } : undefined}
                >
                    <Select
                        disabled={setReadonly || setDisabled}
                        loading={loading}
                        mode={setMultiple ? 'multiple' : undefined}
                        id={name}
                        showSearch={withSearch}
                        value={val ?? undefined}
                        allowClear
                        onChange={handleChange}
                        filterOption={filterOption}
                        style={{ width: '100%' }}
                        placeholder={placeholder || 'Pilih Data'}
                        className={
                            setMultiple
                                ? 'form-control-multiple borderInput floating-input'
                                : 'form-control borderInput floating-input'
                        }
                        options={options}
                    />

                    <label className="floating-label" htmlFor={name}>
                        {title} {required ? <span className="fw-7 text-danger">*</span> : ''}
                    </label>
                    {error?.[name] && <div className="error-form">{error[name]?.message}</div>}
                </div>
            </div>
        </>
    );
};

export default InputSelect;
