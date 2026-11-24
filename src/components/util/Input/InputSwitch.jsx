import { Switch } from 'antd';

const InputSwitch = ({ title, name, register, setValue, setReadonly, value }) => {
    const onChange = (nextChecked) => {
        setValue(name, Boolean(nextChecked), { shouldValidate: true, shouldDirty: true });
    };

    if (setReadonly) {
        return (
            <div className="form-group mb-10">
                <div className="floating-label-content">
                    <input
                        type="input"
                        readOnly
                        className="form-control borderInput floating-input"
                        name={name}
                        id={name}
                        value={value ? 'Ya' : 'Tidak'}
                    />
                    <label className="floating-label" htmlFor={name}>
                        {title}
                    </label>
                </div>
            </div>
        );
    }

    return (
        <div className="form-group mb-10">
            <div className="floating-label-content">
                <p
                    style={{
                        fontSize: '12px',
                        color: '#757575',
                        position: 'absolute',
                        top: '-10px',
                    }}
                >
                    {title}
                </p>

                <Switch
                    {...register}
                    name={name}
                    onChange={onChange}
                    style={{ marginTop: '1rem' }}
                    checked={Boolean(value)}
                />
            </div>
        </div>
    );
};

export default InputSwitch;
