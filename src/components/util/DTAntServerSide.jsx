import React, { useCallback, useEffect, useState } from 'react';
import { Table } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { API } from '@/lib/API';
import { Helper } from '@/lib/Helper';
import notifStore from '@/store/notifStore';
import selectedTableStore from '@/store/selectedTableStore';

function DTAntServerSide({
    columnTable,
    size,
    endPoint,
    searchText,
    triger,
    filter,
    noLoadingTable,
    isSelected,
    customRowSelection,
    keyTable,
}) {
    const { notifOpen } = notifStore();
    const { setDataSelect, setDataRowSelected } = selectedTableStore();

    const [Data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [tableParams, setTableParams] = useState({
        pagination: {
            current: 1,
            pageSize: 10,
            pageSizeOptions: ['5', '10', '20', '30', '50'],
        },
    });

    const getData = useCallback(
        async (page, search, currentSize) => {
            if (!noLoadingTable) {
                setLoading(true);
            }

            const setSize = currentSize ? currentSize : pageSize;
            const setSearch = search ? `&search=${encodeURIComponent(search)}` : '';
            const cleanFilter = filter
                ? Object.fromEntries(
                      Object.entries(filter).filter(
                          ([, v]) => v !== undefined && v !== null && v !== ''
                      )
                  )
                : {};
            const setFilter =
                Object.keys(cleanFilter).length > 0
                    ? '&' + new URLSearchParams(cleanFilter).toString()
                    : '';

            const paramUser = endPoint === '/ref/user' ? '&webmin=true' : '';

            const response = await API.GET(
                `${endPoint}?page=${page - 1}&size=${setSize}${setSearch}${paramUser}${setFilter}`
            );
            if (response?.status !== 200) {
                setLoading(false);
                notifOpen(
                    'Gagal',
                    response?.result?.rm ||
                        response?.result?.message ||
                        'Terjadi Kesalahan pada Server',
                    'danger'
                );
                return;
            }

            setData(response.result || {});
            setLoading(false);
        },
        [endPoint, filter, noLoadingTable, notifOpen, pageSize]
    );

    const onSelectChange = (selectedRow) => {
        setSelectedRowKeys(selectedRow);
        setDataSelect(selectedRow);
    };

    const handleTableChange = (pagination, filters, sorter) => {
        setTableParams({
            pagination,
            filters,
            ...sorter,
        });

        setPageSize(pagination.pageSize);
        void getData(pagination.current, searchText, pagination.pageSize);
    };

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (!active) return;
            setTableParams((prev) => ({
                ...prev,
                pagination: {
                    ...prev.pagination,
                    current: 1,
                },
            }));
            void getData(1, searchText);
        });
        return () => {
            active = false;
        };
    }, [triger, searchText]); // eslint-disable-line react-hooks/exhaustive-deps

    const totalCount =
        Data?.totalElements ??
        Data?.pagination?.total ??
        Data?.meta?.total ??
        (Array.isArray(Data?.data) ? Data.data.length : 0);

    const enhancedColumns = (columnTable || []).map((col) => {
        if (col.key === 'no') {
            return {
                ...col,
                render: (_, __, index) => {
                    const { current = 1, pageSize: currentPageSize = 10 } =
                        tableParams?.pagination || {};
                    return (current - 1) * currentPageSize + index + 1;
                },
            };
        }
        return col;
    });

    const dataSource = Array.isArray(Data?.data)
        ? Data.data
        : Array.isArray(Data?.data?.items)
          ? Data.data.items
          : [];

    return (
        <Table
            columns={enhancedColumns}
            rowKey={(record) => (keyTable && record?.[keyTable] ? record[keyTable] : uuidv4())}
            size={size ? size : 'middle'}
            locale={{ emptyText: loading ? '-' : null }}
            dataSource={dataSource}
            pagination={{
                ...tableParams.pagination,
                total: totalCount,
                showSizeChanger: true,
                showTotal: (total, range) =>
                    `${range[0]}-${range[1]} dari ${Helper.numFormat(total)} Data`,
            }}
            loading={{
                spinning: loading,
            }}
            scroll={{ x: 800 }}
            onChange={handleTableChange}
            rowSelection={
                isSelected
                    ? {
                          selectedRowKeys,
                          onChange: (newSelectedRowKeys, newSelectedRows) => {
                              setDataRowSelected(newSelectedRows);
                              onSelectChange(newSelectedRowKeys);
                          },
                      }
                    : customRowSelection
                      ? customRowSelection
                      : false
            }
        />
    );
}

export default React.memo(DTAntServerSide);
