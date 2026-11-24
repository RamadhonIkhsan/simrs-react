"use client"
import {useRef, useState} from "react";
import {EyeFilled, EyeInvisibleFilled} from '@ant-design/icons';

const InputPassword = ({
                           title,
                           name,
                           register,
                           error,
                           placeholder,
                           maxlength,
                           required,
                       }) => {


    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef(null);

    let setRequired = (required) ? {required: `${title} Harus di Isi`} : {}
    let setMaxLength = (maxlength) ? {maxLength: {value: maxlength, message: `Maksimal ${maxlength} Karakter`}} : {}
    let validateList = {...setRequired, ...setMaxLength}

    const handleInput = (e) => {
        e.target.value = e.target.value.replace(/[^a-zA-Z0-9_!@#$-%+=&]/g, "");
    };
    const togglePassword = () => {
        setShowPassword(prevState => !prevState);
    };


    return (
        <>
            <div className={`form-group mb-10 ${(error[name]) ? 'error' : ''}`}>
                <div className="floating-label-content">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        ref={inputRef}
                        {...register && {...register(name, validateList)}}
                        className="form-control borderInput floating-input sh-password"
                        name={name}
                        id={name}
                        maxLength={maxlength ? maxlength : 250}
                        placeholder={placeholder ? placeholder : ` `}
                        onInput={handleInput}
                    />
                    <div className="icon-password" onClick={togglePassword}>
                        <span className="input-group-text icon-eye">{showPassword ? <EyeFilled style={{fontSize: '20px'}}/> : <EyeInvisibleFilled style={{fontSize: '20px'}}/>}  </span>
                    </div>
                    <label className="floating-label" htmlFor={name}>
                        {title}
                    </label>
                    {error[name] && <div className="error-form">{error[name]?.message}</div>}
                </div>

            </div>
        </>
    );
};

export default InputPassword;
  