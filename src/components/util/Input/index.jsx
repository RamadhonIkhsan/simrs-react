import InputAutoComplete from './InputAutoComplete';
import InputCustom from './InputCustom';
import InputDate from './InputDate';
import InputEmail from './InputEmail';
import InputHidden from './InputHidden';
import InputMoney from './InputMoney';
import InputNumber from './InputNumber';
import InputPassword from './InputPassword';
import InputPercentage from './InputPercentage';
import InputSelect from './InputSelect';
import InputSwitch from './InputSwitch';
import InputText from './InputText';
import InputTextarea from './InputTextarea';
import InputTime from './InputTime';
import InputUsername from './InputUsername';

const Input = {
    Text: InputText,
    Number: InputNumber,
    Money: InputMoney,
    Select: InputSelect,
    Username: InputUsername,
    Email: InputEmail,
    Password: InputPassword,
    Textarea: InputTextarea,
    Date: InputDate,
    Custom: InputCustom,
    Percentage: InputPercentage,
    Switch: InputSwitch,
    AutoComplete: InputAutoComplete,
    Time: InputTime,
    Hidden: InputHidden,
};

export default Input;
