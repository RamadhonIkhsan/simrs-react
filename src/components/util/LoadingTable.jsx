import { Skeleton } from 'antd';

export default function LoadingTable() {
    return (
        <div className="selecton-wrap">
            <Skeleton.Button active size="default" shape="round" block />
        </div>
    );
}
