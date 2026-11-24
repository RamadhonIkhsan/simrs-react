import React from 'react';
import { Table } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import LoadingTable from '@/components/util/LoadingTable';

function DTAnt({ columnTable, data, loadingTable, size, pageSize, rowKey }) {
    return (
        <Table
            loading={{
                spinning: loadingTable,
                indicator: <LoadingTable />,
            }}
            locale={{ emptyText: loadingTable ? '-' : null }}
            columns={columnTable}
            dataSource={data}
            rowKey={(record) => (rowKey && record?.[rowKey] ? record[rowKey] : uuidv4())}
            size={size ? size : 'middle'}
            pagination={{
                defaultPageSize: pageSize ? pageSize : 10,
                pageSizeOptions: ['5', '10', '20', '30', '40'],
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} Data`,
            }}
        />
    );
}

export default React.memo(DTAnt);
