import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Col, Row } from 'antd';
import dayjs from 'dayjs';
import Input from '@/components/util/Input';
import ModalForm from '@/components/util/ModalForm';
import { Helper } from '@/lib/Helper';
import modalStore from '@/store/modal';
import LogData from './LogData';

const arrApproveReject = ['setujui', 'tolak'];

const Form = forwardRef(
    (
        {
            storeData,
            approveRejectData,
            setTitle,
            listForm = [],
            sizeModal,
            initCompanyBranch: hasCompanyBranch,
        },
        ref
    ) => {
        const { FormId, modalDetail, actionType } = modalStore();
        const preserveBranchOnCompanyChange = useRef(false);

        const {
            register,
            handleSubmit,
            reset,
            setValue,
            getValues,
            control,
            formState: { errors },
        } = useForm();

        const resetForm = () => {
            reset();
        };

        const filterTypeMoney = () => {
            if (!listForm) return [];
            return listForm.filter((val) => val.type === 'money').map((val) => val.name);
        };

        const filterTypeDate = () => {
            if (!listForm) return [];
            return listForm.filter((val) => val.type === 'date').map((val) => val.name);
        };

        const filterTypePercentage = () => {
            if (!listForm) return [];
            return listForm.filter((val) => val.type === 'percentage').map((val) => val.name);
        };

        const filterTypeText = () => {
            if (!listForm) return [];
            return listForm.filter((val) => val.type === 'text').map((val) => val.name);
        };

        const filterInputDisabled = () => {
            if (!listForm) return [];
            return listForm.filter((val) => val.onEdit === 'disabled').map((val) => val.name);
        };

        const setFormValue = async (name, value) => {
            const listMoney = filterTypeMoney();
            const currentField = listForm?.find((field) => field.name === name);
            if (listMoney && listMoney.includes(name)) {
                return setValue(name, Helper.numFormat(value));
            }

            if (name === 'companyId') {
                preserveBranchOnCompanyChange.current = true;
            }

            setValue(name, value);

            if (currentField?.type === 'select' && currentField?.getDataOnChange) {
                await currentField.getDataOnChange(value, setValue);
            }
        };

        const initCompanyBranch = (companyId, branchId) => {
            preserveBranchOnCompanyChange.current = true;
            reset({
                companyId,
                branchId,
            });
        };

        useImperativeHandle(ref, () => ({
            resetForm,
            setFormValue,
            initCompanyBranch,
        }));

        const onSubmit = (data) => {
            if (arrApproveReject.includes(actionType)) {
                return approveRejectData();
            }

            const listMoney = filterTypeMoney();
            const listDate = filterTypeDate();
            const listPercentage = filterTypePercentage();
            const listText = filterTypeText();
            const listDisabled = filterInputDisabled();

            for (const name in data) {
                if (FormId !== 'new' && listDisabled.includes(name)) {
                    delete data[name];
                    continue;
                }
                const fieldCfg = listForm?.find((f) => f.name === name);
                if (FormId !== 'new' && fieldCfg?.hideOnEdit) {
                    delete data[name];
                    continue;
                }
                if (listMoney.includes(name)) {
                    const cleanMoney = Helper.numFormatClear(data[name]);
                    data[name] = cleanMoney !== '' ? parseInt(cleanMoney, 10) : 0;
                }
                if (listDate.includes(name) && data[name]) {
                    data[name] = dayjs(data[name]).format('YYYY-MM-DD');
                }
                if (listPercentage.includes(name) && data[name] !== undefined) {
                    data[name] = parseFloat(String(data[name]).replace('%', ''));
                }
                if (listText.includes(name) && data[name] !== undefined && data[name] !== null) {
                    data[name] = String(data[name]);
                }
                if (FormId !== 'new' && (data[name] === '' || data[name] === undefined)) {
                    if (fieldCfg?.type === 'password') {
                        delete data[name];
                    }
                }
            }

            storeData(data);
        };

        const watchedValues = useWatch({ control });
        const companyId = watchedValues?.companyId;
        useEffect(() => {
            if (preserveBranchOnCompanyChange.current) {
                preserveBranchOnCompanyChange.current = false;
                return;
            }

            if (hasCompanyBranch) {
                setValue('branchId', null);
            }
        }, [companyId, hasCompanyBranch, setValue]);

        return (
            <ModalForm
                size={sizeModal ?? undefined}
                title={setTitle}
                subTitle={
                    FormId !== 'new'
                        ? actionType
                            ? `${Helper.UcFirstWord(actionType)} ${setTitle}`
                            : `Ubah ${setTitle}`
                        : `Tambah ${setTitle}`
                }
                action={
                    modalDetail ? (
                        ''
                    ) : (
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={handleSubmit(onSubmit)}
                        >
                            {arrApproveReject.includes(actionType)
                                ? Helper.UcFirstWord(actionType)
                                : 'Simpan'}
                        </button>
                    )
                }
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    {arrApproveReject.includes(actionType) ? (
                        <LogData />
                    ) : (
                        <Row gutter={16}>
                            {listForm &&
                                listForm.map((v) => {
                                    if (v.hideOnEdit && FormId !== 'new') {
                                        return null;
                                    }

                                    let setReadonly =
                                        FormId !== 'new'
                                            ? v.onEdit
                                                ? v.onEdit === 'readonly'
                                                : false
                                            : false;
                                    const setDisabled =
                                        FormId !== 'new'
                                            ? v.onEdit
                                                ? v.onEdit === 'disabled'
                                                : false
                                            : false;

                                    if (modalDetail || arrApproveReject.includes(actionType)) {
                                        setReadonly = true;
                                    }

                                    const setRequired =
                                        FormId !== 'new' && v.type === 'password'
                                            ? Boolean(v.requiredOnEdit)
                                            : v.required;

                                    if (v.type === 'text') {
                                        return (
                                            <Col span={v.col || 24} key={v.name}>
                                                <Input.Text
                                                    title={v.alias}
                                                    name={v.name}
                                                    minlength={v.minLength}
                                                    maxlength={v.maxLength}
                                                    setReadonly={setReadonly}
                                                    required={setRequired}
                                                    register={register}
                                                    error={errors}
                                                />
                                            </Col>
                                        );
                                    }

                                    if (v.type === 'email') {
                                        return (
                                            <Col span={v.col || 24} key={v.name}>
                                                <Input.Email
                                                    title={v.alias}
                                                    name={v.name}
                                                    maxlength={v.maxLength}
                                                    setReadonly={setReadonly}
                                                    required={setRequired}
                                                    register={register}
                                                    error={errors}
                                                />
                                            </Col>
                                        );
                                    }

                                    if (v.type === 'password') {
                                        return (
                                            <Col span={v.col || 24} key={v.name}>
                                                <Input.Password
                                                    title={v.alias}
                                                    name={v.name}
                                                    maxlength={v.maxLength}
                                                    setReadonly={setReadonly}
                                                    required={setRequired}
                                                    register={register}
                                                    error={errors}
                                                />
                                            </Col>
                                        );
                                    }

                                    if (v.type === 'hidden') {
                                        if (v?.name === 'companyId') setValue(v.name, v?.value);

                                        return (
                                            <Col span={v.col || 24} key={v.name}>
                                                <Input.Hidden
                                                    title={v.alias}
                                                    name={v.name}
                                                    minlength={v.minLength}
                                                    maxlength={v.maxLength}
                                                    setReadonly={setReadonly}
                                                    required={setRequired}
                                                    register={register}
                                                    error={errors}
                                                />
                                            </Col>
                                        );
                                    }

                                    if (v.type === 'number') {
                                        return (
                                            <Col span={v.col || 24} key={v.name}>
                                                <Input.Number
                                                    title={v.alias}
                                                    name={v.name}
                                                    maxlength={v.maxLength}
                                                    minNominal={v.minNominal}
                                                    maxNominal={v.maxNominal}
                                                    setReadonly={setReadonly}
                                                    required={setRequired}
                                                    register={register}
                                                    error={errors}
                                                />
                                            </Col>
                                        );
                                    }

                                    if (v.type === 'username') {
                                        return (
                                            <Col span={v.col || 24} key={v.name}>
                                                <Input.Username
                                                    title={v.alias}
                                                    name={v.name}
                                                    maxlength={v.maxLength}
                                                    minlength={v.minLength}
                                                    setReadonly={setReadonly}
                                                    required={setRequired}
                                                    register={register}
                                                    error={errors}
                                                />
                                            </Col>
                                        );
                                    }

                                    if (v.type === 'select') {
                                        return (
                                            <Col span={v.col || 24} key={v.name}>
                                                <Input.Select
                                                    title={v.alias}
                                                    name={v.name}
                                                    required={setRequired ?? true}
                                                    register={register}
                                                    error={errors}
                                                    setReadonly={setReadonly || v.readOnly}
                                                    setDisabled={setDisabled}
                                                    options={v.listData}
                                                    val={watchedValues?.[v.name] ?? getValues(v.name)}
                                                    placeholder={'Daftar ' + v.alias}
                                                    setValue={setValue}
                                                    getDataOnChange={
                                                        v.getDataOnChange ? v.getDataOnChange : null
                                                    }
                                                />
                                            </Col>
                                        );
                                    }

                                    if (v.type === 'money') {
                                        return (
                                            <Col span={v.col || 24} key={v.name}>
                                                <Input.Money
                                                    title={v.alias}
                                                    name={v.name}
                                                    maxlength={v.maxLength}
                                                    setReadonly={setReadonly}
                                                    required={setRequired}
                                                    register={register}
                                                    error={errors}
                                                />
                                            </Col>
                                        );
                                    }

                                    if (v.type === 'percentage') {
                                        return (
                                            <Col span={v.col || 24} key={v.name}>
                                                <Input.Percentage
                                                    title={v.alias}
                                                    name={v.name}
                                                    maxlength={v.maxLength}
                                                    setReadonly={setReadonly}
                                                    required={setRequired}
                                                    register={register}
                                                    error={errors}
                                                    setValue={setValue}
                                                    val={getValues(v.name)}
                                                    control={control}
                                                />
                                            </Col>
                                        );
                                    }

                                    if (v.type === 'textarea') {
                                        return (
                                            <Col span={v.col || 24} key={v.name}>
                                                <Input.Textarea
                                                    title={v.alias}
                                                    name={v.name}
                                                    maxlength={v.maxLength}
                                                    setReadonly={setReadonly}
                                                    required={setRequired}
                                                    register={register}
                                                    error={errors}
                                                />
                                            </Col>
                                        );
                                    }

                                    if (v.type === 'custom') {
                                        return (
                                            <Col span={v.col || 24} key={v.name}>
                                                <Input.Custom
                                                    title={v.alias}
                                                    name={v.name}
                                                    maxlength={v.maxLength}
                                                    setReadonly={setReadonly}
                                                    required={setRequired}
                                                    register={register}
                                                    error={errors}
                                                    {...v}
                                                />
                                            </Col>
                                        );
                                    }

                                    if (v.type === 'switch') {
                                        const rawVal = watchedValues?.[v.name] ?? getValues(v.name);
                                        return (
                                            <Col span={v.col || 24} key={v.name}>
                                                <Input.Switch
                                                    title={v.alias}
                                                    name={v.name}
                                                    setReadonly={setReadonly}
                                                    setValue={setValue}
                                                    value={rawVal == '1' || rawVal === true}
                                                />
                                            </Col>
                                        );
                                    }

                                    if (v.type === 'date') {
                                        return (
                                            <Col span={v.col || 24} key={v.name}>
                                                <Input.Date
                                                    title={v.alias}
                                                    name={v.name}
                                                    setValue={setValue}
                                                    setReadonly={setReadonly}
                                                    required={setRequired}
                                                    value={watchedValues?.[v.name] ?? getValues(v.name)}
                                                    register={register}
                                                    error={errors}
                                                />
                                            </Col>
                                        );
                                    }

                                    if (v.type === 'time') {
                                        return (
                                            <Col span={v.col || 24} key={v.name}>
                                                <Input.Time
                                                    title={v.alias}
                                                    name={v.name}
                                                    setValue={setValue}
                                                    setReadonly={setReadonly}
                                                    required={setRequired}
                                                    value={watchedValues?.[v.name] ?? getValues(v.name)}
                                                    register={register}
                                                    error={errors}
                                                />
                                            </Col>
                                        );
                                    }

                                    return null;
                                })}
                        </Row>
                    )}
                </form>
            </ModalForm>
        );
    }
);

Form.displayName = 'RefTemplateForm';

export default Form;
